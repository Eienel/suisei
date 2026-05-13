/// BlockBuilders — a World NFT that points to evolving 3D world metadata
/// stored off-chain (Walrus / IPFS). Owners can mint a World and update
/// its metadata URI as they build; every update bumps the version and
/// emits an event for indexers.
module blockbuilders::world;

use std::string::{Self, String};
use sui::event;

public struct World has key, store {
    id: UID,
    name: String,
    metadata_uri: String,
    version: u64,
    block_count: u64,
}

public struct WorldMinted has copy, drop {
    world_id: address,
    owner: address,
    metadata_uri: String,
}

public struct WorldUpdated has copy, drop {
    world_id: address,
    version: u64,
    metadata_uri: String,
    block_count: u64,
}

/// Mint a new World NFT. Sent to the caller; they can update_world from
/// there. `name` and `metadata_uri` are bounded by tx size; the URI
/// typically points to a Walrus blob or IPFS CID.
public entry fun mint_world(
    name: vector<u8>,
    metadata_uri: vector<u8>,
    block_count: u64,
    ctx: &mut TxContext,
) {
    let sender = ctx.sender();
    let world = World {
        id: object::new(ctx),
        name: string::utf8(name),
        metadata_uri: string::utf8(metadata_uri),
        version: 1,
        block_count,
    };
    event::emit(WorldMinted {
        world_id: world.id.to_address(),
        owner: sender,
        metadata_uri: world.metadata_uri,
    });
    transfer::public_transfer(world, sender);
}

/// Update an existing World's metadata. Only the holder can call this
/// (since they must pass a &mut to the object they own).
public entry fun update_world(
    world: &mut World,
    new_metadata_uri: vector<u8>,
    new_block_count: u64,
    _ctx: &mut TxContext,
) {
    world.version = world.version + 1;
    world.metadata_uri = string::utf8(new_metadata_uri);
    world.block_count = new_block_count;
    event::emit(WorldUpdated {
        world_id: world.id.to_address(),
        version: world.version,
        metadata_uri: world.metadata_uri,
        block_count: world.block_count,
    });
}

/// Rename a World. Cheap operation — doesn't bump version.
public entry fun rename(world: &mut World, new_name: vector<u8>, _ctx: &mut TxContext) {
    world.name = string::utf8(new_name);
}

// Read-only accessors for indexers / clients.
public fun name(w: &World): &String { &w.name }
public fun metadata_uri(w: &World): &String { &w.metadata_uri }
public fun version(w: &World): u64 { w.version }
public fun block_count(w: &World): u64 { w.block_count }

#[test_only]
public fun assert_consistent(world: &World) {
    assert!(world.version > 0, 0);
}
