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

export function GameShell() {
  const hostRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const setScreen = useApp((s) => s.setScreen);
  const addPlacedBrick = useApp((s) => s.addPlacedBrick);
  const movePlacedBrick = useApp((s) => s.movePlacedBrick);
  const removePlacedBrick = useApp((s) => s.removePlacedBrick);
  const placedBricks = useApp((s) => s.placedBricks);
  const unlockedLessons = useApp((s) => s.unlockedLessons);
  const resetBoard = useApp((s) => s.resetBoard);

  const { currentLessonId, queueLength, dismissCurrent } = useLessonUnlock();

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

  return (
    <div className="h-screen w-screen flex flex-col lg:flex-row bg-brand-cream font-display">
      <div className="flex-1 relative order-2 lg:order-1">
        <div
          ref={hostRef}
          className="absolute inset-0"
          style={{ touchAction: 'none' }}
        />
        <div className="absolute bottom-3 left-3 pointer-events-none">
          <span className="bg-brand-ink/85 text-white text-xs font-bold px-2.5 py-1.5 rounded-brick">
            right-click or long-press a brick to remove
          </span>
        </div>
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <button
            type="button"
            onClick={() => setScreen('landing')}
            className="pointer-events-auto bg-white text-brand-ink font-bold text-sm px-3 py-2 rounded-brick shadow-brick"
          >
            ← Home
          </button>
          <div className="pointer-events-auto flex items-center gap-2">
            <span className="bg-white text-brand-ink font-bold text-sm px-3 py-2 rounded-brick shadow-brick">
              Bricks: {placedBricks.length}
            </span>
            <button
              type="button"
              onClick={() => setPanelOpen(true)}
              className="bg-brand-blue text-white font-bold text-sm px-3 py-2 rounded-brick shadow-brick"
            >
              Lessons: {unlockedLessons.length} / {LESSONS.length}
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
