#!/usr/bin/env node
import { createWallet, walletAddress, signTxBytes, defaultPath } from './index.js';

/**
 * agent-signer CLI — the manual signing path for a Tier-1 agent wallet.
 *
 *   agent-signer create [--overwrite]      generate + encrypt a new agent key
 *   agent-signer address                   print the agent wallet address
 *   agent-signer sign <txBytesBase64>      sign builder bytes -> base64 signature
 *
 * Passphrase comes from AGENT_WALLET_PASSPHRASE (preferred) or --passphrase.
 * Keystore path from AGENT_WALLET_PATH or --path (default ~/.suisei/agent-wallet.json).
 *
 * Typical loop with Claude + the MCP:
 *   1. agent builds a tx  -> tx_bytes_base64
 *   2. agent-signer sign <tx_bytes_base64>  -> copy the "signature"
 *   3. tell the agent to sui_execute_signed_tx with that signature
 */

function flag(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] : undefined;
}
function has(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

function getPassphrase(): string {
  const p = process.env.AGENT_WALLET_PASSPHRASE ?? flag('passphrase');
  if (!p) {
    fail(
      'No passphrase. Set AGENT_WALLET_PASSPHRASE or pass --passphrase <value>. ' +
        'This encrypts the agent key at rest.',
    );
  }
  return p as string;
}

function getPath(): string {
  return flag('path') ?? defaultPath();
}

function out(obj: unknown): void {
  process.stdout.write(JSON.stringify(obj, null, 2) + '\n');
}

function fail(msg: string): never {
  process.stderr.write(`error: ${msg}\n`);
  process.exit(1);
}

async function main(): Promise<void> {
  const cmd = process.argv[2];

  switch (cmd) {
    case 'create': {
      const res = createWallet({
        passphrase: getPassphrase(),
        path: getPath(),
        overwrite: has('overwrite'),
      });
      out({
        created: true,
        address: res.address,
        path: res.path,
        next_step:
          'Fund it with the agent_wallet_fund MCP tool (owner-signed), then the agent can spend up to its balance.',
      });
      break;
    }
    case 'address': {
      out({ address: walletAddress({ passphrase: getPassphrase(), path: getPath() }) });
      break;
    }
    case 'sign': {
      const txBytesBase64 = process.argv[3];
      if (!txBytesBase64 || txBytesBase64.startsWith('--')) {
        fail('Usage: agent-signer sign <txBytesBase64>');
      }
      const res = await signTxBytes({
        passphrase: getPassphrase(),
        txBytesBase64,
        path: getPath(),
      });
      out({
        address: res.address,
        signature: res.signature,
        next_step:
          'Submit with the sui_execute_signed_tx MCP tool: pass the same tx bytes and this signature.',
      });
      break;
    }
    default:
      process.stdout.write(
        [
          'agent-signer — non-custodial signer for a Tier-1 Sui agent wallet',
          '',
          'Commands:',
          '  create [--overwrite]     generate + encrypt a new agent key',
          '  address                  print the agent wallet address',
          '  sign <txBytesBase64>     sign builder bytes -> base64 signature',
          '',
          'Auth:  AGENT_WALLET_PASSPHRASE (or --passphrase), AGENT_WALLET_PATH (or --path)',
          '',
        ].join('\n'),
      );
      if (cmd && cmd !== 'help' && cmd !== '--help') process.exit(1);
  }
}

main().catch((e) => fail(e instanceof Error ? e.message : String(e)));
