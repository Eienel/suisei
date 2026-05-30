import { useEffect, useState } from 'react';
import { useCurrentAccount, useSuiClient, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { useApp } from '@/state/app';
import { questById } from '@/data/quests';
import { AuthButton } from '@/components/AuthButton';
import { buildBadgeMintTx, badgeFromTxResult, mockBadge } from '@/sui/badge';
import { BADGE_CONFIGURED, SUI_NETWORK } from '@/sui/config';
import {
  CheckCircle2,
  ExternalLink,
  Loader2,
  AlertCircle,
  Boxes,
} from 'lucide-react';

/**
 * Quest 6: Programmable Transaction Blocks.
 *
 * The lesson is atomicity by default. We simulate the same 4-step
 * payment as a single PTB (succeeds) and as 4 separate transactions
 * (fails on step 3, leaves the wallet in an inconsistent state).
 * The contrast is the point — Sui's PTB is a transaction primitive,
 * not a smart-contract pattern.
 */
export function Quest6Ptb() {
  const quest = questById('ptb')!;
  const account = useCurrentAccount();
  const phase = useApp((s) => s.questPhase);
  const setPhase = useApp((s) => s.setQuestPhase);
  const awardBadge = useApp((s) => s.awardBadge);
  const closeQuest = useApp((s) => s.closeQuest);
  const badges = useApp((s) => s.badges);

  const suiClient = useSuiClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const [minting, setMinting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const existing = badges.find((b) => b.questId === 'ptb');

  useEffect(() => {
    if (existing && phase !== 'done') setPhase('done');
  }, [existing, phase, setPhase]);

  const mint = async () => {
    if (!account) return;
    setError(null);
    setMinting(true);
    setPhase('badge');
    try {
      if (!BADGE_CONFIGURED) {
        await new Promise((r) => setTimeout(r, 1000));
        awardBadge(mockBadge('ptb', account.address));
        setPhase('done');
        return;
      }
      const tx = buildBadgeMintTx({ recipient: account.address, questId: 'ptb' });
      signAndExecute(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { transaction: tx as any },
        {
          onSuccess: async ({ digest }) => {
            try {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const badge = await badgeFromTxResult(suiClient as any, digest, 'ptb');
              awardBadge(badge);
              setPhase('done');
            } catch (e) {
              setError(e instanceof Error ? e.message : 'Mint indexing failed');
              setPhase('interact');
            } finally {
              setMinting(false);
            }
          },
          onError: (e) => {
            setError(e instanceof Error ? e.message : 'Sign failed');
            setPhase('interact');
            setMinting(false);
          },
        },
      );
      return;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
      setPhase('interact');
    } finally {
      if (!BADGE_CONFIGURED) setMinting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10">
      <header className="mb-10">
        <p className="eyebrow mb-3 text-butter">
          Quest {String(quest.number).padStart(2, '0')} · {quest.concept}
        </p>
        <h1 className="font-display text-3xl sm:text-4xl tracking-[-0.015em] font-semibold text-cream mb-3">
          {quest.title}
        </h1>
        <p className="text-cream-dim leading-relaxed text-[17px]">{quest.hook}</p>
      </header>

      <PhaseLadder phase={phase} />

      <section className="mt-8">
        {phase === 'intro' && <IntroPanel onStart={() => setPhase('interact')} />}
        {phase === 'interact' && (
          <ComparePanel
            address={account?.address ?? null}
            onSolved={mint}
            minting={minting}
          />
        )}
        {phase === 'badge' && <BadgePanel />}
        {phase === 'done' && existing && (
          <DonePanel badge={existing} onNext={() => closeQuest()} />
        )}
        {error && (
          <p className="mt-4 text-sm text-terracotta font-mono">{error}</p>
        )}
      </section>

      {!BADGE_CONFIGURED && (
        <p className="mt-4 text-xs text-cream-mute font-mono">
          Dev mode: VITE_BADGE_PACKAGE_ID not set, badge mint mocked locally.
        </p>
      )}
    </div>
  );
}

function PhaseLadder({ phase }: { phase: string }) {
  const steps = [
    { id: 'intro', label: 'Intro' },
    { id: 'interact', label: 'Compare' },
    { id: 'badge', label: 'Mint badge' },
    { id: 'done', label: 'Done' },
  ];
  const idx = steps.findIndex((s) => s.id === phase);
  return (
    <ol className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em]">
      {steps.map((s, i) => {
        const state = i < idx ? 'past' : i === idx ? 'now' : 'future';
        return (
          <li key={s.id} className="flex items-center gap-2">
            <span
              className={
                state === 'past'
                  ? 'text-sage'
                  : state === 'now'
                    ? 'text-cream'
                    : 'text-cream-mute'
              }
            >
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <span className="w-6 h-px bg-night-line" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function IntroPanel({ onStart }: { onStart: () => void }) {
  return (
    <div className="card-night p-7">
      <p className="text-cream leading-relaxed mb-3 text-[15px]">
        On the EVM, "composability" means deploying a contract that calls other
        contracts. On Sui, the transaction itself is composable. A{' '}
        <span className="font-mono text-butter">PTB</span> chains up to 1024
        operations and either all succeed or none do — at the transaction level,
        not the contract level.
      </p>
      <p className="text-cream-dim leading-relaxed mb-7 text-[15px]">
        Run the same payment two ways. One as a PTB. One as four separate
        transactions where the third one fails. Watch the difference.
      </p>
      <button type="button" onClick={onStart} className="btn-primary">
        Show me the comparison
        <Boxes size={14} />
      </button>
    </div>
  );
}

interface StepResult {
  step: number;
  label: string;
  status: 'queued' | 'ok' | 'failed' | 'rolled_back';
  detail?: string;
}

const STEPS = [
  { step: 1, label: 'split 10 SUI from main coin' },
  { step: 2, label: 'transfer 4 SUI to alice.sui' },
  { step: 3, label: 'pay 1 SUI fee to fee_vault (throws)' },
  { step: 4, label: 'merge remainder back into main coin' },
];

function simulate(mode: 'ptb' | 'sequential'): StepResult[] {
  return STEPS.map((s) => {
    if (s.step < 3) return { ...s, status: 'ok' as const };
    if (s.step === 3) return { ...s, status: 'failed' as const, detail: 'EFEE_VAULT_PAUSED' };
    // Step 4
    return mode === 'ptb'
      ? { ...s, status: 'rolled_back' as const, detail: 'reverted with the whole tx' }
      : { ...s, status: 'queued' as const, detail: 'never submitted; you are stuck' };
  });
}

function ComparePanel({
  address,
  onSolved,
  minting,
}: {
  address: string | null;
  onSolved: () => void;
  minting: boolean;
}) {
  const [shown, setShown] = useState<'ptb' | 'sequential' | null>(null);
  const [seen, setSeen] = useState<{ ptb: boolean; sequential: boolean }>({
    ptb: false,
    sequential: false,
  });

  if (!address) {
    return (
      <div className="card-night p-7">
        <p className="text-cream leading-relaxed mb-5 text-[15px]">
          Sign in first — the badge gets minted to your wallet at the end.
        </p>
        <div className="flex justify-start">
          <AuthButton />
        </div>
      </div>
    );
  }

  const run = (mode: 'ptb' | 'sequential') => {
    setShown(mode);
    setSeen((s) => ({ ...s, [mode]: true }));
  };

  const both = seen.ptb && seen.sequential;
  const result = shown ? simulate(shown) : [];

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => run('ptb')}
          className={
            'card-night text-left p-5 transition-colors ' +
            (shown === 'ptb' ? 'border-butter/60 bg-butter/[0.04]' : 'hover:border-butter/30')
          }
        >
          <p className="eyebrow text-butter mb-1.5">PTB</p>
          <p className="font-display font-semibold text-cream text-[15px] mb-1.5">
            One transaction, four operations
          </p>
          <p className="text-cream-dim text-[13px] leading-relaxed">
            Atomic. If any step fails, the whole tx reverts and nothing on chain
            changes.
          </p>
        </button>
        <button
          type="button"
          onClick={() => run('sequential')}
          className={
            'card-night text-left p-5 transition-colors ' +
            (shown === 'sequential' ? 'border-terracotta/60 bg-terracotta/[0.04]' : 'hover:border-terracotta/30')
          }
        >
          <p className="eyebrow text-terracotta mb-1.5">Sequential</p>
          <p className="font-display font-semibold text-cream text-[15px] mb-1.5">
            Four separate transactions
          </p>
          <p className="text-cream-dim text-[13px] leading-relaxed">
            Each tx is independent. A failure mid-way leaves your wallet in a
            half-applied state.
          </p>
        </button>
      </div>

      {shown && (
        <div className="card-night p-0 overflow-hidden">
          <div className="px-5 py-2.5 border-b border-night-line/70 flex items-center justify-between">
            <span className="eyebrow text-cream-mute">
              {shown === 'ptb' ? 'PTB simulation' : 'Sequential simulation'}
            </span>
            <span className="font-mono text-[10px] text-cream-mute">
              step 3 throws EFEE_VAULT_PAUSED
            </span>
          </div>
          <ol className="divide-y divide-night-line/70">
            {result.map((r) => (
              <li
                key={r.step}
                className="px-5 py-3 flex items-start gap-3 font-mono text-[13px]"
              >
                <StatusDot status={r.status} />
                <div className="flex-1">
                  <p className="text-cream">
                    <span className="text-cream-mute">{r.step}.</span> {r.label}
                  </p>
                  {r.detail && (
                    <p className="text-[11px] text-cream-mute mt-0.5">{r.detail}</p>
                  )}
                </div>
                <span className={statusLabelClass(r.status)}>{r.status}</span>
              </li>
            ))}
          </ol>
          <div className="px-5 py-3 border-t border-night-line/70 bg-night/40">
            <p className="text-[13px] font-mono text-cream leading-relaxed">
              <span className="eyebrow text-cream-mute mr-2">outcome</span>
              {shown === 'ptb'
                ? 'no state change. main coin intact. alice received nothing. fee vault did not advance. clean retry.'
                : 'main coin is now split. 4 SUI sat with alice. fee paid nothing. you are stuck reconciling manually.'}
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={onSolved}
          disabled={!both || minting}
          className="btn-primary disabled:opacity-50"
        >
          {minting && <Loader2 size={14} className="animate-spin" />}
          mint badge
        </button>
        <span className="text-xs text-cream-mute font-mono">
          {both ? 'both runs viewed' : 'run both to compare'}
        </span>
      </div>
    </div>
  );
}

function StatusDot({ status }: { status: StepResult['status'] }) {
  if (status === 'ok')
    return <span className="mt-1.5 inline-block w-1.5 h-1.5 rounded-full bg-sage shrink-0" />;
  if (status === 'failed')
    return (
      <AlertCircle size={14} className="mt-0.5 text-terracotta shrink-0" />
    );
  if (status === 'rolled_back')
    return <span className="mt-1.5 inline-block w-1.5 h-1.5 rounded-full bg-butter shrink-0" />;
  return <span className="mt-1.5 inline-block w-1.5 h-1.5 rounded-full bg-cream-mute shrink-0" />;
}

function statusLabelClass(status: StepResult['status']): string {
  const base = 'font-mono text-[11px] uppercase tracking-[0.16em]';
  if (status === 'ok') return `${base} text-sage`;
  if (status === 'failed') return `${base} text-terracotta`;
  if (status === 'rolled_back') return `${base} text-butter`;
  return `${base} text-cream-mute`;
}

function BadgePanel() {
  return (
    <div className="card-night p-7 flex items-center gap-3 text-cream-dim">
      <Loader2 size={16} className="animate-spin text-butter" />
      <span>Minting your Quest 6 badge…</span>
    </div>
  );
}

function DonePanel({
  badge,
  onNext,
}: {
  badge: { objectId: string; txDigest: string };
  onNext: () => void;
}) {
  const isMock = badge.txDigest.startsWith('mock-');
  const explorer = isMock
    ? null
    : `https://suiscan.xyz/${SUI_NETWORK}/tx/${badge.txDigest}`;
  return (
    <div className="card-night p-7">
      <div className="flex items-center gap-2 mb-4">
        <CheckCircle2 size={18} className="text-sage" />
        <p className="font-display font-semibold text-cream text-[17px]">
          Atomic by default.
        </p>
      </div>
      <p className="text-cream-dim leading-relaxed mb-5 text-[15px]">
        On Sui, you don't write a contract to coordinate other contracts. The
        transaction itself coordinates. That makes flash loans, batched DEX
        trades, MEV sandwich repairs, and many other patterns trivial to express.
      </p>
      <div className="rounded-card bg-night border border-night-line p-4 mb-7">
        <p className="eyebrow text-cream-mute mb-1.5">Quest 6 badge</p>
        <p className="font-mono text-xs text-cream-dim break-all">{badge.objectId}</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={onNext} className="btn-primary">
          Next quest
        </button>
        {explorer && (
          <a
            href={explorer}
            target="_blank"
            rel="noreferrer"
            className="btn-ghost text-sm"
          >
            <ExternalLink size={13} />
            View on Suiscan
          </a>
        )}
      </div>
    </div>
  );
}
