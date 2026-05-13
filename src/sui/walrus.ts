import { WALRUS_AGGREGATOR, WALRUS_PUBLISHER } from './config';

/**
 * Walrus testnet uses public HTTP publisher / aggregator services —
 * a tx-free way to write blobs. The publisher signs and pays gas on
 * the caller's behalf; we get back a stable blobId for retrieval.
 *
 * For demo robustness, this client retries once on 5xx and treats
 * either `newlyCreated` or `alreadyCertified` as a success.
 */

export interface WalrusUploadResult {
  blobId: string;
  /** Stable URI we store on-chain. Reads via `fetchBlob`. */
  uri: string;
  size: number;
  endEpoch?: number;
}

const EPOCHS = 5; // Walrus blobs are valid for ~N epochs (free tier).

export async function uploadBlob(data: Uint8Array): Promise<WalrusUploadResult> {
  const url = `${WALRUS_PUBLISHER}/v1/blobs?epochs=${EPOCHS}`;

  const attempt = async (): Promise<WalrusUploadResult> => {
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'content-type': 'application/octet-stream' },
      // Cast to BodyInit so undici accepts a Uint8Array
      body: data as unknown as BodyInit,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Walrus ${res.status}: ${text.slice(0, 200)}`);
    }
    const json = (await res.json()) as WalrusPublishResponse;
    const fresh = json.newlyCreated?.blobObject;
    if (fresh) {
      return {
        blobId: fresh.blobId,
        uri: `walrus://${fresh.blobId}`,
        size: fresh.size,
        endEpoch: fresh.storage?.endEpoch,
      };
    }
    const cached = json.alreadyCertified;
    if (cached) {
      return {
        blobId: cached.blobId,
        uri: `walrus://${cached.blobId}`,
        size: data.length,
        endEpoch: cached.endEpoch,
      };
    }
    throw new Error('Walrus returned unexpected publisher response');
  };

  try {
    return await attempt();
  } catch (err) {
    // One retry; the public publishers occasionally 5xx under load.
    if (err instanceof Error && /Walrus 5\d\d/.test(err.message)) {
      await new Promise((r) => setTimeout(r, 1200));
      return attempt();
    }
    throw err;
  }
}

/** Fetch a previously uploaded blob's bytes. */
export async function fetchBlob(blobId: string): Promise<Uint8Array> {
  const url = `${WALRUS_AGGREGATOR}/v1/blobs/${blobId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Walrus fetch ${res.status}`);
  const buf = await res.arrayBuffer();
  return new Uint8Array(buf);
}

/** Encode a JSON object as bytes; small helper to keep call-sites tidy. */
export function jsonToBytes(value: unknown): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(value));
}

interface WalrusPublishResponse {
  newlyCreated?: {
    blobObject: {
      blobId: string;
      size: number;
      storage?: { endEpoch?: number };
    };
  };
  alreadyCertified?: {
    blobId: string;
    endEpoch?: number;
  };
}
