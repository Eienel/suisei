import { useEffect, useState } from 'react';
import { useCurrentAccount, useSuiClient, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { useApp } from '@/state/app';
import { questById } from '@/data/quests';
import { AuthButton } from '@/components/AuthButton';
import { buildBadgeMintTx, badgeFromTxResult, mockBadge } from '@/sui/badge';
import { BADGE_CONFIGURED, SUI_NETWORK } from '@/sui/config';
import { CheckCircle2, ExternalLink, Loader2, AlertCircle, KeyRound } from 'lucide-react';

/**
 * Quest 4: Capability pattern.
 *
 * On the EVM, you guard an admin function with
 * `require(msg.sender == owner)`. On Sui, you make admin power a real
 * object that can be transferred, wrapped in a multisig, or sent to a
 * DAO. The user picks the safest of three function signatures and
 * the lesson narrates why the others fail.
 */
export function Quest4Capability() {
  const quest = questById('capability')!;
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

  const existing = badges.find((b) => b.questId === 'capability');

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
        awardBadge(mockBadge('capability', account.address));
        setPhase('done');
        return;
      }
      const tx = buildBadgeMintTx({ recipient: account.address, questId: 'capability' });
      signAndExecute(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { transaction: tx as any },
        {
          onSuccess: async ({ digest }) => {
            try {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const badge = await badgeFromTxResult(suiClient as any, digest, 'capability');
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
    { id: 'interact', label: 'Pick the guard' },
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
        On Ethereum you guard admin code with{' '}
        <code className="font-mono text-butter">require(msg.sender == owner)</code>.
        That makes the admin a single address baked into the contract.
      </p>
      <p className="text-cream-dim leading-relaxed mb-7 text-[15px]">
        Sui's idiom: admin power is a real object — a{' '}
        <span className="font-mono text-butter">Cap</span>. Hold it, you can mint.
        Don't, you can't. The cap can be transferred, wrapped in a multisig,
        sent to a DAO. The contract never has to know who the admin is.
      </p>
      <button type="button" onClick={onStart} className="btn-primary">
        Pick the right signature
        <KeyRound size={14} />
      </button>
    </div>
  );
}

interface Option {
  id: 'no_check' | 'hardcoded_admin' | 'capability';
  label: string;
  code: string;
  verdict: 'ok' | 'fail';
  critique: string;
}

const OPTIONS: Option[] = [
  {
    id: 'no_check',
    label: 'No check',
    code: `public entry fun mint(
    treasury: &mut Treasury,
    amount: u64,
    ctx: &mut TxContext,
)`,
    verdict: 'fail',
    critique:
      'no caller check at all — anyone can call this and drain the treasury. minting is permissionless.',
  },
  {
    id: 'hardcoded_admin',
    label: 'sender == ADMIN',
    code: `public entry fun mint(
    treasury: &mut Treasury,
    amount: u64,
    ctx: &mut TxContext,
) {
    assert!(tx_context::sender(ctx) == @0xADMIN, E_UNAUTHORIZED);
    /* … */
}`,
    verdict: 'fail',
    critique:
      "address is baked into the binary. you can't rotate the admin, share it, or hand it to a multisig without redeploying. this is the EVM way.",
  },
  {
    id: 'capability',
    label: 'Cap required by type',
    code: `public entry fun mint(
    _: &MintCap,
    treasury: &mut Treasury,
    amount: u64,
    ctx: &mut TxContext,
)`,
    verdict: 'ok',
    critique:
      'the type system enforces it. holding a MintCap is mint power. transferable, wrappable in a multisig, freely composable.',
  },
];

function PuzzlePanel({
  address,
  onSolved,
  minting,
}: {
  address: string | null;
  onSolved: () => void;
  minting: boolean;
}) {
  const [picked, setPicked] = useState<Option['id'] | null>(null);
  const [submitted, setSubmitted] = useState(false);

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

  const chosenOption = OPTIONS.find((o) => o.id === picked);
  const isCorrect = chosenOption?.verdict === 'ok';

  const onSubmit = () => {
    if (!picked) return;
    setSubmitted(true);
    if (isCorrect) onSolved();
  };

  return (
    <div className="space-y-4">
      {OPTIONS.map((o) => {
        const selected = picked === o.id;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => {
              setPicked(o.id);
              setSubmitted(false);
            }}
            className={
              'block w-full text-left rounded-card border transition-colors overflow-hidden ' +
              (selected
                ? 'border-butter bg-butter/5'
                : 'border-night-line bg-night-soft/60 hover:border-cream-mute')
            }
          >
            <div className="px-5 py-2.5 border-b border-night-line/70 flex items-center justify-between">
              <span className="eyebrow text-cream-mute">{o.label}</span>
              <span className="font-mono text-[10px] text-cream-mute">
                option {OPTIONS.indexOf(o) + 1} / {OPTIONS.length}
              </span>
            </div>
            <pre className="font-mono text-[13px] leading-[1.55] text-cream px-5 py-4 overflow-x-auto">
              {o.code}
            </pre>
          </button>
        );
      })}

      {submitted && chosenOption && (
        <div
          className={
            'rounded-card p-4 border text-[13px] font-mono leading-relaxed flex items-start gap-2.5 ' +
            (isCorrect
              ? 'bg-sage/10 border-sage/40 text-sage'
              : 'bg-terracotta/10 border-terracotta/40 text-terracotta')
          }
        >
          {isCorrect ? (
            <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
          ) : (
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
          )}
          <div>
            <p className="opacity-70">
              {isCorrect ? 'security review: passed' : 'security review: rejected'}
            </p>
            <p className="mt-0.5">{chosenOption.critique}</p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={onSubmit}
          disabled={!picked || minting}
          className="btn-primary disabled:opacity-50"
        >
          {minting && <Loader2 size={14} className="animate-spin" />}
          submit for review
        </button>
        <span className="text-xs text-cream-mute font-mono">
          {picked ? `picked: ${chosenOption?.label}` : 'pick one above'}
        </span>
      </div>
    </div>
  );
}

function BadgePanel() {
  return (
    <div className="card-night p-7 flex items-center gap-3 text-cream-dim">
      <Loader2 size={16} className="animate-spin text-butter" />
      <span>Minting your Quest 4 badge…</span>
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
          Cap-gated and shipped.
        </p>
      </div>
      <p className="text-cream-dim leading-relaxed mb-5 text-[15px]">
        Admin power is now an object you can hand to anyone. A multisig contract
        is just another holder. A DAO vote that transfers the cap is an admin
        rotation. No redeploy, no proxy upgrade.
      </p>
      <div className="rounded-card bg-night border border-night-line p-4 mb-7">
        <p className="eyebrow text-cream-mute mb-1.5">Quest 4 badge</p>
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
