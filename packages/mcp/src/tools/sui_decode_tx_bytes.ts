import { Transaction } from '@mysten/sui/transactions';
import { bcs } from '@mysten/sui/bcs';

interface Args {
  tx_bytes_base64: string;
}

/**
 * Decode unsigned tx bytes (from any builder tool) back into a structured,
 * human-readable summary: sender, gas data, inputs, and a step-by-step
 * list of commands ("split N MIST from gas", "transfer to 0x...",
 * "call pkg::module::function with [args]").
 *
 * The "look before you sign" tool. A wallet shows the user what they're
 * authorising; this lets an agent - or a person reading the agent's
 * output - verify a built tx matches the stated intent. Pairs naturally
 * with sui_dry_run for cost; this one is about *meaning*.
 *
 * Works offline (no RPC). All addresses are kept full-form so the caller
 * can match them against expected values.
 */
export async function suiDecodeTxBytes(raw: unknown): Promise<string> {
  const { tx_bytes_base64 } = raw as Args;
  const bytes = new Uint8Array(Buffer.from(tx_bytes_base64, 'base64'));
  const tx = Transaction.from(bytes);
  const data = tx.getData();

  const inputs = data.inputs.map((input, i) => describeInput(input, i));

  const commands = data.commands.map((c, i) => {
    const kind = (c as { $kind: string }).$kind;
    return { index: i, kind, summary: describeCommand(c, inputs), raw: c };
  });

  return JSON.stringify({
    sender: data.sender,
    gas_data: {
      budget: data.gasData.budget,
      price: data.gasData.price,
      owner: data.gasData.owner,
      payment_count: data.gasData.payment?.length ?? 0,
    },
    expiration: data.expiration,
    inputs,
    command_count: commands.length,
    commands,
    plain_english: commands.map((c) => `${c.index + 1}. ${c.summary}`).join('\n'),
    note: "Decoded from BCS offline. Compare against the agent's stated intent before signing.",
  });
}

interface DecodedInput {
  index: number;
  kind: string;
  value: unknown;
  pretty: string;
}

function describeInput(input: unknown, i: number): DecodedInput {
  const kind = (input as { $kind: string }).$kind;
  if (kind === 'Pure') {
    const b64 = (input as { Pure: { bytes: string } }).Pure.bytes;
    const raw = new Uint8Array(Buffer.from(b64, 'base64'));
    const guess = guessPure(raw);
    return { index: i, kind: 'Pure', value: guess.value, pretty: guess.pretty };
  }
  if (kind === 'Object') {
    const inner = (input as { Object: Record<string, unknown> }).Object;
    const objKind = (inner as { $kind: string }).$kind;
    const objectId =
      (inner as { ImmOrOwnedObject?: { objectId: string } }).ImmOrOwnedObject?.objectId ??
      (inner as { SharedObject?: { objectId: string } }).SharedObject?.objectId ??
      (inner as { Receiving?: { objectId: string } }).Receiving?.objectId ??
      null;
    return {
      index: i,
      kind: `Object/${objKind}`,
      value: objectId,
      pretty: objectId ? `object ${objectId}` : `object (${objKind})`,
    };
  }
  return { index: i, kind, value: input, pretty: `${kind} (raw)` };
}

function guessPure(bytes: Uint8Array): { value: unknown; pretty: string } {
  // Addresses / object ids are 32 bytes; u64s are 8.
  if (bytes.length === 32) {
    const hex = '0x' + Buffer.from(bytes).toString('hex');
    return { value: hex, pretty: `address ${hex}` };
  }
  if (bytes.length === 8) {
    try {
      const n = bcs.U64.parse(bytes);
      return { value: n.toString(), pretty: `u64 ${n.toString()}` };
    } catch {
      /* fall through */
    }
  }
  if (bytes.length === 1) return { value: bytes[0], pretty: `u8 ${bytes[0]}` };
  // Best effort: try utf-8
  const text = Buffer.from(bytes).toString('utf8');
  if (/^[\x20-\x7e]+$/.test(text)) return { value: text, pretty: `string \"${text}\"` };
  return {
    value: Buffer.from(bytes).toString('hex'),
    pretty: `bytes 0x${Buffer.from(bytes).toString('hex')}`,
  };
}

function describeCommand(cmd: unknown, inputs: DecodedInput[]): string {
  const kind = (cmd as { $kind: string }).$kind;
  const refStr = (ref: unknown): string => {
    if (!ref || typeof ref !== 'object') return String(ref);
    const k = (ref as { $kind: string }).$kind;
    if (k === 'Input') return inputs[(ref as { Input: number }).Input]?.pretty ?? `input#${(ref as { Input: number }).Input}`;
    if (k === 'GasCoin') return 'gas coin';
    if (k === 'Result') return `result#${(ref as { Result: number }).Result}`;
    if (k === 'NestedResult') {
      const nr = (ref as { NestedResult: [number, number] }).NestedResult;
      return `command#${nr[0]} result[${nr[1]}]`;
    }
    return k;
  };

  if (kind === 'SplitCoins') {
    const c = (cmd as { SplitCoins: { coin: unknown; amounts: unknown[] } }).SplitCoins;
    return `Split [${c.amounts.map(refStr).join(', ')}] MIST from ${refStr(c.coin)}.`;
  }
  if (kind === 'TransferObjects') {
    const c = (cmd as { TransferObjects: { objects: unknown[]; address: unknown } }).TransferObjects;
    return `Transfer [${c.objects.map(refStr).join(', ')}] to ${refStr(c.address)}.`;
  }
  if (kind === 'MergeCoins') {
    const c = (cmd as { MergeCoins: { destination: unknown; sources: unknown[] } }).MergeCoins;
    return `Merge [${c.sources.map(refStr).join(', ')}] into ${refStr(c.destination)}.`;
  }
  if (kind === 'MoveCall') {
    const c = (cmd as {
      MoveCall: {
        package: string;
        module: string;
        function: string;
        typeArguments: string[];
        arguments: unknown[];
      };
    }).MoveCall;
    const target = `${c.package}::${c.module}::${c.function}`;
    const types = c.typeArguments?.length ? `<${c.typeArguments.join(', ')}>` : '';
    const args = c.arguments?.map(refStr).join(', ') ?? '';
    return `Call ${target}${types}(${args}).`;
  }
  if (kind === 'MakeMoveVec') {
    const c = (cmd as { MakeMoveVec: { type: string | null; elements: unknown[] } }).MakeMoveVec;
    return `Make Move vector${c.type ? ` of ${c.type}` : ''} from [${c.elements.map(refStr).join(', ')}].`;
  }
  if (kind === 'Publish') return `Publish a new Move package.`;
  if (kind === 'Upgrade') return `Upgrade an existing Move package.`;
  return `${kind} (raw)`;
}
