import { clientFor, type Network } from '../sui-client.js';

interface Args {
  object_id: string;
  network: Network;
}

/**
 * Read any on-chain object's type, owner, content fields and Display.
 * The general primitive every other read tool is a special case of.
 */
export async function suiGetObject(raw: unknown): Promise<string> {
  const { object_id, network } = raw as Args;
  const client = clientFor(network);
  const res = await client.getObject({
    id: object_id,
    options: {
      showType: true,
      showOwner: true,
      showContent: true,
      showDisplay: true,
    },
  });

  if (res.error) {
    throw new Error(`Object ${object_id} not readable: ${JSON.stringify(res.error)}`);
  }

  const data = res.data;
  const content = data?.content;
  const fields =
    content && content.dataType === 'moveObject'
      ? (content.fields as Record<string, unknown>)
      : null;

  return JSON.stringify({
    object_id,
    network,
    type: data?.type,
    version: data?.version,
    digest: data?.digest,
    owner: data?.owner,
    fields,
    display: data?.display?.data ?? null,
  });
}
