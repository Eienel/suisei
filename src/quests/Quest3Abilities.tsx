import { useEffect, useMemo, useState } from 'react';
import { useCurrentAccount, useSuiClient, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { useApp } from '@/state/app';
import { questById } from '@/data/quests';
import { AuthButton } from '@/components/AuthButton';
import { buildBadgeMintTx, badgeFromTxResult, mockBadge } from '@/sui/badge';
import { BADGE_CONFIGURED, SUI_NETWORK } from '@/sui/config';
import { CheckCircle2, ExternalLink, Loader2, AlertCircle } from 'lucide-react';

/**
 * Quest 3: Move Abilities.
 *
 * The lesson is the compiler-as-teacher: when you pick the wrong
 * abilities for a struct, Move refuses to compile, and that refusal
 * is the safety feature. We mimic the compiler's voice with a client-
 * side rule-check so the lesson lands without a real toolchain.
 *
 * The struct in question is the actual badge struct used by Suisei
 * itself — `has key` only. That makes the lesson tangible: the thing
 * the user already minted in Quest 1 was protected by these rules.
 */
export function Quest3Abilities() {
  const quest = questById('abilities')!;
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

  const existing = badges.find((b) => b.questId === 'abilities');

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
        awardBadge(mockBadge('abilities', account.address));
        setPhase('done');
        return;
      }
      const tx = buildBadgeMintTx({ recipient: account.address, questId: 'abilities' });
      signAndExecute(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { transaction: tx as any },
        {
          onSuccess: async ({ digest }) => {
            try {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const badge = await badgeFromTxResult(suiClient as any, digest, 'abilities');
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
          <PuzzlePanel
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
    { id: 'interact', label: 'Pick abilities' },
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
        Every Move struct declares which <span className="font-semibold text-butter">abilities</span> it
        has. Four flags. Each flag is a permission the compiler will give code that touches the struct.
      </p>
      <ul className="text-cream-dim leading-relaxed mb-5 text-[15px] space-y-1.5 font-mono text-[13px]">
        <li><span className="text-butter">key</span> — can be a top-level object with its own id</li>
        <li><span className="text-butter">store</span> — can be wrapped inside other structs</li>
        <li><span className="text-butter">copy</span> — can be cloned with <code>=</code></li>
        <li><span className="text-butter">drop</span> — can be silently discarded</li>
      </ul>
      <p className="text-cream-dim leading-relaxed mb-7 text-[15px]">
        Picking the wrong set is a compile error, not a runtime bug. That's the design.
        I'll show you the soulbound badge struct you already own from Quest 1 — pick the
        abilities that make it stay safely yours.
      </p>
      <button type="button" onClick={onStart} className="btn-primary">
        Show me the struct
      </button>
    </div>
  );
}

const ALL_ABILITIES = ['key', 'store', 'copy', 'drop'] as const;
type Ability = (typeof ALL_ABILITIES)[number];

/**
 * Per-ability "why this is wrong" message in compiler voice. Used
 * when an ability is on but shouldn't be. The reverse case (missing
 * `key`) is handled separately because the error class is different.
 */
const WRONG_REASONS: Record<Ability, string> = {
  key: 'expected: every owned top-level Sui object needs `key`',
  store:
    "with `store`, this badge could be wrapped inside another struct and transferred — it would stop being soulbound",
  copy:
    "with `copy`, the badge could be duplicated with `= b1` — one proof per quest is the whole point",
  drop:
    "with `drop`, the badge could be silently destroyed in a let-binding — the chain would lose the proof",
};

const REQUIRED: Set<Ability> = new Set(['key']);

function PuzzlePanel({
  address,
  onSolved,
  minting,
}: {
  address: string | null;
  onSolved: () => void;
  minting: boolean;
}) {
  // Start with all abilities on so the user has to remove the wrong ones.
  const [picked, setPicked] = useState<Set<Ability>>(new Set(ALL_ABILITIES));
  const [attempted, setAttempted] = useState(false);

  const verdict = useMemo(() => verify(picked), [picked]);

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

  const toggle = (a: Ability) => {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(a)) next.delete(a);
      else next.add(a);
      return next;
    });
    setAttempted(false);
  };

  const onCompile = () => {
    setAttempted(true);
    if (verdict.ok) onSolved();
  };

  const compileLine = verdict.ok
    ? 'badge compiled.'
    : verdict.reasons[0] ?? 'unknown error';

  return (
    <div className="space-y-5">
      <div className="card-night p-0 overflow-hidden">
        <div className="px-5 py-2.5 border-b border-night-line/70 flex items-center justify-between">
          <span className="eyebrow text-cream-mute">badge.move</span>
          <span className="font-mono text-[10px] text-cream-mute">
            edit the abilities below
          </span>
        </div>
        <pre className="font-mono text-[13px] leading-[1.55] text-cream px-5 py-5 overflow-x-auto">
{`module suisei::badge {
    public struct Badge `}<AbilitiesPhrase abilities={picked} />{` {
        id: UID,
        quest_id: String,
        quest_number: u8,
        minted_at_ms: u64,
        minter: address,
    }
}`}
        </pre>
      </div>

      <div className="flex flex-wrap gap-2">
        {ALL_ABILITIES.map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => toggle(a)}
            className={
              'font-mono text-sm px-3 py-1.5 rounded-pill border transition-colors ' +
              (picked.has(a)
                ? 'bg-butter/15 border-butter/60 text-butter'
                : 'bg-night-soft border-night-line text-cream-mute hover:text-cream')
            }
          >
            {picked.has(a) ? '×' : '+'} {a}
          </button>
        ))}
      </div>

      {attempted && (
        <div
          className={
            'rounded-card p-4 border text-[13px] font-mono leading-relaxed flex items-start gap-2.5 ' +
            (verdict.ok
              ? 'bg-sage/10 border-sage/40 text-sage'
              : 'bg-terracotta/10 border-terracotta/40 text-terracotta')
          }
        >
          {verdict.ok ? (
            <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
          ) : (
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
          )}
          <div>
            <p className="opacity-70">
              {verdict.ok ? 'sui-move build' : 'sui-move build: error'}
            </p>
            <p className="mt-0.5">{compileLine}</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onCompile}
          disabled={minting}
          className="btn-primary disabled:opacity-60"
        >
          {minting && <Loader2 size={14} className="animate-spin" />}
          sui move build
        </button>
        <span className="text-xs text-cream-mute font-mono">
          {picked.size === 0
            ? 'no abilities selected'
            : `has ${Array.from(picked).join(', ')}`}
        </span>
      </div>
    </div>
  );
}

