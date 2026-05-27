import { questById } from '@/data/quests';
import { useApp } from '@/state/app';
import type { QuestId } from '@/types';

/**
 * Placeholder for quests still in-flight. Renders the quest's intro
 * tile and a "back to hub" button. Real quest components land in
 * Sprint 1 / 2 / 3.
 */
export function QuestSoon({ id }: { id: QuestId }) {
  const quest = questById(id)!;
  const closeQuest = useApp((s) => s.closeQuest);
  return (
    <div className="max-w-2xl mx-auto py-12">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent-yellow mb-3">
        Quest {String(quest.number).padStart(2, '0')} · {quest.concept}
      </p>
      <h1 className="text-3xl font-bold tracking-tight mb-3">{quest.title}</h1>
      <p className="text-fg-dim leading-relaxed mb-6">{quest.hook}</p>
      <div className="glass rounded-2xl p-6">
        <p className="font-mono text-[11px] uppercase tracking-widest text-fg-mute mb-2">
          In flight
        </p>
        <p className="text-fg leading-relaxed mb-6">
          Suisei is still writing this quest. Check back next sprint — it's on
          the timeline in PLAN.md.
        </p>
        <button type="button" onClick={closeQuest} className="btn-primary">
          ← Back to hub
        </button>
      </div>
    </div>
  );
}
