import { useEffect, useState } from 'react';
import { useCurrentAccount, useSuiClient, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { useApp } from '@/state/app';
import { questById } from '@/data/quests';
import { AuthButton } from '@/components/AuthButton';
import { buildBadgeMintTx, badgeFromTxResult, mockBadge } from '@/sui/badge';
import { BADGE_CONFIGURED, DEEPBOOK_POOL, SUI_NETWORK } from '@/sui/config';
import {
  fetchOrderBook,
  matchAgainstBook,
  type OrderBook,
  type MatchResult,
} from '@/sui/deepbook';
import {
  CheckCircle2,
  ExternalLink,
  Loader2,
  AlertCircle,
  GraduationCap,
} from 'lucide-react';

/**
 * Quest 8: DeepBook graduate.
 *
 * The graduate quest. The user picks side + price + size on a mock
 * SUI/USDC orderbook and submits a limit order. On a Sui Overflow
 * setup with a funded testnet wallet this could be wired to the real
 * DeepBook V3 client; for Sprint 0 the match is simulated against a
 * frozen orderbook so the demo runs end-to-end without funding.
 */
export function Quest8DeepBook() {
  const quest = questById('deepbook_grad')!;
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

  const existing = badges.find((b) => b.questId === 'deepbook_grad');

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
        await new Promise((r) => setTimeout(r, 1100));
        awardBadge(mockBadge('deepbook_grad', account.address));
        setPhase('done');
        return;
      }
      const tx = buildBadgeMintTx({ recipient: account.address, questId: 'deepbook_grad' });
      signAndExecute(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { transaction: tx as any },
        {
          onSuccess: async ({ digest }) => {
            try {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const badge = await badgeFromTxResult(suiClient as any, digest, 'deepbook_grad');
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
          Quest {String(quest.number).padStart(2, '0')} · graduate · {quest.concept}
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
          <OrderPanel
            address={account?.address ?? null}
            onFilled={mint}
            minting={minting}
          />
        )}
        {phase === 'badge' && <BadgePanel />}
        {phase === 'done' && existing && (
          <DonePanel
            badge={existing}
            totalBadges={badges.length}
            onNext={() => closeQuest()}
          />
        )}
        {error && (
          <p className="mt-4 text-sm text-terracotta font-mono">{error}</p>
        )}
      </section>

      <p className="mt-4 text-xs text-cream-mute font-mono">
        Live: the orderbook is fetched from the DeepBook {SUI_NETWORK} indexer.
        Matching runs against that real state. Order placement is simulated —
        a real post needs a funded BalanceManager, which a fresh zkLogin wallet
        doesn't have.
      </p>
    </div>
  );
}

function PhaseLadder({ phase }: { phase: string }) {
  const steps = [
    { id: 'intro', label: 'Intro' },
    { id: 'interact', label: 'Place an order' },
    { id: 'badge', label: 'Mint graduate' },
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
        <span className="font-mono text-butter">DeepBook</span> is Sui's
        native, fully on-chain central-limit orderbook. No off-chain market
        maker, no AMM curve, no relayer. Just a Move package that holds bids,
        asks, and a price-time priority match engine.
      </p>
      <p className="text-cream-dim leading-relaxed mb-7 text-[15px]">
        For your graduation: place a limit order on the SUI / USDC book. The
        order routes against the live state, fills if it crosses, rests on
        the book if it doesn't. Then mint the Sui Stack Graduate badge.
      </p>
      <button type="button" onClick={onStart} className="btn-primary">
        Open the book
        <GraduationCap size={14} />
      </button>
    </div>
  );
}

function OrderPanel({
  address,
  onFilled,
  minting,
}: {
  address: string | null;
  onFilled: () => void;
  minting: boolean;
}) {
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [priceStr, setPriceStr] = useState('');
  const [sizeStr, setSizeStr] = useState('5');
  const [result, setResult] = useState<MatchResult | null>(null);
  const [routing, setRouting] = useState(false);
  const [book, setBook] = useState<OrderBook | null>(null);
  const [loadingBook, setLoadingBook] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchOrderBook(6).then((b) => {
      if (cancelled) return;
      setBook(b);
      setLoadingBook(false);
      // Seed a price near the best ask so the first order is likely to cross.
      const bestAsk = b.asks[0]?.price;
      if (bestAsk) setPriceStr(String(bestAsk));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!address) {
    return (
      <div className="card-night p-7">
        <p className="text-cream leading-relaxed mb-5 text-[15px]">
          You'll need a wallet to sign the order. Sign in.
        </p>
        <div className="flex justify-start">
          <AuthButton />
        </div>
      </div>
    );
  }

  const route = async () => {
    if (!book) return;
    setRouting(true);
    await new Promise((r) => setTimeout(r, 600));
    setResult(matchAgainstBook(book, side, Number(priceStr), Number(sizeStr)));
    setRouting(false);
  };

  const ok = result?.status === 'filled' || result?.status === 'partial' || result?.status === 'resting';
  const topBids = book ? [...book.bids].sort((a, b) => b.price - a.price).slice(0, 5) : [];
  const topAsks = book ? [...book.asks].sort((a, b) => a.price - b.price).slice(0, 5) : [];

  return (
    <div className="space-y-4">
      <div className="card-night p-0 overflow-hidden">
        <div className="px-5 py-2.5 border-b border-night-line/70 flex items-center justify-between">
          <span className="eyebrow text-cream-mute">
            {DEEPBOOK_POOL.replace('_', ' / ')} · {SUI_NETWORK}
          </span>
          <span className="font-mono text-[10px] text-cream-mute flex items-center gap-1.5">
            {loadingBook ? (
              <>
                <Loader2 size={10} className="animate-spin" />
                loading book
              </>
            ) : book?.live ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-sage animate-pulse-soft" />
                live indexer
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-butter" />
                cached book
              </>
            )}
          </span>
        </div>
        <div className="grid grid-cols-2 divide-x divide-night-line/70 font-mono text-[12px]">
          <div className="p-4">
            <p className="eyebrow text-sage mb-2">bids</p>
            {topBids.map((b) => (
              <div key={b.price} className="flex justify-between text-cream-dim">
                <span>{b.price}</span>
                <span>{b.size}</span>
              </div>
            ))}
            {topBids.length === 0 && <p className="text-cream-mute">—</p>}
          </div>
          <div className="p-4">
            <p className="eyebrow text-terracotta mb-2">asks</p>
            {topAsks.map((a) => (
              <div key={a.price} className="flex justify-between text-cream-dim">
                <span>{a.price}</span>
                <span>{a.size}</span>
              </div>
            ))}
            {topAsks.length === 0 && <p className="text-cream-mute">—</p>}
          </div>
        </div>
      </div>

      <div className="card-night p-5 grid grid-cols-3 gap-3">
        <div>
          <p className="eyebrow text-cream-mute mb-1.5">side</p>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setSide('buy')}
              className={`flex-1 font-mono text-sm py-2 rounded-pill border ${
                side === 'buy'
                  ? 'bg-sage/15 border-sage/60 text-sage'
                  : 'border-night-line text-cream-mute hover:text-cream'
              }`}
            >
              buy
            </button>
            <button
              type="button"
              onClick={() => setSide('sell')}
              className={`flex-1 font-mono text-sm py-2 rounded-pill border ${
                side === 'sell'
                  ? 'bg-terracotta/15 border-terracotta/60 text-terracotta'
                  : 'border-night-line text-cream-mute hover:text-cream'
              }`}
            >
              sell
            </button>
          </div>
        </div>
        <div>
          <p className="eyebrow text-cream-mute mb-1.5">price</p>
          <input
            value={priceStr}
            onChange={(e) => setPriceStr(e.target.value)}
            className="w-full bg-night border border-night-line rounded-pill px-3 py-2 text-sm font-mono text-cream focus:border-butter/60 focus:outline-none"
          />
        </div>
        <div>
          <p className="eyebrow text-cream-mute mb-1.5">size</p>
          <input
            value={sizeStr}
            onChange={(e) => setSizeStr(e.target.value)}
            className="w-full bg-night border border-night-line rounded-pill px-3 py-2 text-sm font-mono text-cream focus:border-butter/60 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={route}
          disabled={routing || minting || loadingBook || !book}
          className="btn-primary disabled:opacity-50"
        >
          {routing && <Loader2 size={14} className="animate-spin" />}
          place limit order
        </button>
        <span className="text-xs text-cream-mute font-mono">
          {result
            ? `routed: ${result.status}`
            : 'set side / price / size, then route'}
        </span>
      </div>

      {result && (
        <div
          className={
            'rounded-card p-4 border text-[13px] font-mono leading-relaxed flex items-start gap-2.5 ' +
            (ok
              ? 'bg-sage/10 border-sage/40 text-sage'
              : 'bg-terracotta/10 border-terracotta/40 text-terracotta')
          }
        >
          {ok ? (
            <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
          ) : (
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
          )}
          <div>
            <p className="opacity-70">
              {result.side} {result.size} @ {result.price.toFixed(4)} · {result.status}
            </p>
            <p className="mt-0.5">{result.notes}</p>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onFilled}
        disabled={!ok || minting}
        className="btn-primary disabled:opacity-50"
      >
        {minting && <Loader2 size={14} className="animate-spin" />}
        mint graduate badge
        <GraduationCap size={14} />
      </button>
    </div>
  );
}

function BadgePanel() {
  return (
    <div className="card-night p-7 flex items-center gap-3 text-cream-dim">
      <Loader2 size={16} className="animate-spin text-butter" />
      <span>Minting your Sui Stack Graduate badge…</span>
    </div>
  );
}

function DonePanel({
  badge,
  totalBadges,
  onNext,
}: {
  badge: { objectId: string; txDigest: string };
  totalBadges: number;
  onNext: () => void;
}) {
  const isMock = badge.txDigest.startsWith('mock-');
  const explorer = isMock
    ? null
    : `https://suiscan.xyz/${SUI_NETWORK}/tx/${badge.txDigest}`;
  const fullSet = totalBadges >= 8;
  return (
    <div className="card-night p-7">
      <div className="flex items-center gap-2 mb-4">
        <GraduationCap size={20} className="text-butter" />
        <p className="font-display font-semibold text-cream text-[17px]">
          {fullSet
            ? 'Sui Stack Graduate. All 8 badges.'
            : 'Quest 8 cleared. Loop back for the rest.'}
        </p>
      </div>
      <p className="text-cream-dim leading-relaxed mb-5 text-[15px]">
        zkLogin, sponsored tx, abilities, capabilities, soulbound, PTBs,
        Walrus + Seal, DeepBook. The Sui stack, end-to-end, in your wallet.
        Now plug{' '}
        <span className="font-mono text-butter">@suisei/sui-skills-mcp</span>{' '}
        into Claude Desktop or Cursor and build something that actually does.
      </p>
      <div className="rounded-card bg-night border border-night-line p-4 mb-7">
        <p className="eyebrow text-cream-mute mb-1.5">Graduate badge</p>
        <p className="font-mono text-xs text-cream-dim break-all">{badge.objectId}</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={onNext} className="btn-primary">
          Back to hub
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
