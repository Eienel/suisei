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
 * Quest 1 — zkLogin + first badge.
 *
 * Phases:
 *  intro    → narrate, big "I'm ready" CTA
 *  interact → require signed-in account, expose Mint button
 *  badge    → submit mint tx (real if VITE_BADGE_PACKAGE_ID set, else mock)
 *  done     → show badge ref + "Next quest" CTA
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

  // If the player comes back to Quest 1 already badged, jump to done.
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
        // dapp-kit and our @mysten/sui copy mismatch on a private symbol; the
        // runtime shapes match, so cast at the boundary.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { transaction: tx as any },
        {
          onSuccess: async ({ digest }) => {
            try {
              // Same dual-copy issue for the SuiClient type.
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
    <div className="max-w-2xl mx-auto py-12">
      <header className="mb-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent-cyan mb-3">
          Quest {String(quest.number).padStart(2, '0')} · {quest.concept}
        </p>
        <h1 className="text-3xl font-bold tracking-tight mb-3">{quest.title}</h1>
        <p className="text-fg-dim leading-relaxed">{quest.hook}</p>
      </header>

      <PhaseLadder phase={phase} />

      <section className="mt-8 glass rounded-2xl p-6">
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
          <DonePanel
            badge={existingBadge}
            onNext={() => closeQuest()}
          />
        )}
        {error && (
          <p className="mt-4 text-sm text-accent-magenta font-mono">{error}</p>
        )}
      </section>

      {!BADGE_CONFIGURED && (
        <p className="mt-4 text-xs text-fg-mute font-mono">
          ⚑ Dev mode: VITE_BADGE_PACKAGE_ID not set — badge mints are mocked
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
    <ol className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest">
      {steps.map((s, i) => {
        const state = i < idx ? 'past' : i === idx ? 'now' : 'future';
        return (
          <li key={s.id} className="flex items-center gap-2">
            <span
              className={
                state === 'past'
                  ? 'text-accent-cyan'
                  : state === 'now'
                    ? 'text-fg'
                    : 'text-fg-mute'
              }
            >
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <span className="w-6 h-px bg-ink-line" />
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
      <p className="text-fg leading-relaxed mb-2">
        zkLogin uses a zero-knowledge proof to turn your Google account into a
        normal Sui address — without ever sharing your Google identity on chain.
      </p>
      <p className="text-fg-dim leading-relaxed mb-6">
        You'll sign in, get a fresh address, and immediately use it to mint your
        first on-chain object: a soulbound proof you finished this quest.
      </p>
      <button
        type="button"
        onClick={onStart}
        className="btn-primary inline-flex items-center gap-2"
      >
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
        <p className="text-fg leading-relaxed mb-4">
          Sign in with Google to get your zkLogin address. The button is in the
          top-right of this page.
        </p>
        <div className="flex justify-start">
          <AuthButton />
        </div>
      </div>
    );
  }
  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-widest text-fg-mute mb-2">
        Your address
      </p>
      <p className="font-mono text-sm text-fg break-all mb-6">{address}</p>
      <p className="text-fg-dim leading-relaxed mb-6">
        That's a real Sui address — you can paste it into any wallet or
        explorer. Now let's mint your first object to it.
      </p>
      <button
        type="button"
        onClick={onMint}
        disabled={minting}
        className="btn-primary inline-flex items-center gap-2 disabled:opacity-60"
      >
        {minting && <Loader2 size={14} className="animate-spin" />}
        Mint my first badge
      </button>
    </div>
  );
}

function BadgePanel({ minting }: { minting: boolean }) {
  return (
    <div className="flex items-center gap-3 text-fg-dim">
      <Loader2 size={16} className="animate-spin text-accent-cyan" />
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
        <CheckCircle2 size={18} className="text-accent-cyan" />
        <p className="font-semibold text-fg">First quest complete.</p>
      </div>
      <p className="text-fg-dim leading-relaxed mb-4">
        Your soulbound badge is in your wallet. The object id below is a real,
        verifiable Sui object{isMock ? ' (mocked — set VITE_BADGE_PACKAGE_ID to mint for real)' : ''}.
      </p>
      <div className="rounded-lg bg-ink/60 border border-ink-line/60 p-3 mb-6">
        <p className="font-mono text-[10px] uppercase tracking-widest text-fg-mute mb-1">
          Badge object
        </p>
        <p className="font-mono text-xs text-fg-dim break-all">{badge.objectId}</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={onNext} className="btn-primary">
          Next quest →
        </button>
        {explorer && (
          <a
            href={explorer}
            target="_blank"
            rel="noreferrer"
            className="btn-ghost inline-flex items-center gap-1.5 text-sm"
          >
            <ExternalLink size={13} />
            View on Suiscan
          </a>
        )}
      </div>
    </div>
  );
}
