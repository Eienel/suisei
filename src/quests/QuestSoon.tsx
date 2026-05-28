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
      <p className="eyebrow mb-3 text-butter">
        Quest {String(quest.number).padStart(2, '0')} · {quest.concept}
      </p>
      <h1 className="font-display text-3xl sm:text-4xl tracking-[-0.015em] font-semibold text-cream mb-3">
        {quest.title}
      </h1>
      <p className="text-cream-dim leading-relaxed text-[17px] mb-7">{quest.hook}</p>
      <div className="card-night p-7">
        <p className="eyebrow text-cream-mute mb-2">In flight</p>
        <p className="text-cream leading-relaxed mb-6 text-[15px]">
          Suisei is still writing this quest. Sprints 1–3 ship the remaining
          six — pick an earlier quest while this one's still in the oven.
        </p>
        <button type="button" onClick={closeQuest} className="btn-primary">
          ← Back to hub
        </button>
      </div>
    </div>
  );
}
