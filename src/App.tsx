import { World } from './components/World';
import { HUD } from './components/HUD';
import { Toolbar } from './components/Toolbar';
import { PromptBar } from './components/PromptBar';
import { NarrationOverlay } from './components/NarrationOverlay';

export default function App() {
  return (
    <div className="fixed inset-0 bg-ink overflow-hidden">
      <World />
      <HUD />
      <NarrationOverlay />

      {/* Bottom-center floating stack: prompt + block toolbar */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex flex-col items-center gap-2">
        <Toolbar />
        <PromptBar />
      </div>
    </div>
  );
}
