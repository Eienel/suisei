/// MnemoSui - a permanent, portable brain for AI agents.
///
/// A `MemoryBook` is an owned, transferable object. Each memory is a
/// small record `{ blob_id, tag, timestamp, content_hash, encrypted }`
/// stored as a dynamic field on the book; the content itself lives on
/// Walrus, identified by `blob_id`. The book is the index.
///
/// Because `MemoryBook` has `key + store`, the owner can `sui_transfer`
/// it to anyone - the recipient's agent then reads the same memories.
/// That portability is the whole point: the memory belongs to the user,
/// not to one vendor's app.
///
/// What lives where:
///   - content (chat text, embeddings, files) -> Walrus (walrus_publish)
///   - index entry (the Memory record)        -> a dynamic field on the book
///   - integrity                              -> content_hash on each entry
///
/// `encrypted` is a flag for when Seal is wired in; this module does not
/// itself encrypt anything. Until Seal lands, store plaintext blob ids
/// and set `encrypted = false`.
module mnemosui::memory_book {
    use std::string::{Self, String};
    use sui::dynamic_field as df;
    use sui::clock::{Self, Clock};
    use sui::event;

    // ---------- errors ----------

    /// No memory exists at the given index.
    const EMemoryNotFound: u64 = 0;

    // ---------- objects ----------

    /// The agent's brain. Owned and transferable (`key + store`).
    /// Memories are stored as dynamic fields keyed by their index
    /// (0, 1, 2, ...), so listing them is `sui_get_dynamic_fields` and
    /// reading one is `sui_get_object` on the child.
    public struct MemoryBook has key, store {
        id: UID,
        /// Convenience copy of the creator; the true owner is the object
        /// owner, which changes on transfer. Useful for display only.
        created_by: address,
        created_at_ms: u64,
        /// Total appends ever made. Also the next index to write, so it
        /// keeps increasing even after `forget` removes an entry.
        memory_count: u64,
    }

    /// One index entry. The content is on Walrus at `blob_id`.
    public struct Memory has store, drop {
        blob_id: String,
        tag: String,
        timestamp_ms: u64,
        content_hash: vector<u8>,
        encrypted: bool,
    }

    // ---------- events ----------

    public struct MemoryBookCreated has copy, drop {
        book_id: ID,
        created_by: address,
    }

    public struct MemoryAppended has copy, drop {
        book_id: ID,
        index: u64,
        tag: String,
        blob_id: String,
    }

    public struct MemoryForgotten has copy, drop {
        book_id: ID,
        index: u64,
    }

    // ---------- entry functions ----------

    /// Create a new MemoryBook and transfer it to the sender. Use this
    /// when an agent needs a fresh brain for a user.
    public entry fun create(clock: &Clock, ctx: &mut TxContext) {
        let book = new(clock, ctx);
        transfer::public_transfer(book, tx_context::sender(ctx));
    }

    /// Append a memory. `blob_id` is the Walrus blob id of the content;
    /// `content_hash` is the sha256 of that content (verify on read).
    /// The new entry's index is the current `memory_count`.
    public entry fun append(
        book: &mut MemoryBook,
        blob_id: vector<u8>,
        tag: vector<u8>,
        content_hash: vector<u8>,
        encrypted: bool,
        clock: &Clock,
        _ctx: &mut TxContext,
    ) {
        let index = book.memory_count;
        let memory = Memory {
            blob_id: string::utf8(blob_id),
            tag: string::utf8(tag),
            timestamp_ms: clock::timestamp_ms(clock),
            content_hash,
            encrypted,
        };
        event::emit(MemoryAppended {
            book_id: object::id(book),
            index,
            tag: memory.tag,
            blob_id: memory.blob_id,
        });
        df::add(&mut book.id, index, memory);
        book.memory_count = index + 1;
    }

    /// Forget (remove) the memory at `index`. The Walrus blob is not
    /// touched - only the on-chain index entry is dropped. `memory_count`
    /// is not decremented, so indices stay stable.
    public entry fun forget(book: &mut MemoryBook, index: u64, _ctx: &mut TxContext) {
        assert!(df::exists_(&book.id, index), EMemoryNotFound);
        let Memory { blob_id: _, tag: _, timestamp_ms: _, content_hash: _, encrypted: _ } =
            df::remove<u64, Memory>(&mut book.id, index);
        event::emit(MemoryForgotten {
            book_id: object::id(book),
            index,
        });
    }

