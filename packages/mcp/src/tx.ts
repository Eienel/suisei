import type { Transaction } from '@mysten/sui/transactions';
import type { SuiClient } from '@mysten/sui/client';

/** Encode raw bytes as base64 for transport in JSON tool output. */
export function toB64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64');
}

/** Decode base64 tx bytes back into a Uint8Array for dry-run / submit. */
export function fromB64(b64: string): Uint8Array {
  return new Uint8Array(Buffer.from(b64, 'base64'));
}

/**
 * Build (do not sign) a transaction and return base64 bytes. Every
 * tx-builder tool ends here: the toolkit never holds keys, so it hands
 * back bytes for the host to sign and submit.
 */
export async function buildToB64(tx: Transaction, client: SuiClient): Promise<string> {
  const bytes = await tx.build({ client });
  return toB64(bytes);
}
