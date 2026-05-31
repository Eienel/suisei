/// Suisei quest completion badge.
///
/// One soulbound object per (player, quest_id). No `store` ability, so
/// it cannot be wrapped or transferred after minting. The mint entry
/// is permissionless - verification that the player actually finished
/// the quest happens off-chain via the in-app PTB sequence (each prior
/// quest's required deploy + interact step is recorded on-chain in its
/// own package).
module suisei::badge {
    use std::string::{Self, String};
    use sui::event;

    /// Soulbound. Note the absence of `store` - only `key`.
    public struct Badge has key {
        id: UID,
        quest_id: String,
        quest_number: u8,
        minted_at_ms: u64,
        minter: address,
    }

    public struct BadgeMinted has copy, drop {
        badge_id: ID,
        recipient: address,
        quest_id: String,
        quest_number: u8,
    }

    /// Mint a badge directly to `recipient`. `quest_id` is the string
    /// id used in the front-end (e.g. "zklogin"); `quest_number` is
    /// 1..8 for ordering on the leaderboard.
    public entry fun mint(
        recipient: address,
        quest_id: vector<u8>,
        quest_number: u8,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext,
    ) {
        let badge = Badge {
            id: object::new(ctx),
            quest_id: string::utf8(quest_id),
            quest_number,
            minted_at_ms: sui::clock::timestamp_ms(clock),
            minter: tx_context::sender(ctx),
        };
        event::emit(BadgeMinted {
            badge_id: object::id(&badge),
            recipient,
            quest_id: badge.quest_id,
            quest_number,
        });
        transfer::transfer(badge, recipient);
    }

    // ---------- views (for the Profile / Leaderboard page) ----------
    public fun quest_id(b: &Badge): &String { &b.quest_id }
    public fun quest_number(b: &Badge): u8 { b.quest_number }
    public fun minted_at_ms(b: &Badge): u64 { b.minted_at_ms }
    public fun minter(b: &Badge): address { b.minter }
}
