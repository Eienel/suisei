interface Args {
  content: string;
  encoding: 'utf8' | 'base64';
  epochs: number;
  publisher_url?: string;
}

const DEFAULT_PUBLISHER = 'https://publisher.walrus-testnet.walrus.space';

export async function walrusPublish(raw: unknown): Promise<string> {
  const { content, encoding, epochs, publisher_url } = raw as Args;

  const body =
    encoding === 'base64'
      ? Buffer.from(content, 'base64')
      : Buffer.from(content, 'utf8');

  const url = `${publisher_url ?? DEFAULT_PUBLISHER}/v1/blobs?epochs=${epochs}`;
  // Buffer is a Uint8Array subclass, which fetch accepts as a body.
  const res = await fetch(url, {
    method: 'PUT',
    body: new Uint8Array(body),
  });
  if (!res.ok) {
    throw new Error(`Walrus publisher returned ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as Record<string, unknown>;

  // Walrus returns one of: { newlyCreated: { blobObject: {...} } } or
  // { alreadyCertified: { blobId, ... } }. Normalize.
  let blobId: string | undefined;
  let kind: 'newly_created' | 'already_certified' | 'unknown' = 'unknown';
  const newly = data.newlyCreated as { blobObject?: { blobId?: string } } | undefined;
  const already = data.alreadyCertified as { blobId?: string } | undefined;
  if (newly?.blobObject?.blobId) {
    blobId = newly.blobObject.blobId;
    kind = 'newly_created';
  } else if (already?.blobId) {
    blobId = already.blobId;
    kind = 'already_certified';
  }
  if (!blobId) {
    throw new Error(`Walrus response missing blobId: ${JSON.stringify(data)}`);
  }

  return JSON.stringify({
    blob_id: blobId,
    status: kind,
    epochs,
    publisher: publisher_url ?? DEFAULT_PUBLISHER,
    size_bytes: body.length,
  });
}
