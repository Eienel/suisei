import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { SuiGrpcClient } from '@mysten/sui/grpc';

export type Network = 'testnet' | 'mainnet' | 'devnet';

/**
 * Transport seam for the Sui Stack.
 *
 * Sui is deprecating public JSON-RPC fullnode endpoints (~mid-2026) in
 * favour of gRPC and GraphQL. This file is the single place transport is
 * chosen, so the rest of the toolkit never imports a client directly.
 *
 * Why JSON-RPC is still the default for `clientFor()`:
 * building a transaction with `tx.build({ client })` needs *transaction
 * resolution* (resolving object refs and gas coins). As of @mysten/sui
 * 1.45.x that is implemented only for the JSON-RPC `SuiClient`. Verified
 * against testnet:
 *   - SuiGrpcClient     → "Transaction resolution is not supported with
 *                          the GRPC client"
 *   - SuiGraphQLClient  → "GraphQL client does not support transaction
 *                          resolution yet"
 * So every transaction-building tool (move_call, transfer, stake,
 * unstake, mint_badge) must stay on JSON-RPC until the SDK ships build
 * support over gRPC/GraphQL.
 *
 * Migration trigger: once `tx.build({ client: grpcClientFor(net) })`
 * succeeds on a current SDK, switch `clientFor` to return the gRPC client
 * and delete this note. Reads already work over gRPC today via
 * `grpcClientFor()` below — wire individual read tools to it whenever we
 * choose to move them off JSON-RPC ahead of the cutoff.
 */

/** gRPC-web fullnode endpoints, by network. */
const GRPC_URL: Record<Network, string> = {
  testnet: 'https://fullnode.testnet.sui.io:443',
  mainnet: 'https://fullnode.mainnet.sui.io:443',
  devnet: 'https://fullnode.devnet.sui.io:443',
};

const jsonRpcCache = new Map<Network, SuiClient>();
const grpcCache = new Map<Network, SuiGrpcClient>();

/**
 * The build-capable client every tool uses today. JSON-RPC until the SDK
 * supports transaction resolution over gRPC/GraphQL (see note above).
 */
export function clientFor(network: Network): SuiClient {
  let c = jsonRpcCache.get(network);
  if (!c) {
    c = new SuiClient({ url: getFullnodeUrl(network) });
    jsonRpcCache.set(network, c);
  }
  return c;
}

/**
 * gRPC client — the forward-looking transport. Reads (balances, coins,
 * owned objects, dynamic fields, gas price, getTransaction, dryRun,
 * execute) work today; transaction *building* does not yet. Exposed so
 * read tools can migrate incrementally and so the eventual cutover is a
 * one-line change in `clientFor`.
 */
export function grpcClientFor(network: Network): SuiGrpcClient {
  let c = grpcCache.get(network);
  if (!c) {
    c = new SuiGrpcClient({ network, baseUrl: GRPC_URL[network] });
    grpcCache.set(network, c);
  }
  return c;
}
