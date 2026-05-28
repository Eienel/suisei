import { Transaction } from '@mysten/sui/transactions';
import { clientFor, type Network } from '../sui-client.js';

interface Args {
  recipient: string;
  quest_id: string;
  quest_number: number;
  badge_package: string;
  network: Network;
}

/**
 * Build (do not execute) a PTB that calls the canonical Suisei badge
 * mint entry. Returns base64 transaction bytes that the caller can
 * hand to a signer. Why "build, not execute": MCP tools should not
 * spend the user's gas without an explicit signing step.
 */
export async function suiMintBadge(raw: unknown): Promise<string> {
  const { recipient, quest_id, quest_number, badge_package, network } = raw as Args;
  const client = clientFor(network);

  const tx = new Transaction();
  tx.moveCall({
    target: `${badge_package}::badge::mint`,
    arguments: [
      tx.pure.address(recipient),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(quest_id))),
      tx.pure.u8(quest_number),
      tx.object('0x6'),
    ],
  });
  tx.setSender(recipient);

  const bytes = await tx.build({ client });
  return JSON.stringify({
    tx_bytes_base64: bytesToB64(bytes),
    target: `${badge_package}::badge::mint`,
    recipient,
    quest_id,
    quest_number,
    network,
    next_step:
      'Sign tx_bytes_base64 with the recipient key, then submit via SuiClient.executeTransactionBlock.',
  });
}

function bytesToB64(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return Buffer.from(s, 'binary').toString('base64');
}
