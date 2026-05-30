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
  Lock,
  Unlock,
  AlertCircle,
} from 'lucide-react';

/**
 * Quest 7: Walrus + Seal.
 *
 * Encrypt a short message with Seal (mocked — real Seal needs the
 * threshold-encryption SDK), publish ciphertext to Walrus testnet
 * (also mocked here — real publishes cost SUI), and verify that the
 * Move-side access policy gates decryption. The lesson is the
 * combination, not any one piece.
 */
export function Quest7WalrusSeal() {
  const quest = questById('walrus_seal')!;
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

  const existing = badges.find((b) => b.questId === 'walrus_seal');

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
        awardBadge(mockBadge('walrus_seal', account.address));
        setPhase('done');
        return;
      }
      const tx = buildBadgeMintTx({ recipient: account.address, questId: 'walrus_seal' });
      signAndExecute(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { transaction: tx as any },
        {
          onSuccess: async ({ digest }) => {
            try {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const badge = await badgeFromTxResult(suiClient as any, digest, 'walrus_seal');
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
          <SecretPanel
            address={account?.address ?? null}
            badgesEarned={badges.length}
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
          Walrus + Seal flow is also simulated client-side for the demo.
        </p>
      )}
    </div>
  );
}

function PhaseLadder({ phase }: { phase: string }) {
  const steps = [
    { id: 'intro', label: 'Intro' },
    { id: 'interact', label: 'Seal + publish' },
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
        <span className="font-mono text-butter">Walrus</span> is decentralized
        blob storage on Sui — public, durable, content-addressed.{' '}
        <span className="font-mono text-butter">Seal</span> is a threshold
        encryption layer where the decryption key is itself gated by an
        on-chain Move policy.
      </p>
      <p className="text-cream-dim leading-relaxed mb-7 text-[15px]">
        Together they let you publish a public ciphertext that{' '}
        <em>only</em> qualifying wallets can read. We'll publish a secret note
        whose policy is "must hold a Suisei badge", then verify both sides:
        a holder reads it, a non-holder gets refused.
      </p>
      <button type="button" onClick={onStart} className="btn-primary">
        Open the vault
        <Lock size={14} />
      </button>
    </div>
  );
}

interface PublishResult {
  blobId: string;
  ciphertext: string;
  policyTx: string;
}

