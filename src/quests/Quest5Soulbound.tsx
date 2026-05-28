import { useEffect, useMemo, useState } from 'react';
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
  ShieldOff,
} from 'lucide-react';

/**
 * Quest 5: Soulbound NFT — the consequences view.
 *
 * Quest 3 declared `has key` and called the struct soulbound; this
 * quest makes the user feel what "soulbound" means by attempting
 * three different escapes and watching the compiler push back each
 * time. Once they've watched all three fail, the badge unlocks.
 */
export function Quest5Soulbound() {
  const quest = questById('soulbound')!;
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

  const existing = badges.find((b) => b.questId === 'soulbound');

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
        awardBadge(mockBadge('soulbound', account.address));
        setPhase('done');
        return;
      }
      const tx = buildBadgeMintTx({ recipient: account.address, questId: 'soulbound' });
      signAndExecute(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { transaction: tx as any },
        {
          onSuccess: async ({ digest }) => {
            try {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const badge = await badgeFromTxResult(suiClient as any, digest, 'soulbound');
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
          <AttacksPanel
            address={account?.address ?? null}
            onAllAttempted={mint}
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
    { id: 'interact', label: 'Try to steal it' },
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
        Quest 3 declared the badge <span className="font-mono text-butter">has key</span> —
        no <span className="font-mono">store</span>, no{' '}
        <span className="font-mono">copy</span>, no{' '}
        <span className="font-mono">drop</span>. Now feel what that means.
      </p>
      <p className="text-cream-dim leading-relaxed mb-7 text-[15px]">
        I'll show you three different attempts to move, copy, or wrap the
        badge. Each one is a real Move snippet a real attacker might try. Each
        one fails — at compile time, not runtime. Click through and watch.
      </p>
      <button type="button" onClick={onStart} className="btn-primary">
        Run the attacks
        <ShieldOff size={14} />
      </button>
    </div>
  );
}

interface Attack {
  id: string;
  label: string;
  code: string;
  error: string;
  reason: string;
}

const ATTACKS: Attack[] = [
  {
    id: 'public_transfer',
    label: 'Transfer to another wallet',
    code: `public entry fun steal(b: Badge, to: address) {
    transfer::public_transfer(b, to);
}`,
    error: "error[E04001]: missing required ability 'store'",
    reason:
      "public_transfer requires the value to have `store`. our badge has only `key`. the function signature is unsatisfiable. the linker won't even produce a binary.",
  },
  {
    id: 'wrap_then_trade',
    label: 'Wrap it inside a Bag and trade the Bag',
    code: `public struct Wrapper has key, store {
    id: UID,
    inner: Badge,
}
public fun wrap(b: Badge, ctx: &mut TxContext): Wrapper {
    Wrapper { id: object::new(ctx), inner: b }
}`,
    error: "error[E04001]: missing required ability 'store'",
    reason:
      'fields of a struct with `store` must themselves have `store`. Badge does not. the wrapper struct fails to type-check.',
  },
  {
    id: 'drop_to_dust',
    label: 'Discard the badge to free yourself',
    code: `public entry fun erase(b: Badge) {
    let Badge { id: _, .. } = b;
    // intentionally leak the rest
}`,
    error: "error[E04003]: missing required ability 'drop'",
    reason:
      "Move tracks resources. without `drop`, you can't silently dispose of a Badge. you'd have to pass it back to a function that consumes it explicitly — and there isn't one.",
  },
];

function AttacksPanel({
  address,
  onAllAttempted,
  minting,
}: {
  address: string | null;
  onAllAttempted: () => void;
  minting: boolean;
}) {
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const [active, setActive] = useState<string | null>(null);

  const allSeen = useMemo(() => seen.size === ATTACKS.length, [seen]);

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

  const run = (id: string) => {
    setActive(id);
    setSeen((s) => new Set([...s, id]));
  };

  const activeAttack = ATTACKS.find((a) => a.id === active);

  return (
    <div className="space-y-3">
      {ATTACKS.map((a) => {
        const used = seen.has(a.id);
        const open = a.id === active;
        return (
          <div
            key={a.id}
            className={
              'rounded-card border overflow-hidden transition-colors ' +
              (open
                ? 'border-terracotta/50 bg-terracotta/[0.04]'
                : 'border-night-line bg-night-soft/60')
            }
          >
            <button
              type="button"
              onClick={() => run(a.id)}
              className="w-full text-left px-5 py-3 flex items-center justify-between hover:bg-night-line/40"
            >
              <span className="font-display font-semibold text-cream text-[15px]">
                {a.label}
              </span>
              <span
                className={
                  'eyebrow font-mono ' + (used ? 'text-terracotta' : 'text-cream-mute')
                }
              >
                {used ? 'rejected' : 'run'}
              </span>
            </button>
            {open && activeAttack && (
              <div className="border-t border-night-line/70">
                <pre className="font-mono text-[13px] leading-[1.55] text-cream px-5 py-4 overflow-x-auto">
                  {activeAttack.code}
                </pre>
                <div className="px-5 pb-4">
                  <div className="rounded-card border border-terracotta/40 bg-terracotta/10 text-terracotta p-3 font-mono text-[12px] leading-relaxed flex items-start gap-2.5">
                    <AlertCircle size={13} className="mt-0.5 shrink-0" />
                    <div>
                      <p>{activeAttack.error}</p>
                      <p className="opacity-80 mt-1">{activeAttack.reason}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={onAllAttempted}
          disabled={!allSeen || minting}
          className="btn-primary disabled:opacity-50"
        >
          {minting && <Loader2 size={14} className="animate-spin" />}
          mint badge
        </button>
        <span className="text-xs text-cream-mute font-mono">
          {allSeen
            ? 'all three attacks blocked'
            : `${seen.size} of ${ATTACKS.length} run`}
        </span>
      </div>
    </div>
  );
}

function BadgePanel() {
  return (
    <div className="card-night p-7 flex items-center gap-3 text-cream-dim">
      <Loader2 size={16} className="animate-spin text-butter" />
      <span>Minting your Quest 5 badge…</span>
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
          Soulbound, structurally.
        </p>
      </div>
      <p className="text-cream-dim leading-relaxed mb-5 text-[15px]">
        Compare this to an EVM SBT — usually a regular ERC-721 with{' '}
        <span className="font-mono">_beforeTokenTransfer</span> reverting. That's a
        runtime guard you have to <em>remember</em>. Sui's version is structural:
        if the type doesn't permit it, the binary doesn't permit it.
      </p>
      <div className="rounded-card bg-night border border-night-line p-4 mb-7">
        <p className="eyebrow text-cream-mute mb-1.5">Quest 5 badge</p>
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
