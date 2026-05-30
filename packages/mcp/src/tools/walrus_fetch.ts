interface Args {
  blob_id: string;
  as: 'utf8' | 'base64';
  aggregator_url?: string;
}

const DEFAULT_AGGREGATOR = 'https://aggregator.walrus-testnet.walrus.space';

export async function walrusFetch(raw: unknown): Promise<string> {
  const { blob_id, as, aggregator_url } = raw as Args;
  const url = `${aggregator_url ?? DEFAULT_AGGREGATOR}/v1/blobs/${blob_id}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Walrus aggregator returned ${res.status} for ${blob_id}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  const content =
    as === 'base64' ? buf.toString('base64') : buf.toString('utf8');

  return JSON.stringify({
    blob_id,
    encoding: as,
    size_bytes: buf.length,
    content,
  });
}
