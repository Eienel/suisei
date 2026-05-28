import { useApp } from '@/state/app';
import { Quest1ZkLogin } from './Quest1ZkLogin';
import { Quest2Sponsored } from './Quest2Sponsored';
import { Quest3Abilities } from './Quest3Abilities';
import { Quest4Capability } from './Quest4Capability';
import { Quest5Soulbound } from './Quest5Soulbound';
import { Quest6Ptb } from './Quest6Ptb';
import { QuestSoon } from './QuestSoon';
import { QuestHub } from '@/components/QuestHub';

/**
 * Routes the active screen inside Play between the hub and a specific
 * quest component. Quests 1–6 are vertical slices; 7 + 8 land in
 * Sprint 1.
 */
export function QuestRouter() {
  const currentQuest = useApp((s) => s.currentQuest);
  if (!currentQuest) return <QuestHub />;
  if (currentQuest === 'zklogin') return <Quest1ZkLogin />;
  if (currentQuest === 'sponsored') return <Quest2Sponsored />;
  if (currentQuest === 'abilities') return <Quest3Abilities />;
  if (currentQuest === 'capability') return <Quest4Capability />;
  if (currentQuest === 'soulbound') return <Quest5Soulbound />;
  if (currentQuest === 'ptb') return <Quest6Ptb />;
  return <QuestSoon id={currentQuest} />;
}
