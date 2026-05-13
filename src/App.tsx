import { World } from './components/World';
import { HUD } from './components/HUD';
import { Toolbar } from './components/Toolbar';
import { PromptBar } from './components/PromptBar';
import { NarrationOverlay } from './components/NarrationOverlay';
import { HowToModal } from './components/HowToModal';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <div className="fixed inset-0 bg-ink overflow-hidden">
        {/* 3D world is isolated — if WebGL fails the rest of the UI still works */}
        <ErrorBoundary
          fallback={(err) => <WorldFallback message={err.message} />}
        >
          <World />
        </ErrorBoundary>

        <HUD />
        <NarrationOverlay />

        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex flex-col items-center gap-2">
          <Toolbar />
          <PromptBar />
        </div>

        <HowToModal />
      </div>
    </ErrorBoundary>
  );
}

function WorldFallback({ message }: { message: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
      <div className="max-w-md">
        <p className="font-mono text-xs uppercase tracking-widest text-accent-magenta mb-2">
          3D scene unavailable
        </p>
        <h2 className="text-xl font-semibold text-fg mb-2">Your browser blocked WebGL</h2>
        <p className="text-sm text-fg-mute leading-relaxed mb-3">
          BlockBuilders needs WebGL2 to render the world. Mobile Safari sometimes
          disables it on low battery / cellular. Try a desktop browser
          (Chrome / Firefox) or hotspot via Wi-Fi.
        </p>
        <p className="text-[11px] font-mono text-fg-mute opacity-60">{message}</p>
      </div>
    </div>
  );
}
