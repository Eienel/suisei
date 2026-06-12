/// Tier 2: Policy Vault for agent wallets.
///
/// An agent wallet (from Tier 1) gains bounded control over funds via an
/// on-chain policy. The vault holds SUI and enforces per-tx limits,
/// 24-hour rolling limits, recipient allowlists, and expiry.
///
/// Owner functions (require OwnerCap): create vault, grant policy to an
/// agent, deposit/withdraw, revoke. Agent functions (require sender in
/// policy table): spend_sui, stake via the vault.
///
/// This composes with Tier 1: the agent key from Tier 1 is the same key
/// that spends *via the vault* instead of from its own balance.
module suisei::agent_vault {
    use sui::balance::{Self, Balance};
    use sui::coin::{Self, Coin};
    use sui::event;
    use sui::object_table::{Self, ObjectTable};
    use sui::sui::SUI;
    use sui::table::{Self, Table};

    const ERR_NOT_OWNER: u64 = 0;
    const ERR_NOT_AGENT: u64 = 1;
    const ERR_POLICY_EXPIRED: u64 = 2;
    const ERR_TX_LIMIT_EXCEEDED: u64 = 3;
    const ERR_DAILY_LIMIT_EXCEEDED: u64 = 4;
    const ERR_RECIPIENT_NOT_ALLOWED: u64 = 5;
    const ERR_INSUFFICIENT_BALANCE: u64 = 6;

    /// The vault owner's capability. Required to create, grant, revoke
    /// policies and to deposit/withdraw.
    public struct OwnerCap has key {
        id: UID,
        vault_id: ID,
    }

    /// The vault, shared and mutable. Holds the SUI balance and the
    /// policy table mapping agent addresses to their limits.
    public struct Vault has key {
        id: UID,
        balance: Balance<SUI>,
        policies: Table<address, Policy>,
    }

    /// A spending policy for one agent.
    public struct Policy has store, copy, drop {
        per_tx_limit: u64,
        daily_limit: u64,
        daily_spent_at_ms: u64, // timestamp of the start of the current 24h window
        daily_spent_mist: u64,  // amount spent in the current 24h window
        allowed_recipients: vector<address>, // empty = anywhere
        expires_at_ms: u64,     // policy power expires; use Clock to check
    }

    public struct PolicyGranted has copy, drop {
        vault_id: ID,
        agent: address,
        per_tx_limit: u64,
        daily_limit: u64,
        expires_at_ms: u64,
    }

    public struct PolicyRevoked has copy, drop {
        vault_id: ID,
        agent: address,
    }

    public struct Spent has copy, drop {
        vault_id: ID,
        agent: address,
        amount: u64,
        recipient: address,
    }

    /// Create a new vault and return the OwnerCap.
    public entry fun create_vault(ctx: &mut TxContext) {
        let vault_id = object::new(ctx);
        let vault_id_copy = object::uid_to_inner(&vault_id);
        let vault = Vault {
            id: vault_id,
            balance: balance::zero(),
            policies: table::new(ctx),
        };
        transfer::share_object(vault);
        transfer::transfer(
            OwnerCap {
                id: object::new(ctx),
                vault_id: vault_id_copy,
            },
            tx_context::sender(ctx),
        );
    }

    /// Deposit SUI into the vault.
    public entry fun deposit(
        owner_cap: &OwnerCap,
        vault: &mut Vault,
        coin: Coin<SUI>,
    ) {
        assert!(owner_cap.vault_id == object::id(vault), ERR_NOT_OWNER);
        let amount = coin::value(&coin);
        balance::join(&mut vault.balance, coin::into_balance(coin));
        event::emit(event::Spent {
            vault_id: object::id(vault),
            agent: @0x0, // 0x0 signals a deposit
            amount,
            recipient: @0x0,
        });
    }

    /// Withdraw SUI from the vault. Only the owner can do this.
    public entry fun withdraw(
        owner_cap: &OwnerCap,
        vault: &mut Vault,
        amount: u64,
        ctx: &mut TxContext,
    ) {
        assert!(owner_cap.vault_id == object::id(vault), ERR_NOT_OWNER);
        assert!(balance::value(&vault.balance) >= amount, ERR_INSUFFICIENT_BALANCE);
        let coin = coin::from_balance(balance::split(&mut vault.balance, amount), ctx);
        transfer::public_transfer(coin, tx_context::sender(ctx));
    }

