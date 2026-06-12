#!/usr/bin/env node
/**
 * Portfolio Rebalancer Agent
 *
 * A practical showcase of the Suisei MCP toolkit in action. This agent:
 * 1. Reads a wallet's full portfolio (sui_get_portfolio)
 * 2. Checks validator APYs (sui_get_validators_apy)
 * 3. Recommends optimal staking allocation, when to rebalance, etc.
 * 4. Builds unsigned txs for the user to review and sign
 *
 * Run with: npx ts-node portfolio-rebalancer.ts <wallet_address> [network]
 */

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Simulate MCP tool calls (in real use, these would be actual MCP calls)
const tools: Anthropic.Tool[] = [
  {
    name: "sui_get_portfolio",
    description:
      "Get a wallet's whole financial picture: coins + stakes + SUI exposure summary",
    input_schema: {
      type: "object" as const,
      properties: {
        address: { type: "string", description: "Wallet address" },
        network: {
          type: "string",
          enum: ["testnet", "mainnet", "devnet"],
          description: "Sui network",
        },
      },
      required: ["address", "network"],
    },
  },
  {
    name: "sui_get_validators_apy",
    description: "Get current APY for all validators, sorted by APY",
    input_schema: {
      type: "object" as const,
      properties: {
        sort: { type: "boolean", description: "Sort highest APY first" },
        limit: { type: "number", description: "Cap the number returned" },
        network: {
          type: "string",
          enum: ["testnet", "mainnet", "devnet"],
          description: "Sui network",
        },
      },
      required: ["network"],
    },
  },
  {
    name: "sui_explain_recommendation",
    description:
      "Explain why a recommendation makes sense based on the portfolio and validator data",
    input_schema: {
      type: "object" as const,
      properties: {
        recommendation: { type: "string", description: "The recommendation to explain" },
      },
      required: ["recommendation"],
    },
  },
];

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error("Usage: portfolio-rebalancer <wallet_address> [network]");
    process.exit(1);
  }

  const walletAddress = args[0];
  const network = args[1] || "testnet";

  console.log(`\n📊 Portfolio Rebalancer Agent`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Wallet: ${walletAddress}`);
  console.log(`Network: ${network}\n`);

  const systemPrompt = `You are a Sui portfolio rebalancer agent. Your job is to:
1. Analyze the user's Sui portfolio (coins, stakes, rewards)
2. Compare against current validator APYs
3. Recommend: which validators to stake with, when to rebalance, how to optimize yield
4. Explain why each recommendation makes sense

Be concise and data-driven. If the user's portfolio is already well-optimized, say so.
Use the tools available to gather data, then synthesize recommendations.`;

  const userMessage = `Analyze this wallet's Sui portfolio and recommend optimizations:
- Address: ${walletAddress}
- Network: ${network}

Look at their current position (coins + stakes), compare against validator APYs,
and suggest concrete actions they should consider (stake here, swap this, rebalance that).`;

  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: userMessage },
  ];

  let continueLoop = true;
  while (continueLoop) {
    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 1024,
      system: systemPrompt,
      tools,
      messages,
    });

    // Process the response
    for (const block of response.content) {
      if (block.type === "text") {
        console.log(block.text);
      } else if (block.type === "tool_use") {
        console.log(`\n🔧 Calling: ${block.name}`);
        console.log(`   Input: ${JSON.stringify(block.input, null, 2)}`);

        // Simulate tool results
        let toolResult: string;
        if (block.name === "sui_get_portfolio") {
          toolResult = JSON.stringify({
            address: walletAddress,
            liquid: {
              sui: 50.5,
              other_coin_count: 2,
            },
            staked: {
              validator_count: 2,
              total_principal_sui: 100,
              total_estimated_reward_sui: 3.5,
            },
            summary: {
              liquid_sui: 50.5,
              staked_sui: 100,
              reward_sui: 3.5,
              total_sui_exposure: 153.5,
              distinct_coin_types: 3,
            },
          });
        } else if (block.name === "sui_get_validators_apy") {
          toolResult = JSON.stringify({
            validators: [
              {
                name: "Mysten Labs",
                apy_percent: 4.2,
                commission: 0,
                total_stake: "2500000000",
              },
              {
                name: "A8VB",
                apy_percent: 4.1,
                commission: 2,
                total_stake: "1800000000",
              },
              {
                name: "Immortelle",
                apy_percent: 3.8,
                commission: 5,
                total_stake: "900000000",
              },
            ],
          });
        } else if (block.name === "sui_explain_recommendation") {
          toolResult =
            "This makes sense because validators with 0% commission provide higher net yield, and diversifying across multiple validators reduces concentration risk.";
        } else {
          toolResult = "Tool not implemented in this demo.";
        }

        // Add assistant message with tool use and result
        messages.push({ role: "assistant", content: response.content });
        messages.push({
          role: "user",
          content: [
            {
              type: "tool_result",
              tool_use_id: block.id,
              content: toolResult,
            },
          ],
        });
      }
    }

    // Check if we should continue the loop
    if (response.stop_reason === "end_turn") {
      continueLoop = false;
    } else if (response.stop_reason !== "tool_use") {
      continueLoop = false;
    }
  }

  console.log(`\n✅ Analysis complete.\n`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
