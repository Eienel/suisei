# Suisei Examples

Practical showcases of the Suisei MCP toolkit in action.

## Portfolio Rebalancer Agent

An agent that analyzes a Sui wallet's position and recommends optimizations.

**What it demonstrates:**
- Using `sui_get_portfolio` to read a wallet's full position
- Using `sui_get_validators_apy` to compare staking options
- Agent reasoning over structured data from the toolkit
- Building recommendations without needing to sign/submit

**Run it:**

```bash
# With the MCP server running:
npx ts-node portfolio-rebalancer.ts 0x... testnet
```

**Key insight:** The MCP toolkit enables agents to reason about on-chain data and give structured recommendations. The agent is the narrator; the toolkit provides the facts.

## Coming Soon

- **MnemoSui Agent** — an agent with persistent memory across sessions
- **Policy Vault Agent** — demonstrating bounded delegation
- **TxLens Validator** — agents that explain and validate before signing
