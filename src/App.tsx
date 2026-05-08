import { Landing } from './components/Landing';
import { GameShell } from './components/GameShell';
import { useApp } from './state/store';

export default function App() {
  const screen = useApp((s) => s.screen);
  return screen === 'landing' ? <Landing /> : <GameShell />;
}
