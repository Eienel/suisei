import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { defaultPath, saveSecret, loadSecret, keystoreExists } from './keystore.js';

/**
 * @suisei/agent-signer — the non-custodial signer for a Tier-1 Sui agent
 * wallet.
 *
 * The MCP toolkit builds unsigned tx bytes and never holds a key. This is
 * the only piece that does: it generates the agent keypair, stores it
 * encrypted on the user's machine, and signs tx bytes. The plaintext key
 * is created here, used here, and never returned across a process boundary
 * — in particular it never travels through an MCP response or an LLM
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
 * Sign base64 tx bytes (from any sui-skills-mcp builder tool) with the
 * agent key. Returns the base64 Sui signature to pass to
 * sui_execute_signed_tx.
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
