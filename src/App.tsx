import { useApp } from '@/state/app';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Landing } from './components/Landing';
import { LessonsList } from './components/LessonsList';
import { LessonScreen } from './components/LessonScreen';
import { Sandbox } from './components/Sandbox';

export default function App() {
  const screen = useApp((s) => s.screen);

  return (
    <ErrorBoundary>
      {screen === 'landing' && <Landing />}
      {screen === 'lessons' && <LessonsList />}
      {screen === 'lesson' && <LessonScreen />}
      {screen === 'sandbox' && <Sandbox />}
    </ErrorBoundary>
  );
}
