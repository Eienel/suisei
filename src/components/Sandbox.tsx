import { useEffect } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { World } from './World';
import { HUD } from './HUD';
import { Toolbar } from './Toolbar';
import { PromptBar } from './PromptBar';
import { NarrationOverlay } from './NarrationOverlay';
import { HowToModal } from './HowToModal';
import { useWorld } from '@/state/world';
import { useApp } from '@/state/app';
import { ArrowLeft } from 'lucide-react';

/**
 * Free-play mode — the full V1 builder. Clears any leftover blocks from
 * a previous lesson build on entry so the user starts fresh.
 */
export function Sandbox() {
  const setScreen = useApp((s) => s.setScreen);
  const clearWorld = useWorld((s) => s.clearWorld);

  useEffect(() => {
    clearWorld();
  }, [clearWorld]);

  return (
    <div className="fixed inset-0 bg-ink overflow-hidden">
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

      {/* Back button overlaid in the corner */}
      <button
        type="button"
        onClick={() => setScreen('lessons')}
        className="absolute top-3 left-1/2 -translate-x-1/2 z-30 glass rounded-full px-3 py-1.5 text-xs font-mono text-fg-mute hover:text-fg flex items-center gap-1.5"
      >
        <ArrowLeft size={12} />
        Back to lessons
      </button>

      <HowToModal />
    </div>
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
          BlockBuilders needs WebGL2 to render the world. Try a desktop browser
          (Chrome / Firefox) or hotspot via Wi-Fi.
        </p>
        <p className="text-[11px] font-mono text-fg-mute opacity-60">{message}</p>
      </div>
    </div>
  );
}
