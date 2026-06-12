import { suiMoveCall } from './sui_move_call.js';

interface Args {
  memory_book_id: string;
  sender: string;
  blob_id: string;
  tag: string;
  content_hash?: string;
  network: 'testnet' | 'mainnet' | 'devnet';
  mnemosui_package?: string;
}

/**
 * Append a memory to a MnemoSui MemoryBook. Use after walrus_publish.
 *
 * The workflow:
 * 1. walrus_publish -> get blob_id
 * 2. mnemosui_save -> append the memory record on-chain (with the blob_id)
 * 3. Agent signs and submits the tx
 *
 * The agent's memory is now: indexed on-chain (MemoryBook), content on
 * Walrus. The agent can transfer the MemoryBook to anyone; they can read
 * the same memories.
 */
export async function mnemosuiSave(raw: unknown): Promise<string> {
  const a = raw as Args;
  const pkg = a.mnemosui_package ?? '0x0'; // Replaced at publish

  // Build the on-chain append tx.
  const result = await suiMoveCall({
    target: `${pkg}::memory_book::append`,
    type_arguments: [],
    arguments: [
      `object:${a.memory_book_id}`,
      `pure:string:${a.blob_id}`,
      `pure:string:${a.tag}`,
      `pure:string:${a.content_hash ?? 'nohash'}`,
      `pure:bool:false`, // encrypted flag (Seal integration later)
    ],
    sender: a.sender,
    network: a.network,
  });

  return result;
}
