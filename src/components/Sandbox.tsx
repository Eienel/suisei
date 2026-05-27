import { useEffect } from 'react';
import { Landmark, X } from 'lucide-react';
import { ErrorBoundary } from './ErrorBoundary';
import { World } from './World';
import { HUD } from './HUD';
import { Toolbar } from './Toolbar';
import { PromptBar } from './PromptBar';
import { NarrationOverlay } from './NarrationOverlay';
import { HowToModal } from './HowToModal';
import { TownValueBadge } from './TownValueBadge';
import { useWorld } from '@/state/world';
import { music } from '@/audio/music';

/**
 * Free-play mode. The Sandbox works on its OWN persistent world —
 * separate from the lesson-built town, anyone-visitable, the "land"
 * a player actually keeps.
 */
export function Sandbox() {
  const setMode = useWorld((s) => s.setMode);
  const pendingTransfer = useWorld((s) => s.pendingTransfer);
  const cancelTransfer = useWorld((s) => s.cancelTransfer);

  useEffect(() => {
    setMode('sandbox');
  }, [setMode]);

  // Ambient music: kick in whenever the sandbox mounts, stop on unmount.
  // The music module respects its persisted-mute flag and a one-shot
  // user-gesture fallback if the browser blocked autoplay.
  useEffect(() => {
    music.start();
    return () => {
      music.stop();
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-ink overflow-hidden">
      <ErrorBoundary
        fallback={(err) => <WorldFallback message={err.message} />}
      >
        <World />
      </ErrorBoundary>

      <HUD />
      <NarrationOverlay />

      {/* Town-value pill — bottom-left so it stays out of the HUD chrome. */}
      <div className="absolute bottom-3 sm:bottom-5 left-3 z-20 pointer-events-auto">
        <TownValueBadge />
      </div>

      <div className="absolute bottom-3 sm:bottom-5 left-14 right-3 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-20 pointer-events-none flex flex-col items-center gap-2 sm:w-auto">
        <Toolbar />
        <PromptBar />
      </div>

      {pendingTransfer && (
        <div className="absolute top-16 sm:top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
          <div className="glass rounded-full px-4 py-2 shadow-glass flex items-center gap-3 animate-rise-in">
            <Landmark size={14} className="text-accent-cyan" />
            <span className="text-sm font-medium text-fg">
              Pick a spot for your Bank
            </span>
            <span className="text-[11px] font-mono text-fg-mute hidden sm:inline">
              click ground · <span className="kbd">Esc</span> cancel
            </span>
            <button
              type="button"
              onClick={cancelTransfer}
              aria-label="Cancel placement"
              className="ml-1 w-6 h-6 rounded-full text-fg-mute hover:text-fg hover:bg-ink-line/60 flex items-center justify-center transition-colors"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      )}

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
