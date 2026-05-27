import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Suspense, useCallback } from 'react';
import * as THREE from 'three';
import { useWorld } from '@/state/world';
import type { Vec3 } from '@/types';
import { sfx } from '@/audio/sfx';
import { BlockInstances } from './BlockInstances';
import { PlacementGrid } from './PlacementGrid';
import { DayNightCycle } from './DayNightCycle';
import { BlueprintGhosts } from './BlueprintGhosts';

const isMobile =
  typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

export function World() {
  const blocks = useWorld((s) => s.blocks);
  const selectedBlockId = useWorld((s) => s.selectedBlockId);
  const tool = useWorld((s) => s.tool);
  const mode = useWorld((s) => s.mode);
  const activeBlockType = useWorld((s) => s.activeBlockType);
  const pendingPiece = useWorld((s) => s.pendingPiece);
  const setSelected = useWorld((s) => s.setSelected);
  const setHoveredCell = useWorld((s) => s.setHoveredCell);
  const setPieceHover = useWorld((s) => s.setPieceHover);
  const placeBlock = useWorld((s) => s.placeBlock);
  const commitPiece = useWorld((s) => s.commitPiece);

  // In lessons mode the only legal placement is committing an earned
  // piece — freeform clicks should NOT drop blocks on top of the
  // quiz-built town. This is enforced here and in PlacementGrid.
  const allowFreeformPlacement = mode !== 'lessons';

  const handleFaceHover = useCallback(
    (cell: Vec3) => {
      if (pendingPiece) setPieceHover(cell);
      else if (tool === 'place' && allowFreeformPlacement) setHoveredCell(cell);
    },
    [pendingPiece, tool, allowFreeformPlacement, setPieceHover, setHoveredCell]
  );

  const handleFaceClick = useCallback(
    (cell: Vec3, blockId: string) => {
      if (pendingPiece) {
        const placed = commitPiece(cell);
        if (placed && placed.length) {
          sfx.snap(cell[1]);
          sfx.sparkle();
        } else {
          sfx.error();
        }
        return;
      }
      if (tool === 'place' && allowFreeformPlacement) {
        const placed = placeBlock(activeBlockType, cell);
        if (placed) sfx.snap(cell[1]);
        return;
      }
      setSelected(blockId);
    },
    [pendingPiece, tool, allowFreeformPlacement, activeBlockType, commitPiece, placeBlock, setSelected]
  );

  return (
    <Canvas
      shadows={!isMobile}
      gl={{
        antialias: !isMobile,
        toneMapping: THREE.ACESFilmicToneMapping,
        outputColorSpace: THREE.SRGBColorSpace,
        powerPreference: 'default',
        failIfMajorPerformanceCaveat: false,
      }}
      camera={{ position: [12, 9, 14], fov: 45, near: 0.1, far: 220 }}
      dpr={isMobile ? [1, 1.5] : [1, 2]}
    >
      <color attach="background" args={['#9DBBE5']} />
      <fog attach="fog" args={['#A8C2DD', 32, 95]} />

      <Suspense fallback={null}>
        <DayNightCycle />

        <PlacementGrid />

        <BlueprintGhosts />

        <BlockInstances
          blocks={blocks}
          selectedBlockId={selectedBlockId}
          onFaceHover={handleFaceHover}
          onFaceClick={handleFaceClick}
        />

        <OrbitControls
          enableDamping
          dampingFactor={0.08}
          minDistance={3}
          maxDistance={60}
          maxPolarAngle={Math.PI / 2 - 0.05}
          target={[0, 1, 0]}
          mouseButtons={{
            LEFT: undefined as unknown as THREE.MOUSE,
            MIDDLE: THREE.MOUSE.PAN,
            RIGHT: THREE.MOUSE.ROTATE,
          }}
        />
      </Suspense>
    </Canvas>
  );
}
