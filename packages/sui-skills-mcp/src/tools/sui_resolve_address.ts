import { clientFor, type Network } from '../sui-client.js';

interface Args {
  name_or_address: string;
  network: Network;
}

/**
 * If the input is a 0x address, return it canonicalized. Otherwise
 * treat it as a SuiNS name and resolve. Reasoning: tools should never
 * fail just because the user gave the input it expected anyway.
 */
export async function suiResolveAddress(raw: unknown): Promise<string> {
  const { name_or_address, network } = raw as Args;
  if (/^0x[0-9a-fA-F]+$/.test(name_or_address)) {
    return JSON.stringify({
      address: name_or_address.toLowerCase(),
      source: 'literal',
    });
  }
  const client = clientFor(network);
  const result = await client.resolveNameServiceAddress({ name: name_or_address });
  if (!result) {
    throw new Error(`SuiNS name not found: ${name_or_address}`);
  }
  return JSON.stringify({ address: result, source: 'suins', name: name_or_address });
}
