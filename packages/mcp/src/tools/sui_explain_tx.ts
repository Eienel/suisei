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
 * sui_dry_run (what it costs and changes), and explainable signals - into
 * one call so an agent can understand a transaction before asking to sign it.
 *
 * This is the whole point of the toolkit being non-custodial: every
 * transaction can be understood and judged *before* a key ever touches
 * it. Any agent on the MCP gets this for free.
 *
 * Signals are conservative:
 * - "danger": simulation will fail on-chain (unambiguous - don't sign)
 * - "caution": simulation succeeded but produced unexpected output
 *   (may be intentional; human should verify)
 * - "info": informational (decoded plan, notable contracts, net flows)
 *
 * The agent is the narrator. This tool gives it crisp, structured facts.
 * No auto-verdict on function names, address types, or transfer patterns -
 * the data doesn't support strong claims there. Only simulation tells truth.
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
    verdict === 'danger'
      ? signals
          .filter((s) => s.level === 'danger')
          .map((s) => s.message)
          .join(' ')
      : verdict === 'caution'
        ? signals
            .filter((s) => s.level === 'caution')
            .map((s) => s.message)
            .join(' ')
        : 'Simulation succeeded. Review the decoded plan above and confirm it matches what you intended to do.';

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

  // Only flag what we know for certain from simulation results.
  // Everything else is informational - the decoded plan speaks for itself.
  if (simulation) {
    // Simulation failure = unambiguous danger: tx will fail on-chain.
    if (simulation.status && simulation.status !== 'success') {
      signals.push({
        level: 'danger',
        code: 'simulation_failed',
        message: `This transaction will FAIL on-chain: ${simulation.error ?? 'unknown error'}. Signing wastes gas.`,
      });
      return signals; // Fail fast; no point analyzing further.
    }

    // Check for zero output (unexpected outcome despite success).
    const objChanges = (simulation.object_changes_count as number) ?? 0;
    const balChanges = (simulation.balance_changes as { owner: unknown; coinType: string; amount: string }[]) ?? [];
    const hasOutputToSender = balChanges.some((c) => {
      const ownerAddr =
        c.owner && typeof c.owner === 'object'
          ? ((c.owner as { AddressOwner?: string }).AddressOwner ?? '').toLowerCase()
          : '';
      return ownerAddr === sender && BigInt(c.amount) > 0n;
    });

    // If we expected swaps/transfers but simulation shows zero objects created and nothing sent back to sender,
    // that's unexpected (caution, not danger - might be intentional like a burn).
    if (objChanges === 0 && !hasOutputToSender && decoded.commands.some((c) => c.kind === 'MoveCall')) {
      signals.push({
        level: 'caution',
        code: 'zero_output',
        message:
          'Simulation succeeded but produced no objects and no funds returned to sender. Confirm this is what you intended.',
      });
    }

    // Net SUI outflow: informational only (it's explicit in simulation).
    const suiOut = balChanges.reduce((sum, c) => {
      const ownerAddr =
        c.owner && typeof c.owner === 'object'
          ? ((c.owner as { AddressOwner?: string }).AddressOwner ?? '').toLowerCase()
          : '';
      if (ownerAddr === sender && c.coinType === '0x2::sui::SUI' && BigInt(c.amount) < 0n) {
        return sum + Number(-BigInt(c.amount));
      }
      return sum;
    }, 0);
    if (suiOut >= 1e9) {
      signals.push({
        level: 'info',
        code: 'sui_outflow',
        message: `Net ~${(suiOut / 1e9).toFixed(4)} SUI leaves your wallet (including gas).`,
      });
    }
  }

  // Informational: is this read-only or does it change state?
  const hasWrite = decoded.commands.some((c) => {
    return ['TransferObjects', 'SplitCoins', 'MergeCoins', 'MakeMoveVec', 'MoveCall', 'Publish', 'Upgrade'].includes(
      c.kind,
    );
  });
  if (!hasWrite) {
    signals.push({
      level: 'info',
      code: 'read_only',
      message: 'No state-changing commands. This looks read-only.',
    });
  }

  // Informational: flag Publish/Upgrade as unusual (users rarely do these).
  if (decoded.commands.some((c) => c.kind === 'Publish' || c.kind === 'Upgrade')) {
    signals.push({
      level: 'info',
      code: 'package_operation',
      message: 'This publishes or upgrades a Move package - unusual for end users.',
    });
  }

  return signals;
}
