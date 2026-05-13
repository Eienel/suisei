import { World } from './components/World';
import { HUD } from './components/HUD';
import { Toolbar } from './components/Toolbar';

export default function App() {
  return (
    <div className="fixed inset-0 bg-ink overflow-hidden">
      <World />
      <HUD />
      {/* Bottom-center floating toolbar */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
        <Toolbar />
      </div>
    </div>
  );
}
