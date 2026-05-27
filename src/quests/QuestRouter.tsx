import { useApp } from '@/state/app';
import { Quest1ZkLogin } from './Quest1ZkLogin';
import { QuestSoon } from './QuestSoon';
import { QuestHub } from '@/components/QuestHub';

/**
 * Routes the active screen inside Play between the hub and a specific
 * quest component. Only Quest 1 has a real implementation today.
 */
export function QuestRouter() {
  const currentQuest = useApp((s) => s.currentQuest);
  if (!currentQuest) return <QuestHub />;
  if (currentQuest === 'zklogin') return <Quest1ZkLogin />;
  return <QuestSoon id={currentQuest} />;
}
