import {
  randomBytes,
  scryptSync,
  createCipheriv,
  createDecipheriv,
} from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync, chmodSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

/**
 * Encrypted-at-rest keystore for the agent wallet's Ed25519 secret key.
 *
 * The secret is sealed with AES-256-GCM under a key derived from a
 * passphrase via scrypt. We store only ciphertext + the public address.
 * Nothing here ever returns a plaintext key to a caller other than the
 * in-process signer, and the file is written 0600. The key never leaves
 * the user's machine and never enters an agent/LLM context.
 */

export interface KeystoreFile {
  version: 1;
  address: string;
  scheme: 'ed25519';
  kdf: 'scrypt';
  salt: string; // hex
  iv: string; // hex
  auth_tag: string; // hex
  ciphertext: string; // hex (encrypted bech32 suiprivkey string)
  created_at: string;
}

const SCRYPT_N = 1 << 15; // 32768
const SCRYPT_PARAMS = { N: SCRYPT_N, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

/** Default keystore path; override with AGENT_WALLET_PATH. */
export function defaultPath(): string {
  return process.env.AGENT_WALLET_PATH ?? join(homedir(), '.suisei', 'agent-wallet.json');
}

function deriveKey(passphrase: string, salt: Buffer): Buffer {
  return scryptSync(passphrase, salt, 32, SCRYPT_PARAMS);
}

/** Encrypt a bech32 `suiprivkey...` string into a keystore file on disk. */
export function saveSecret(opts: {
  path: string;
  passphrase: string;
  address: string;
  secretBech32: string;
}): void {
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = deriveKey(opts.passphrase, salt);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(Buffer.from(opts.secretBech32, 'utf8')),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  const file: KeystoreFile = {
    version: 1,
    address: opts.address,
    scheme: 'ed25519',
    kdf: 'scrypt',
    salt: salt.toString('hex'),
    iv: iv.toString('hex'),
    auth_tag: authTag.toString('hex'),
    ciphertext: ciphertext.toString('hex'),
    created_at: new Date().toISOString(),
  };

  mkdirSync(dirname(opts.path), { recursive: true });
  writeFileSync(opts.path, JSON.stringify(file, null, 2), { mode: 0o600 });
  try {
    chmodSync(opts.path, 0o600);
  } catch {
    // best-effort on platforms without POSIX perms
  }
}

/** Decrypt and return the bech32 `suiprivkey...` string. Throws on bad passphrase. */
export function loadSecret(opts: { path: string; passphrase: string }): {
  address: string;
  secretBech32: string;
} {
  if (!existsSync(opts.path)) {
    throw new Error(`No agent wallet at ${opts.path}. Run "agent-signer create" first.`);
  }
  const file = JSON.parse(readFileSync(opts.path, 'utf8')) as KeystoreFile;
  if (file.version !== 1) throw new Error(`Unsupported keystore version ${file.version}.`);

  const key = deriveKey(opts.passphrase, Buffer.from(file.salt, 'hex'));
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(file.iv, 'hex'));
  decipher.setAuthTag(Buffer.from(file.auth_tag, 'hex'));
  let secretBech32: string;
  try {
    secretBech32 = Buffer.concat([
      decipher.update(Buffer.from(file.ciphertext, 'hex')),
      decipher.final(),
    ]).toString('utf8');
  } catch {
    throw new Error('Decryption failed - wrong passphrase or corrupted keystore.');
  }
  return { address: file.address, secretBech32 };
}

export function keystoreExists(path: string): boolean {
  return existsSync(path);
}
