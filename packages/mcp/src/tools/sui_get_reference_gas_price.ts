import { clientFor, type Network } from '../sui-client.js';

interface Args {
  network: Network;
}

/**
 * Current reference gas price (in MIST) for the network. An agent can use
 * it to estimate fees or set a gas price before building a transaction.
 */
export async function suiGetReferenceGasPrice(raw: unknown): Promise<string> {
  const { network } = raw as Args;
  const client = clientFor(network);
  const price = await client.getReferenceGasPrice();
  return JSON.stringify({
    network,
    reference_gas_price_mist: price.toString(),
  });
}