    /// Grant a spending policy to an agent. Only the owner can do this.
    /// agent: the address that will spend via this vault
    /// per_tx_limit: max amount per single transaction (in MIST)
    /// daily_limit: max amount per 24-hour window (in MIST)
    /// allowed_recipients: empty = agent can spend to any address;
    ///                     non-empty = agent can only send to these addresses
    /// expires_at_ms: absolute timestamp when this policy expires
    public entry fun grant_policy(
        owner_cap: &OwnerCap,
        vault: &mut Vault,
        agent: address,
        per_tx_limit: u64,
        daily_limit: u64,
        allowed_recipients: vector<address>,
        expires_at_ms: u64,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext,
    ) {
        assert!(owner_cap.vault_id == object::id(vault), ERR_NOT_OWNER);
        let now_ms = sui::clock::timestamp_ms(clock);
        let policy = Policy {
            per_tx_limit,
            daily_limit,
            daily_spent_at_ms: now_ms,
            daily_spent_mist: 0,
            allowed_recipients,
            expires_at_ms,
        };
        table::add(&mut vault.policies, agent, policy);
        event::emit(PolicyGranted {
            vault_id: object::id(vault),
            agent,
            per_tx_limit,
            daily_limit,
            expires_at_ms,
        });
    }

    /// Revoke an agent's policy. Only the owner can do this.
    public entry fun revoke_policy(
        owner_cap: &OwnerCap,
        vault: &mut Vault,
        agent: address,
    ) {
        assert!(owner_cap.vault_id == object::id(vault), ERR_NOT_OWNER);
        let _policy = table::remove(&mut vault.policies, agent);
        event::emit(PolicyRevoked {
            vault_id: object::id(vault),
            agent,
        });
    }

    /// Spend SUI from the vault. Only an agent with an active policy can call.
    /// The agent sends `amount` MIST to `recipient`.
    public entry fun spend_sui(
        vault: &mut Vault,
        amount: u64,
        recipient: address,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext,
    ) {
        let agent = tx_context::sender(ctx);
        assert!(table::contains(&vault.policies, agent), ERR_NOT_AGENT);

        let policy = table::borrow_mut(&mut vault.policies, agent);
        let now_ms = sui::clock::timestamp_ms(clock);

        // Check expiry.
        assert!(policy.expires_at_ms > now_ms, ERR_POLICY_EXPIRED);

        // Check per-tx limit.
        assert!(amount <= policy.per_tx_limit, ERR_TX_LIMIT_EXCEEDED);

        // Check and update daily limit (24h rolling window).
        if (now_ms - policy.daily_spent_at_ms >= 86400000) {
            // 24h elapsed, reset window.
            policy.daily_spent_at_ms = now_ms;
            policy.daily_spent_mist = 0;
        }
        assert!(policy.daily_spent_mist + amount <= policy.daily_limit, ERR_DAILY_LIMIT_EXCEEDED);
        policy.daily_spent_mist = policy.daily_spent_mist + amount;

        // Check recipient allowlist (empty = anywhere).
        if (!vector::is_empty(&policy.allowed_recipients)) {
            assert!(vector::contains(&policy.allowed_recipients, &recipient), ERR_RECIPIENT_NOT_ALLOWED);
        }

        // Spend.
        assert!(balance::value(&vault.balance) >= amount, ERR_INSUFFICIENT_BALANCE);
        let coin = coin::from_balance(balance::split(&mut vault.balance, amount), ctx);
        transfer::public_transfer(coin, recipient);

        event::emit(Spent {
            vault_id: object::id(vault),
            agent,
            amount,
            recipient,
        });
    }

    // ---------- views ----------
    public fun balance(vault: &Vault): u64 {
        balance::value(&vault.balance)
    }

    public fun has_policy(vault: &Vault, agent: address): bool {
        table::contains(&vault.policies, agent)
    }

    public fun policy_per_tx_limit(policy: &Policy): u64 {
        policy.per_tx_limit
    }

    public fun policy_daily_limit(policy: &Policy): u64 {
        policy.daily_limit
    }

    public fun policy_daily_spent(policy: &Policy): u64 {
        policy.daily_spent_mist
    }

    public fun policy_expires_at_ms(policy: &Policy): u64 {
        policy.expires_at_ms
    }
}
