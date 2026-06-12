import { clientFor, type Network } from '../sui-client.js';
import { fromB64 } from '../tx.js';
import { suiDecodeTxBytes } from './sui_decode_tx_bytes.js';

interface Args {
  tx_bytes_base64: string;
  network: Network;
  simulate?: boolean;
}

type Level = 'info' | 'caution' | 'danger';
type Verdict = 'safe' | 'caution' | 'danger';

interface Signal {
  level: Level;
  code: string;
  message: string;
}

/**
 * "Look before you sign" as a single tool. Folds three primitives the
 * toolkit already has - sui_decode_tx_bytes (what it does),
 * sui_dry_run (what it costs and changes), and a risk rulebook - into
 * one verdict an agent can act on before asking a host to sign.
 *
 * This is the whole point of the toolkit being non-custodial: every
 * transaction can be understood and judged *before* a key ever touches
 * it. Any agent on the MCP gets this for free, so users stop blind-
 * signing tx bytes they can't read - the single biggest cause of
 * avoidable Web3 losses.
 *
 * The rulebook is deliberately explainable (no ML): each signal names a
 * concrete reason. The agent is the narrator on top; this tool gives it
 * crisp, structured facts to narrate.
 */
export async function suiExplainTx(raw: unknown): Promise<string> {
  const { tx_bytes_base64, network, simulate = true } = raw as Args;

  // 1. Decode (offline) - reuse the dedicated tool, parse its JSON. The
  //    toolkit's tools are designed to compose exactly like this.
  const decoded = JSON.parse(await suiDecodeTxBytes({ tx_bytes_base64 })) as {
    sender: string | null;
    inputs: { index: number; kind: string; value: unknown; pretty: string }[];
    commands: { index: number; kind: string; summary: string; raw: unknown }[];
    plain_english: string;
  };

  // 2. Simulate (optional - skip for a pure offline read).
  let simulation: Record<string, unknown> | null = null;
  let simulation_error: string | null = null;
  if (simulate) {
    try {
      const client = clientFor(network);
      const res = await client.dryRunTransactionBlock({
        transactionBlock: fromB64(tx_bytes_base64),
      });
      simulation = {
        status: res.effects.status.status,
        error: res.effects.status.error ?? null,
        gas_used: res.effects.gasUsed,
        balance_changes: res.balanceChanges,
        object_changes_count: res.objectChanges?.length ?? 0,
        events_count: res.events?.length ?? 0,
      };
    } catch (e) {
      simulation_error = e instanceof Error ? e.message : String(e);
    }
  }

  // 3. Risk rulebook over the decoded plan + simulation.
  const signals = assessRisk(decoded, simulation);

  const verdict: Verdict = signals.some((s) => s.level === 'danger')
    ? 'danger'
    : signals.some((s) => s.level === 'caution')
      ? 'caution'
      : 'safe';

  const verdict_reason =
    verdict === 'safe'
      ? 'No risk signals fired. Still confirm the plan matches your intent.'
      : signals
          .filter((s) => s.level === (verdict === 'danger' ? 'danger' : 'caution'))
          .map((s) => s.message)
          .join(' ');

  return JSON.stringify({
    network,
    sender: decoded.sender,
    plain_english: decoded.plain_english,
    command_count: decoded.commands.length,
    simulation,
    simulation_error,
    risk_signals: signals,
    verdict,
    verdict_reason,
    note:
      'Verdict is a heuristic aid, not a guarantee. Read plain_english and confirm it matches what you asked for before signing.',
  });
}

/** Sweeping function names worth surfacing verbatim to the user. */
const SWEEP_RE = /(drain|withdraw_all|claim_all|unstake_all|transfer_all|set_owner|set_admin|self_destruct)/i;

/** Packages that are part of the chain / well-known infra - low surprise. */
const KNOWN_PACKAGES: Record<string, string> = {
  '0x1': 'Move stdlib',
  '0x2': 'Sui framework',
  '0x3': 'Sui system (staking)',
  '0xdee9': 'DeepBook',
};

