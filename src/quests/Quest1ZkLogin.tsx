import { useEffect, useState } from 'react';
import {
  useCurrentAccount,
  useSuiClient,
  useSignAndExecuteTransaction,
} from '@mysten/dapp-kit';
import { useApp } from '@/state/app';
import { questById } from '@/data/quests';
import { AuthButton } from '@/components/AuthButton';
import { buildBadgeMintTx, badgeFromTxResult, mockBadge } from '@/sui/badge';
import { BADGE_CONFIGURED, SUI_NETWORK } from '@/sui/config';
import { CheckCircle2, ExternalLink, Loader2, Sparkles } from 'lucide-react';

/**
 * Quest 1: zkLogin + first soulbound badge.
 *
 * Phases: intro → interact (sign in, then mint) → badge (in flight)
 * → done (badge displayed, next-quest CTA).
 */
export function Quest1ZkLogin() {
  const quest = questById('zklogin')!;
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

  const existingBadge = badges.find((b) => b.questId === 'zklogin');

  useEffect(() => {
    if (existingBadge && phase !== 'done') setPhase('done');
  }, [existingBadge, phase, setPhase]);

  const mintBadge = async () => {
    if (!account) return;
    setError(null);
    setMinting(true);
    setPhase('badge');

    try {
      if (!BADGE_CONFIGURED) {
        await new Promise((r) => setTimeout(r, 1200));
        const badge = mockBadge('zklogin', account.address);
        awardBadge(badge);
        setPhase('done');
        return;
      }
      const tx = buildBadgeMintTx({ recipient: account.address, questId: 'zklogin' });
      signAndExecute(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { transaction: tx as any },
        {
          onSuccess: async ({ digest }) => {
            try {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const badge = await badgeFromTxResult(suiClient as any, digest, 'zklogin');
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

      <section className="mt-8 card-night p-7">
        {phase === 'intro' && <IntroPanel onStart={() => setPhase('interact')} />}
        {phase === 'interact' && (
          <InteractPanel
            address={account?.address ?? null}
            onMint={mintBadge}
            minting={minting}
          />
        )}
        {phase === 'badge' && <BadgePanel minting={minting} />}
        {phase === 'done' && existingBadge && (
          <DonePanel badge={existingBadge} onNext={() => closeQuest()} />
        )}
        {error && (
          <p className="mt-4 text-sm text-terracotta font-mono">{error}</p>
        )}
      </section>

      {!BADGE_CONFIGURED && (
        <p className="mt-4 text-xs text-cream-mute font-mono">
          Dev mode: VITE_BADGE_PACKAGE_ID not set, badge mints are mocked
          locally.
        </p>
      )}
    </div>
  );
}

function PhaseLadder({ phase }: { phase: string }) {
  const steps = [
    { id: 'intro', label: 'Intro' },
    { id: 'interact', label: 'Sign in' },
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
    <div>
      <p className="text-cream leading-relaxed mb-3 text-[15px]">
        zkLogin uses a zero-knowledge proof to turn your Google account into a
        normal Sui address. Your Google identity stays off chain.
      </p>
      <p className="text-cream-dim leading-relaxed mb-7 text-[15px]">
        You will sign in, get a fresh address, and immediately use it to mint
        your first on-chain object: a soulbound proof you finished this quest.
      </p>
      <button type="button" onClick={onStart} className="btn-primary">
        I'm ready
        <Sparkles size={14} />
      </button>
    </div>
  );
}

function InteractPanel({
  address,
  onMint,
  minting,
}: {
  address: string | null;
  onMint: () => void;
  minting: boolean;
}) {
  if (!address) {
    return (
      <div>
        <p className="text-cream leading-relaxed mb-5 text-[15px]">
          Sign in with Google to get your zkLogin address. The button is in the
          top right of this page.
        </p>
        <div className="flex justify-start">
          <AuthButton />
        </div>
      </div>
    );
  }
  return (
    <div>
      <p className="eyebrow text-cream-mute mb-2">Your address</p>
      <p className="font-mono text-sm text-cream break-all mb-6">{address}</p>
      <p className="text-cream-dim leading-relaxed mb-6 text-[15px]">
        That is a real Sui address. You can paste it into any wallet or
        explorer. Now mint your first object to it.
      </p>
      <button
        type="button"
        onClick={onMint}
        disabled={minting}
        className="btn-primary disabled:opacity-60"
      >
        {minting && <Loader2 size={14} className="animate-spin" />}
        Mint my first badge
      </button>
    </div>
  );
}

function BadgePanel({ minting }: { minting: boolean }) {
  return (
    <div className="flex items-center gap-3 text-cream-dim">
      <Loader2 size={16} className="animate-spin text-butter" />
      <span>{minting ? 'Submitting mint to Sui testnet…' : 'Confirming on chain…'}</span>
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
    <div>
      <div className="flex items-center gap-2 mb-4">
        <CheckCircle2 size={18} className="text-sage" />
        <p className="font-display font-semibold text-cream text-[17px]">
          First quest complete.
        </p>
      </div>
      <p className="text-cream-dim leading-relaxed mb-5 text-[15px]">
        Your soulbound badge is in your wallet. The object id below is a real,
        verifiable Sui object
        {isMock ? ' (mocked locally; set VITE_BADGE_PACKAGE_ID to mint for real)' : ''}.
      </p>
      <div className="rounded-card bg-night border border-night-line p-4 mb-7">
        <p className="eyebrow text-cream-mute mb-1.5">Badge object</p>
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
