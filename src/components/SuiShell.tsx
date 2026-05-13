import { SuiProviders } from '@/sui/providers';
import { useApp } from '@/state/app';
import { LessonsList } from './LessonsList';
import { LessonScreen } from './LessonScreen';
import { Sandbox } from './Sandbox';

/**
 * Single lazy boundary that pulls in SuiProviders + all Sui-using
 * screens. Imported via React.lazy from App.tsx so the Landing path
 * never touches @mysten/* code.
 */
export default function SuiShell() {
  const screen = useApp((s) => s.screen);
  return (
    <SuiProviders>
      {screen === 'lessons' && <LessonsList />}
      {screen === 'lesson' && <LessonScreen />}
      {screen === 'sandbox' && <Sandbox />}
    </SuiProviders>
  );
}
