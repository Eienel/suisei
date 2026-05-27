import { useMemo } from 'react';
import { QUESTS } from '@/data/quests';
import type { QuestDef, QuestId } from '@/types';
import { useApp } from '@/state/app';
import { Lock, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';

/**
 * Quest hub — the grid of 8 quests. Linear unlock (must finish #N
 * before #N+1) keeps the narrative tight and means the chat history
 * with Suisei stays coherent.
 */
export function QuestHub() {
  const badges = useApp((s) => s.badges);
  const openQuest = useApp((s) => s.openQuest);

  const earnedIds = useMemo(() => new Set(badges.map((b) => b.questId)), [badges]);
  const firstUnclaimedIndex = QUESTS.findIndex((q) => !earnedIds.has(q.id));

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-12">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-fg-mute mb-3">
          Curriculum · {badges.length} / 8 badges
        </p>
        <h1 className="text-4xl font-bold tracking-tight mb-3">
          Eight quests. Real on-chain code.
        </h1>
        <p className="text-fg-dim leading-relaxed max-w-2xl">
          Each quest takes 3–5 minutes and ends with you deploying real Move on
          Sui testnet, then minting a soulbound badge that proves you did it.
        </p>
      </header>

      <div className="grid sm:grid-cols-2 gap-3">
        {QUESTS.map((q, i) => {
          const earned = earnedIds.has(q.id);
          const unlocked = i <= firstUnclaimedIndex || earned;
          return (
            <QuestTile
              key={q.id}
              quest={q}
              earned={earned}
              unlocked={unlocked}
              onOpen={() => openQuest(q.id as QuestId)}
            />
          );
        })}
      </div>
    </div>
  );
}

function QuestTile({
  quest,
  earned,
  unlocked,
  onOpen,
}: {
  quest: QuestDef;
  earned: boolean;
  unlocked: boolean;
  onOpen: () => void;
}) {
  const base =
    'group text-left p-4 rounded-xl border transition-all relative overflow-hidden';
  const variant = earned
    ? 'border-accent-cyan/40 bg-accent-cyan/[0.04] hover:bg-accent-cyan/[0.07]'
    : unlocked
      ? 'border-ink-line bg-ink-soft/60 hover:border-accent-blue/40 hover:bg-ink-soft cursor-pointer'
      : 'border-ink-line/60 bg-ink-soft/30 opacity-50 cursor-not-allowed';

  return (
    <button
      type="button"
      onClick={unlocked ? onOpen : undefined}
      disabled={!unlocked}
      className={`${base} ${variant}`}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-fg-mute">
          {String(quest.number).padStart(2, '0')} · {quest.minutes} min
        </span>
        {earned ? (
          <CheckCircle2 size={14} className="text-accent-cyan" />
        ) : !unlocked ? (
          <Lock size={14} className="text-fg-mute" />
        ) : (
          <ArrowRight
            size={14}
            className="text-fg-mute group-hover:text-fg group-hover:translate-x-0.5 transition-all"
          />
        )}
      </div>
      <p className="font-semibold text-fg leading-snug mb-1.5">{quest.title}</p>
      <p className="text-xs text-fg-mute">{quest.concept}</p>
      {quest.bounty && quest.bounty !== 'agentic' && (
        <span className="mt-3 inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-accent-yellow">
          <Sparkles size={9} />
          {quest.bounty} track
        </span>
      )}
    </button>
  );
}