interface Verdict {
  ok: boolean;
  reasons: string[];
}

function verify(picked: Set<Ability>): Verdict {
  const reasons: string[] = [];
  // Missing required ability.
  for (const r of REQUIRED) {
    if (!picked.has(r)) reasons.push(WRONG_REASONS[r]);
  }
  // Forbidden ability present.
  for (const a of ALL_ABILITIES) {
    if (!REQUIRED.has(a) && picked.has(a)) {
      reasons.push(WRONG_REASONS[a]);
    }
  }
  return { ok: reasons.length === 0, reasons };
}

function AbilitiesPhrase({ abilities }: { abilities: Set<Ability> }) {
  if (abilities.size === 0) return <span className="text-cream-mute">{'{'}</span>;
  const list = ALL_ABILITIES.filter((a) => abilities.has(a));
  return (
    <>
      <span className="text-cream-mute">has </span>
      <span className="text-butter">{list.join(', ')}</span>
      <span className="text-cream-mute"> {'{'}</span>
    </>
  );
}

function BadgePanel() {
  return (
    <div className="card-night p-7 flex items-center gap-3 text-cream-dim">
      <Loader2 size={16} className="animate-spin text-butter" />
      <span>Minting your Quest 3 badge…</span>
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
          Compiler's pleased.
        </p>
      </div>
      <p className="text-cream-dim leading-relaxed mb-5 text-[15px]">
        <span className="font-mono">has key</span>, nothing else. The same struct
        protects every badge in your wallet — the type system is doing the work,
        not a runtime check.
      </p>
      <div className="rounded-card bg-night border border-night-line p-4 mb-7">
        <p className="eyebrow text-cream-mute mb-1.5">Quest 3 badge</p>
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
