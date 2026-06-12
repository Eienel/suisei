import { Transaction } from '@mysten/sui/transactions';
import { clientFor, type Network } from '../sui-client.js';
import { buildToB64 } from '../tx.js';

interface Args {
  sender: string;
  network: Network;
  mnemosui_package?: string;
}

/**
 * Create a new MemoryBook for an agent. The book is transferred to the
 * sender and is ready to receive memories via mnemosui_save.
 *
 * The MemoryBook is owned, so the agent owns its memories. If you transfer
 * the book to someone else, they can read your memories - this is the
 * portability feature.
 */
export async function mnemosuiCreate(raw: unknown): Promise<string> {
  const a = raw as Args;
  const pkg = a.mnemosui_package ?? '0x0'; // Replaced at publish

  const tx = new Transaction();
  tx.setSender(a.sender);
  tx.moveCall({
    target: `${pkg}::memory_book::create`,
    arguments: [tx.object('0x6')], // Clock
  });

  const client = clientFor(a.network);
  const tx_bytes_base64 = await buildToB64(tx, client);

  return JSON.stringify({
    tx_bytes_base64,
    target: `${pkg}::memory_book::create`,
    sender: a.sender,
    network: a.network,
    next_step:
      'Sign and submit. You will receive a MemoryBook object in your wallet - this is your agent brain.',
  });
}
