import { useApp } from '@/state/app';
import { Quest1ZkLogin } from './Quest1ZkLogin';
import { Quest2Sponsored } from './Quest2Sponsored';
import { Quest3Abilities } from './Quest3Abilities';
import { Quest4Capability } from './Quest4Capability';
import { Quest5Soulbound } from './Quest5Soulbound';
import { Quest6Ptb } from './Quest6Ptb';
import { Quest7WalrusSeal } from './Quest7WalrusSeal';
import { Quest8DeepBook } from './Quest8DeepBook';
import { QuestHub } from '@/components/QuestHub';

/**
 * Routes the active screen inside Play between the hub and a specific
 * quest component. All eight quests have vertical slices.
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
  if (currentQuest === 'walrus_seal') return <Quest7WalrusSeal />;
  if (currentQuest === 'deepbook_grad') return <Quest8DeepBook />;
  return <QuestHub />;
}
