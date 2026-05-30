import { useMemo } from 'react';
import { QUESTS } from '@/data/quests';
import type { QuestDef, QuestId } from '@/types';
import { useApp } from '@/state/app';
import { Lock, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';

/**
 * Quest hub. Linear unlock (finish #N before #N+1) keeps the narrative
 * with Suisei coherent and makes the leaderboard meaningful.
 */
export function QuestHub() {
  const badges = useApp((s) => s.badges);
  const openQuest = useApp((s) => s.openQuest);

  const earnedIds = useMemo(() => new Set(badges.map((b) => b.questId)), [badges]);
  const firstUnclaimedIndex = QUESTS.findIndex((q) => !earnedIds.has(q.id));

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-10">
        <p className="eyebrow mb-4">Curriculum · {badges.length} of 8 badges</p>
        <h1 className="font-display text-4xl sm:text-5xl tracking-[-0.015em] font-semibold text-cream mb-3">
          Eight quests. Real on-chain code.
        </h1>
        <p className="text-cream-dim leading-relaxed max-w-2xl text-[17px]">
          Each one runs three to five minutes and finishes when you deploy a
          real Move package on Sui testnet, then mint a soulbound badge that
          proves you did it.
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
    'group text-left p-5 rounded-card border transition-all relative overflow-hidden';
  const variant = earned
    ? 'border-sage/40 bg-sage/10 hover:bg-sage/15 cursor-pointer'
    : unlocked
      ? 'border-night-line bg-night-soft hover:border-butter/40 hover:bg-night-soft/80 cursor-pointer'
      : 'border-night-line/60 bg-night-soft/40 opacity-50 cursor-not-allowed';

  return (
    <button
      type="button"
      onClick={unlocked ? onOpen : undefined}
      disabled={!unlocked}
      className={`${base} ${variant}`}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-cream-mute">
          {String(quest.number).padStart(2, '0')} · {quest.minutes} min
        </span>
        {earned ? (
          <CheckCircle2 size={15} className="text-sage" />
        ) : !unlocked ? (
          <Lock size={14} className="text-cream-mute" />
        ) : (
          <ArrowRight
            size={15}
            className="text-cream-mute group-hover:text-cream group-hover:translate-x-0.5 transition-all"
          />
        )}
      </div>
      <p className="font-display font-semibold text-cream text-[17px] leading-snug mb-2">
        {quest.title}
      </p>
      <p className="text-[13px] text-cream-dim">{quest.concept}</p>
      {quest.bounty && quest.bounty !== 'agentic' && (
        <span className="mt-4 inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.16em] text-butter">
          <Sparkles size={9} />
          {quest.bounty} track
        </span>
      )}
    </button>
  );
}
