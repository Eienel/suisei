import { useEffect, useState } from 'react';
import {
  useCurrentAccount,
  useSuiClient,
  useSignTransaction,
} from '@mysten/dapp-kit';
import { useApp } from '@/state/app';
import { questById } from '@/data/quests';
import { AuthButton } from '@/components/AuthButton';
import { mintSponsoredBadge } from '@/sui/sponsored';
import {
  BADGE_CONFIGURED,
  SPONSOR_CONFIGURED,
  SUI_NETWORK,
} from '@/sui/config';
import { CheckCircle2, ExternalLink, Loader2, Zap } from 'lucide-react';

/**
 * Quest 2: Sponsored Tx + Object Model.
 *
 * Same vertical-slice shape as Quest 1, but the badge mint is wrapped
 * by a sponsor service so the user pays zero gas. When no sponsor is
 * configured, the mint is mocked so the demo still completes.
 */
export function Quest2Sponsored() {
  const quest = questById('sponsored')!;
  const account = useCurrentAccount();
  const phase = useApp((s) => s.questPhase);
  const setPhase = useApp((s) => s.setQuestPhase);
  const awardBadge = useApp((s) => s.awardBadge);
  const closeQuest = useApp((s) => s.closeQuest);
  const badges = useApp((s) => s.badges);

  const suiClient = useSuiClient();
  const { mutateAsync: signTransaction } = useSignTransaction();
  const [minting, setMinting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const existing = badges.find((b) => b.questId === 'sponsored');

  useEffect(() => {
    if (existing && phase !== 'done') setPhase('done');
  }, [existing, phase, setPhase]);

  const mint = async () => {
    if (!account) return;
    setError(null);
    setMinting(true);
    setPhase('badge');
    try {
      const badge = await mintSponsoredBadge({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        client: suiClient as any,
        recipient: account.address,
        questId: 'sponsored',
        signTxBytes: async (txBytes) => {
          // dapp-kit accepts a base64-encoded tx string; that avoids the
          // duplicated @mysten/sui Transaction type from wallet-standard.
          let s = '';
          for (let i = 0; i < txBytes.length; i++) s += String.fromCharCode(txBytes[i]);
          const b64 = typeof btoa !== 'undefined' ? btoa(s) : Buffer.from(s, 'binary').toString('base64');
          const res = await signTransaction({ transaction: b64 });
          return { signature: res.signature };
        },
      });
      awardBadge(badge);
      setPhase('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sponsored mint failed');
      setPhase('interact');
    } finally {
      setMinting(false);
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
            onMint={mint}
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

      {(!BADGE_CONFIGURED || !SPONSOR_CONFIGURED) && (
        <p className="mt-4 text-xs text-cream-mute font-mono">
          Dev mode: {SPONSOR_CONFIGURED ? '' : 'VITE_SPONSOR_URL not set · '}
          {BADGE_CONFIGURED ? '' : 'VITE_BADGE_PACKAGE_ID not set · '}
          sponsored mint mocked locally.
        </p>
      )}
    </div>
  );
}

function PhaseLadder({ phase }: { phase: string }) {
  const steps = [
    { id: 'intro', label: 'Intro' },
    { id: 'interact', label: 'Approve' },
    { id: 'badge', label: 'Sponsored mint' },
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
        On most chains, every action costs gas — and a brand-new wallet has none.
        Sui solves this with <span className="font-semibold text-butter">sponsored transactions</span>:
        the app you're using pays the gas while you sign the intent.
      </p>
      <p className="text-cream-dim leading-relaxed mb-7 text-[15px]">
        You'll mint your second on-chain badge. The transaction will succeed, but
        your wallet balance will not move. That's the sponsor doing its job.
      </p>
      <button type="button" onClick={onStart} className="btn-primary">
        Show me
        <Zap size={14} />
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
          You'll need a wallet for this one. Sign in with Google to get a fresh
          zkLogin address (Quest 1 walks through it).
        </p>
        <div className="flex justify-start">
          <AuthButton />
        </div>
      </div>
    );
  }
  return (
    <div>
      <p className="eyebrow text-cream-mute mb-2">Signing as</p>
      <p className="font-mono text-sm text-cream break-all mb-6">{address}</p>
      <p className="text-cream-dim leading-relaxed mb-6 text-[15px]">
        Sui transactions can be split: <span className="font-semibold text-cream">you</span> sign
        the intent, the <span className="font-semibold text-cream">sponsor</span> pays the gas.
        Two signatures, one transaction, zero balance change for you.
      </p>
      <button
        type="button"
        onClick={onMint}
        disabled={minting}
        className="btn-primary disabled:opacity-60"
      >
        {minting && <Loader2 size={14} className="animate-spin" />}
        Mint, on the house
      </button>
    </div>
  );
}

function BadgePanel() {
  return (
    <div className="flex items-center gap-3 text-cream-dim">
      <Loader2 size={16} className="animate-spin text-butter" />
      <span>Sponsor signing gas, then asking the network…</span>
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
          You paid nothing.
        </p>
      </div>
      <p className="text-cream-dim leading-relaxed mb-5 text-[15px]">
        That mint cost real gas — about 0.0008 SUI — and the sponsor covered it.
        Your wallet balance is exactly what it was a minute ago.
        {isMock ? ' (Locally mocked: set VITE_SPONSOR_URL to wire the real flow.)' : ''}
      </p>
      <div className="rounded-card bg-night border border-night-line p-4 mb-7">
        <p className="eyebrow text-cream-mute mb-1.5">Sponsored object</p>
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

