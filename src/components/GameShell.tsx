import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { createPhaserGame } from '@/game/PhaserGame';
import { bus } from '@/game/events';
import { useApp } from '@/state/store';
import { BrickPalette } from './BrickPalette';
import { LessonModal } from './LessonModal';
import { LessonsPanel } from './LessonsPanel';
import { LESSONS } from '@/data/lessons';
import { useLessonUnlock } from '@/lessons/useLessonUnlock';
import { sfx } from '@/audio/sfx';
import { BagsProvider } from '@/bags/BagsProvider';
import { useBags } from '@/bags/useBags';
import { WalletMultiButton as RawWalletMultiButton } from '@solana/wallet-adapter-react-ui';
import type { ComponentType } from 'react';

// Re-cast for React 18 type compatibility (adapter packages target React 19).
const WalletMultiButton = RawWalletMultiButton as unknown as ComponentType;

export function GameShell() {
  return (
    <BagsProvider>
      <GameShellInner />
    </BagsProvider>
  );
}

function GameShellInner() {
  const hostRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [muted, setMuted] = useState(sfx.isMuted());
  const [minting, setMinting] = useState(false);
  const [mintResult, setMintResult] = useState<string | null>(null);

  const setScreen = useApp((s) => s.setScreen);
  const addPlacedBrick = useApp((s) => s.addPlacedBrick);
  const movePlacedBrick = useApp((s) => s.movePlacedBrick);
  const removePlacedBrick = useApp((s) => s.removePlacedBrick);
  const placedBricks = useApp((s) => s.placedBricks);
  const unlockedLessons = useApp((s) => s.unlockedLessons);
  const resetBoard = useApp((s) => s.resetBoard);

  const { currentLessonId, queueLength, dismissCurrent } = useLessonUnlock();
  const { wallet, holdsToken, blockBalance, cosmetics, mintBadge } = useBags();

  // Broadcast active cosmetic to Phaser whenever entitlement changes.
  useEffect(() => {
    bus.emit('SET_COSMETIC', { skin: cosmetics[0] ?? null });
  }, [cosmetics]);

  useEffect(() => {
    if (!hostRef.current) return;
    gameRef.current = createPhaserGame(hostRef.current);

    const onPlaced = (b: { uid: string; type: string; gridX: number; gridY: number }) => {
      addPlacedBrick({
        uid: b.uid,
        type: b.type as never,
        gridX: b.gridX,
        gridY: b.gridY,
      });
    };
    const onMoved = (b: { uid: string; gridX: number; gridY: number }) => {
      movePlacedBrick(b.uid, b.gridX, b.gridY);
    };
    const onRemoved = ({ uid }: { uid: string }) => {
      removePlacedBrick(uid);
    };

    bus.on('BRICK_PLACED', onPlaced);
    bus.on('BRICK_MOVED', onMoved);
    bus.on('BRICK_REMOVED', onRemoved);

    return () => {
      bus.off('BRICK_PLACED', onPlaced);
      bus.off('BRICK_MOVED', onMoved);
      bus.off('BRICK_REMOVED', onRemoved);
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, [addPlacedBrick, movePlacedBrick, removePlacedBrick]);

  const handleReset = () => {
    bus.emit('RESET_BOARD');
    resetBoard();
  };

  const handleMint = async () => {
    setMinting(true);
    setMintResult(null);
    try {
      const res = await mintBadge();
      setMintResult(res ? `Minted! ${res.tx.slice(0, 8)}…` : 'Mint not yet wired (Sprint 4 final)');
    } catch (e) {
      setMintResult('Mint failed');
      console.error(e);
    } finally {
      setMinting(false);
    }
  };

  const allUnlocked =
    unlockedLessons.length === LESSONS.length && LESSONS.length > 0;

  return (
    <div className="h-screen w-screen flex flex-col lg:flex-row bg-brand-cream font-display">
      <div className="flex-1 relative order-2 lg:order-1">
        <div
          ref={hostRef}
          className="absolute inset-0"
          style={{ touchAction: 'none' }}
        />
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2 pointer-events-none">
          <span className="bg-brand-ink/85 text-white text-xs font-bold px-2.5 py-1.5 rounded-brick">
            right-click or long-press a brick to remove
          </span>
          {allUnlocked && (
            <div className="pointer-events-auto flex flex-col items-end gap-1">
              {mintResult && (
                <span className="bg-white text-brand-ink text-xs font-bold px-2.5 py-1.5 rounded-brick shadow-brick">
                  {mintResult}
                </span>
              )}
              <button
                type="button"
                onClick={handleMint}
                disabled={!wallet || minting}
                className="bg-brand-yellow text-brand-ink font-extrabold text-sm px-4 py-2.5 rounded-brick shadow-brick-lg disabled:opacity-60"
              >
                {minting
                  ? 'Minting…'
                  : wallet
                    ? 'Mint $BLOCK Builder Badge'
                    : 'Connect wallet to mint'}
              </button>
            </div>
          )}
        </div>
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <button
            type="button"
            onClick={() => setScreen('landing')}
            className="pointer-events-auto bg-white text-brand-ink font-bold text-sm px-3 py-2 rounded-brick shadow-brick"
          >
            ← Home
          </button>
          <div className="pointer-events-auto flex items-center gap-2 flex-wrap justify-end">
            <span className="hidden sm:inline-flex bg-white text-brand-ink font-bold text-sm px-3 py-2 rounded-brick shadow-brick">
              Bricks: {placedBricks.length}
            </span>
            <button
              type="button"
              onClick={() => setPanelOpen(true)}
              className="bg-brand-blue text-white font-bold text-sm px-3 py-2 rounded-brick shadow-brick"
            >
              Lessons: {unlockedLessons.length} / {LESSONS.length}
            </button>
            {holdsToken && (
              <span
                className="font-extrabold text-xs px-2.5 py-1.5 rounded-full"
                style={{ backgroundColor: '#FFD700', color: '#1A1F2E' }}
                title={`$BLOCK balance: ${blockBalance}`}
              >
                ★ HOLDER
              </span>
            )}
            <div className="bb-wallet">
              <WalletMultiButton />
            </div>
            <button
              type="button"
              aria-label={muted ? 'Unmute' : 'Mute'}
              onClick={() => {
                const next = !muted;
                sfx.setMuted(next);
                setMuted(next);
              }}
              className="bg-white text-brand-ink font-bold text-sm px-3 py-2 rounded-brick shadow-brick"
            >
              {muted ? 'Sound: Off' : 'Sound: On'}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="bg-brand-yellow text-brand-ink font-bold text-sm px-3 py-2 rounded-brick shadow-brick"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
      <div className="order-1 lg:order-2">
        <BrickPalette />
      </div>
      <LessonsPanel open={panelOpen} onClose={() => setPanelOpen(false)} />
      <LessonModal
        lessonId={currentLessonId}
        queueLength={queueLength}
        onClose={dismissCurrent}
      />
    </div>
  );
}