function assessRisk(
  decoded: {
    sender: string | null;
    inputs: { index: number; value: unknown }[];
    commands: { kind: string; summary: string; raw: unknown }[];
  },
  simulation: Record<string, unknown> | null,
): Signal[] {
  const signals: Signal[] = [];
  const sender = (decoded.sender ?? '').toLowerCase();

  // Resolve an argument ref to a pure value when it's a transaction Input.
  const resolveRef = (ref: unknown): unknown => {
    if (ref && typeof ref === 'object' && (ref as { $kind?: string }).$kind === 'Input') {
      const idx = (ref as { Input: number }).Input;
      return decoded.inputs[idx]?.value;
    }
    return undefined;
  };

  let hasWrite = false;

  for (const cmd of decoded.commands) {
    const raw = cmd.raw as Record<string, unknown>;

    if (cmd.kind === 'TransferObjects') {
      hasWrite = true;
      const t = raw.TransferObjects as { objects: unknown[]; address: unknown };
      const dest = resolveRef(t.address);
      const destStr = typeof dest === 'string' ? dest.toLowerCase() : null;
      const transfersGasCoin = t.objects.some(
        (o) => o && typeof o === 'object' && (o as { $kind?: string }).$kind === 'GasCoin',
      );
      const toSelf = destStr !== null && destStr === sender;

      if (destStr !== null && !toSelf) {
        if (transfersGasCoin) {
          signals.push({
            level: 'danger',
            code: 'gas_coin_to_other',
            message: `This sends your remaining SUI (the gas coin) to ${dest}, not back to you. That can empty the wallet.`,
          });
        } else {
          signals.push({
            level: 'caution',
            code: 'transfer_to_other',
            message: `This transfers ${t.objects.length} object(s) to ${dest}, a different address than the sender. Confirm you mean to send to it.`,
          });
        }
      }
    }

    if (cmd.kind === 'MoveCall') {
      hasWrite = true;
      const mc = raw.MoveCall as { package: string; module: string; function: string };
      const pkgShort = mc.package.replace(/^0x0*/, '0x');
      const known = KNOWN_PACKAGES[pkgShort] ?? KNOWN_PACKAGES[mc.package];
      if (SWEEP_RE.test(mc.function)) {
        signals.push({
          level: 'caution',
          code: 'sweeping_call',
          message: `Calls ${mc.module}::${mc.function} - a function whose name suggests it moves everything. Read what it does before signing.`,
        });
      }
      if (!known) {
        signals.push({
          level: 'info',
          code: 'third_party_package',
          message: `Calls third-party package ${mc.package}. Not a system package - verify you trust its publisher.`,
        });
      }
    }

    if (cmd.kind === 'Publish' || cmd.kind === 'Upgrade') {
      hasWrite = true;
      signals.push({
        level: 'caution',
        code: cmd.kind === 'Publish' ? 'publishes_package' : 'upgrades_package',
        message: `This ${cmd.kind === 'Publish' ? 'publishes a new' : 'upgrades a'} Move package. Unusual for a routine user action.`,
      });
    }

    if (cmd.kind === 'SplitCoins' || cmd.kind === 'MergeCoins' || cmd.kind === 'MakeMoveVec') {
      hasWrite = true;
    }
  }

  // Simulation-derived signals.
  if (simulation) {
    if (simulation.status && simulation.status !== 'success') {
      signals.push({
        level: 'danger',
        code: 'simulation_failed',
        message: `Simulation says this transaction would FAIL on-chain (${simulation.error ?? 'unknown error'}). Signing it would waste gas at best.`,
      });
    }
    // Net SUI leaving the sender (beyond gas) is worth showing plainly.
    const changes = (simulation.balance_changes as { owner: unknown; coinType: string; amount: string }[]) ?? [];
    for (const c of changes) {
      const ownerAddr =
        c.owner && typeof c.owner === 'object'
          ? ((c.owner as { AddressOwner?: string }).AddressOwner ?? '').toLowerCase()
          : '';
      if (ownerAddr === sender && c.coinType === '0x2::sui::SUI' && BigInt(c.amount) < 0n) {
        const outSui = Number(-BigInt(c.amount)) / 1e9;
        if (outSui >= 1) {
          signals.push({
            level: 'info',
            code: 'sui_outflow',
            message: `Net ~${outSui.toFixed(4)} SUI leaves your wallet in this transaction (including gas).`,
          });
        }
      }
    }
  }

  if (!hasWrite) {
    signals.push({
      level: 'info',
      code: 'read_only',
      message: 'No state-changing commands detected - this looks read-only / inspection-shaped.',
    });
  }

  return signals;
}
