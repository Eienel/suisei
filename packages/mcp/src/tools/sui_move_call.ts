import { Transaction, type TransactionObjectArgument } from '@mysten/sui/transactions';
import { clientFor, type Network } from '../sui-client.js';
import { buildToB64 } from '../tx.js';

interface Args {
  target: string;
  type_arguments: string[];
  arguments: string[];
  sender: string;
  network: Network;
}

/**
 * Build (do not sign) a transaction that calls ANY Move entry function.
 * This is the universal write primitive — the generic form of every
 * purpose-built mint/transfer tool.
 *
 * Each argument is a string in one of these forms:
 *   - `object:<id>`              an owned/shared object by id
 *   - `pure:address:<0x..>`
 *   - `pure:id:<0x..>`
 *   - `pure:bool:<true|false>`
 *   - `pure:string:<text>`
 *   - `pure:u8|u16|u32|u64|u128|u256:<number>`
 *
 * Vector and nested-struct arguments are intentionally out of scope for
 * the generic tool — write a dedicated tool for those so the schema
 * stays unambiguous for the calling agent.
 */
export async function suiMoveCall(raw: unknown): Promise<string> {
  const { target, type_arguments, arguments: args, sender, network } = raw as Args;

  if (!/^0x[0-9a-fA-F]+::[A-Za-z_][\w]*::[A-Za-z_][\w]*$/.test(target)) {
    throw new Error(`Bad target "${target}": expected "0xpkg::module::function".`);
  }

  const client = clientFor(network);
  const tx = new Transaction();
  tx.moveCall({
    target,
    typeArguments: type_arguments,
    arguments: args.map((a) => applyMoveArg(tx, a)),
  });
  tx.setSender(sender);

  const tx_bytes_base64 = await buildToB64(tx, client);
  return JSON.stringify({
    tx_bytes_base64,
    target,
    type_arguments,
    sender,
    network,
    next_step:
      'Dry-run with sui_dry_run, then sign and submit with sui_execute_signed_tx.',
  });
}

function applyMoveArg(tx: Transaction, arg: string): TransactionObjectArgument {
  const firstColon = arg.indexOf(':');
  if (firstColon === -1) {
    throw new Error(`Bad argument "${arg}": expected "object:<id>" or "pure:<type>:<value>".`);
  }
  const kind = arg.slice(0, firstColon);

  if (kind === 'object') {
    return tx.object(arg.slice(firstColon + 1));
  }
  if (kind === 'pure') {
    const rest = arg.slice(firstColon + 1);
    const sep = rest.indexOf(':');
    if (sep === -1) {
      throw new Error(`Bad pure argument "${arg}": expected "pure:<type>:<value>".`);
    }
    const type = rest.slice(0, sep);
    const value = rest.slice(sep + 1);
    switch (type) {
      case 'address':
        return tx.pure.address(value);
      case 'id':
        return tx.pure.id(value);
      case 'bool':
        return tx.pure.bool(value === 'true');
      case 'string':
        return tx.pure.string(value);
      case 'u8':
        return tx.pure.u8(Number(value));
      case 'u16':
        return tx.pure.u16(Number(value));
      case 'u32':
        return tx.pure.u32(Number(value));
      case 'u64':
        return tx.pure.u64(BigInt(value));
      case 'u128':
        return tx.pure.u128(BigInt(value));
      case 'u256':
        return tx.pure.u256(BigInt(value));
      default:
        throw new Error(`Unsupported pure type "${type}" in "${arg}".`);
    }
  }
  throw new Error(`Unknown argument kind "${kind}" in "${arg}".`);
}
