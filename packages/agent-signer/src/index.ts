import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { defaultPath, saveSecret, loadSecret, keystoreExists } from './keystore.js';

/**
 * @suisei-mcp/agent-signer - the non-custodial signer for a Tier-1 Sui agent
 * wallet.
 *
 * The MCP toolkit builds unsigned tx bytes and never holds a key. This is
 * the only piece that does: it generates the agent keypair, stores it
 * encrypted on the user's machine, and signs tx bytes. The plaintext key
 * is created here, used here, and never returned across a process boundary
 * - in particular it never travels through an MCP response or an LLM
 * context.
 *
 * Pair the signature this produces with sui_execute_signed_tx to submit.
 */

export interface CreateResult {
  address: string;
  path: string;
}

/** Generate a fresh agent keypair and persist it encrypted. Returns the address only. */
export function createWallet(opts: {
  passphrase: string;
  path?: string;
  overwrite?: boolean;
}): CreateResult {
  const path = opts.path ?? defaultPath();
  if (keystoreExists(path) && !opts.overwrite) {
    throw new Error(
      `An agent wallet already exists at ${path}. Pass overwrite to replace it (you will lose the old key).`,
    );
  }
  const kp = new Ed25519Keypair();
  const address = kp.getPublicKey().toSuiAddress();
  saveSecret({ path, passphrase: opts.passphrase, address, secretBech32: kp.getSecretKey() });
  return { address, path };
}

/** Load and decrypt the agent keypair. Plaintext stays inside this process. */
export function loadKeypair(opts: { passphrase: string; path?: string }): Ed25519Keypair {
  const path = opts.path ?? defaultPath();
  const { secretBech32 } = loadSecret({ path, passphrase: opts.passphrase });
  return Ed25519Keypair.fromSecretKey(secretBech32);
}

/** The agent wallet address, without decrypting the key (reads the stored address). */
export function walletAddress(opts: { passphrase: string; path?: string }): string {
  const path = opts.path ?? defaultPath();
  return loadSecret({ path, passphrase: opts.passphrase }).address;
}

/**
 * Reveal the raw bech32 `suiprivkey...` secret so the user can back it up
 * or import the agent wallet into a standard wallet (Sui Wallet, Suiet,
 * `sui keytool import`). This is the user's escape hatch - it proves they,
 * not us, own the key. Handle the output carefully: anyone with this string
 * controls the wallet.
 */
export function exportSecret(opts: { passphrase: string; path?: string }): {
  address: string;
  secretBech32: string;
} {
  const path = opts.path ?? defaultPath();
  return loadSecret({ path, passphrase: opts.passphrase });
}

/**
 * Import an existing key as the agent wallet: seal a bech32 `suiprivkey...`
 * (or raw 32-byte) secret into the keystore. Lets a user bring their own
 * key instead of generating one.
 */
export function importWallet(opts: {
  passphrase: string;
  secret: string;
  path?: string;
  overwrite?: boolean;
}): CreateResult {
  const path = opts.path ?? defaultPath();
  if (keystoreExists(path) && !opts.overwrite) {
    throw new Error(
      `An agent wallet already exists at ${path}. Pass overwrite to replace it (you will lose the old key).`,
    );
  }
  let kp: Ed25519Keypair;
  try {
    kp = Ed25519Keypair.fromSecretKey(opts.secret.trim());
  } catch {
    throw new Error('Invalid secret key. Expected a bech32 "suiprivkey1..." string.');
  }
  const address = kp.getPublicKey().toSuiAddress();
  // Re-serialize through getSecretKey() so storage is always canonical bech32.
  saveSecret({ path, passphrase: opts.passphrase, address, secretBech32: kp.getSecretKey() });
  return { address, path };
}

/**
 * Sign base64 tx bytes (from any @suisei-mcp/mcp builder tool) with the agent
 * key. Returns the base64 Sui signature to pass to sui_execute_signed_tx.
 */
export async function signTxBytes(opts: {
  passphrase: string;
  txBytesBase64: string;
  path?: string;
}): Promise<{ address: string; signature: string }> {
  const kp = loadKeypair({ passphrase: opts.passphrase, path: opts.path });
  const bytes = new Uint8Array(Buffer.from(opts.txBytesBase64, 'base64'));
  const { signature } = await kp.signTransaction(bytes);
  return { address: kp.getPublicKey().toSuiAddress(), signature };
}

export { defaultPath } from './keystore.js';