    // ---------- constructor (for composability / tests) ----------

    /// Build a MemoryBook without transferring it. `create` wraps this.
    public fun new(clock: &Clock, ctx: &mut TxContext): MemoryBook {
        let book = MemoryBook {
            id: object::new(ctx),
            created_by: tx_context::sender(ctx),
            created_at_ms: clock::timestamp_ms(clock),
            memory_count: 0,
        };
        event::emit(MemoryBookCreated {
            book_id: object::id(&book),
            created_by: book.created_by,
        });
        book
    }

    // ---------- views ----------

    public fun memory_count(book: &MemoryBook): u64 { book.memory_count }
    public fun created_by(book: &MemoryBook): address { book.created_by }
    public fun created_at_ms(book: &MemoryBook): u64 { book.created_at_ms }

    /// True if a memory still exists at `index` (i.e. not forgotten).
    public fun has_memory(book: &MemoryBook, index: u64): bool {
        df::exists_(&book.id, index)
    }

    /// Borrow one memory record for reading.
    public fun borrow_memory(book: &MemoryBook, index: u64): &Memory {
        assert!(df::exists_(&book.id, index), EMemoryNotFound);
        df::borrow<u64, Memory>(&book.id, index)
    }

    public fun blob_id(m: &Memory): &String { &m.blob_id }
    public fun tag(m: &Memory): &String { &m.tag }
    public fun timestamp_ms(m: &Memory): u64 { m.timestamp_ms }
    public fun content_hash(m: &Memory): &vector<u8> { &m.content_hash }
    public fun encrypted(m: &Memory): bool { m.encrypted }

    // ---------- tests ----------

    #[test_only]
    use sui::test_scenario as ts;

    #[test]
    fun append_and_forget() {
        let owner = @0xA;
        let mut scenario = ts::begin(owner);
        let clock = clock::create_for_testing(ts::ctx(&mut scenario));

        let mut book = new(&clock, ts::ctx(&mut scenario));
        assert!(memory_count(&book) == 0, 0);

        append(
            &mut book,
            b"blob_one",
            b"chat",
            b"hash_one",
            false,
            &clock,
            ts::ctx(&mut scenario),
        );
        append(
            &mut book,
            b"blob_two",
            b"fact",
            b"hash_two",
            false,
            &clock,
            ts::ctx(&mut scenario),
        );
        assert!(memory_count(&book) == 2, 1);
        assert!(has_memory(&book, 0), 2);
        assert!(has_memory(&book, 1), 3);

        let m0 = borrow_memory(&book, 0);
        assert!(blob_id(m0) == &string::utf8(b"blob_one"), 4);
        assert!(tag(m0) == &string::utf8(b"chat"), 5);
        assert!(!encrypted(m0), 6);

        forget(&mut book, 0, ts::ctx(&mut scenario));
        assert!(!has_memory(&book, 0), 7);
        assert!(has_memory(&book, 1), 8);
        // count does not decrement; indices stay stable
        assert!(memory_count(&book) == 2, 9);

        // a fresh append takes the next index, not the freed one
        append(
            &mut book,
            b"blob_three",
            b"chat",
            b"hash_three",
            false,
            &clock,
            ts::ctx(&mut scenario),
        );
        assert!(has_memory(&book, 2), 10);
        assert!(memory_count(&book) == 3, 11);

        transfer::public_transfer(book, owner);
        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = EMemoryNotFound)]
    fun forget_missing_aborts() {
        let owner = @0xA;
        let mut scenario = ts::begin(owner);
        let clock = clock::create_for_testing(ts::ctx(&mut scenario));

        let mut book = new(&clock, ts::ctx(&mut scenario));
        // nothing at index 0 yet
        forget(&mut book, 0, ts::ctx(&mut scenario));

        transfer::public_transfer(book, owner);
        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }
}