function SecretPanel({
  address,
  badgesEarned,
  onSolved,
  minting,
}: {
  address: string | null;
  badgesEarned: number;
  onSolved: () => void;
  minting: boolean;
}) {
  const [message, setMessage] = useState(
    'sui graduates: the only EVM port that survives is the metaphor.',
  );
  const [published, setPublished] = useState<PublishResult | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [decrypted, setDecrypted] = useState<{ holder: string | null; nonHolder: string | null }>({
    holder: null,
    nonHolder: null,
  });
  const [checking, setChecking] = useState<'holder' | 'non_holder' | null>(null);

  if (!address) {
    return (
      <div className="card-night p-7">
        <p className="text-cream leading-relaxed mb-5 text-[15px]">
          Sign in first — the policy will gate on your wallet's badge holdings.
        </p>
        <div className="flex justify-start">
          <AuthButton />
        </div>
      </div>
    );
  }

  const publish = async () => {
    setPublishing(true);
    await new Promise((r) => setTimeout(r, 900));
    setPublished({
      blobId: `walrus_${shortHash(message + address)}`,
      ciphertext: pseudoCiphertext(message),
      policyTx: `0x${shortHash('policy' + address)}`,
    });
    setPublishing(false);
  };

  const tryRead = async (who: 'holder' | 'non_holder') => {
    if (!published) return;
    setChecking(who);
    await new Promise((r) => setTimeout(r, 650));
    if (who === 'holder') {
      setDecrypted((d) => ({ ...d, holder: message }));
    } else {
      setDecrypted((d) => ({
        ...d,
        nonHolder: 'seal::policy::access_denied — wallet holds 0 Suisei badges',
      }));
    }
    setChecking(null);
  };

  const both = decrypted.holder && decrypted.nonHolder;
  const eligible = badgesEarned > 0;

  return (
    <div className="space-y-4">
      <div className="card-night p-5">
        <label className="eyebrow text-cream-mute block mb-2">Plaintext</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={!!published}
          className="w-full font-mono text-[13px] bg-night border border-night-line rounded-card p-3 text-cream resize-none focus:border-butter/60 focus:outline-none disabled:opacity-60"
          rows={2}
        />
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={publish}
            disabled={publishing || !!published || message.trim().length === 0}
            className="btn-primary disabled:opacity-50"
          >
            {publishing && <Loader2 size={14} className="animate-spin" />}
            seal + walrus_publish
          </button>
          {published && (
            <span className="text-xs text-sage font-mono">published</span>
          )}
        </div>
      </div>

      {published && (
        <div className="card-night p-5">
          <p className="eyebrow text-cream-mute mb-2">On chain + on Walrus</p>
          <div className="space-y-2 font-mono text-[12px] text-cream-dim">
            <p>
              <span className="text-cream-mute">walrus blob:</span>{' '}
              {published.blobId}
            </p>
            <p>
              <span className="text-cream-mute">policy tx:</span>{' '}
              {published.policyTx}
            </p>
            <p>
              <span className="text-cream-mute">ciphertext:</span>{' '}
              <span className="break-all">{published.ciphertext}</span>
            </p>
          </div>
        </div>
      )}

      {published && (
        <div className="grid sm:grid-cols-2 gap-3">
          <ReadCard
            who="holder"
            label={`Badge holder (${badgesEarned}/8)`}
            onTry={() => tryRead('holder')}
            checking={checking === 'holder'}
            result={decrypted.holder}
            disabled={!eligible}
            disabledNote={eligible ? null : 'no badges yet — earlier quests required'}
          />
          <ReadCard
            who="non_holder"
            label="Empty wallet (0/8)"
            onTry={() => tryRead('non_holder')}
            checking={checking === 'non_holder'}
            result={decrypted.nonHolder}
            disabled={false}
            isError
          />
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
          {!published
            ? 'publish first'
            : both
              ? 'both reads viewed'
              : 'try both wallets to see the policy in action'}
        </span>
      </div>
    </div>
  );
}

function ReadCard({
  label,
  onTry,
  checking,
  result,
  disabled,
  disabledNote,
  isError,
}: {
  who: 'holder' | 'non_holder';
  label: string;
  onTry: () => void;
  checking: boolean;
  result: string | null;
  disabled: boolean;
  disabledNote?: string | null;
  isError?: boolean;
}) {
  return (
    <div className="card-night p-5">
      <p className="eyebrow text-cream-mute mb-2">{label}</p>
      <button
        type="button"
        onClick={onTry}
        disabled={checking || disabled || !!result}
        className="btn-ghost text-sm disabled:opacity-50"
      >
        {checking ? (
          <Loader2 size={13} className="animate-spin" />
        ) : (
          <Unlock size={13} />
        )}
        seal::decrypt
      </button>
      {disabledNote && (
        <p className="mt-2 text-[11px] text-cream-mute font-mono">{disabledNote}</p>
      )}
      {result && (
        <div
          className={
            'mt-3 rounded-card p-3 border font-mono text-[12px] leading-relaxed flex items-start gap-2.5 ' +
            (isError
              ? 'bg-terracotta/10 border-terracotta/40 text-terracotta'
              : 'bg-sage/10 border-sage/40 text-sage')
          }
        >
          {isError ? (
            <AlertCircle size={13} className="mt-0.5 shrink-0" />
          ) : (
            <CheckCircle2 size={13} className="mt-0.5 shrink-0" />
          )}
          <span className="break-words">{result}</span>
        </div>
      )}
    </div>
  );
}

function BadgePanel() {
  return (
    <div className="card-night p-7 flex items-center gap-3 text-cream-dim">
      <Loader2 size={16} className="animate-spin text-butter" />
      <span>Minting your Quest 7 badge…</span>
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
          Public ciphertext, gated reads.
        </p>
      </div>
      <p className="text-cream-dim leading-relaxed mb-5 text-[15px]">
        Walrus stores the ciphertext where anyone can fetch it. Seal stores
        the policy and decryption key on Sui where Move enforces who can
        consume the key. The two layers compose into "encrypted storage with
        on-chain access control" — a primitive most chains can't express
        without trusting an off-chain server.
      </p>
      <div className="rounded-card bg-night border border-night-line p-4 mb-7">
        <p className="eyebrow text-cream-mute mb-1.5">Quest 7 badge (Walrus track)</p>
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

function shortHash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(16).padStart(16, '0').slice(0, 16);
}

function pseudoCiphertext(plaintext: string): string {
  // Visual-only "ciphertext" — base64 of an XOR-with-rotating-byte. The
  // real Seal flow uses BLS threshold encryption; this is the demo
  // stand-in. Never use in production.
  const key = 0x5c;
  let s = '';
  for (let i = 0; i < plaintext.length; i++) {
    s += String.fromCharCode(plaintext.charCodeAt(i) ^ (key + (i % 7)));
  }
  const b64 =
    typeof btoa !== 'undefined'
      ? btoa(s)
      : Buffer.from(s, 'binary').toString('base64');
  return b64.length > 80 ? b64.slice(0, 80) + '…' : b64;
}
