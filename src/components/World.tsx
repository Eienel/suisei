import { Canvas } from '@react-three/fiber';
import { OrbitControls, SoftShadows } from '@react-three/drei';
import { Suspense, useCallback } from 'react';
import * as THREE from 'three';
import { useWorld } from '@/state/world';
import type { Vec3 } from '@/types';
import { sfx } from '@/audio/sfx';
import { Block } from './Block';
import { PlacementGrid } from './PlacementGrid';

/* Postprocessing (Bloom/Vignette/SMAA) is intentionally disabled — the
   library hit a temporal-dead-zone error in production minification
   that crashed the entire app at module load. */

/** Mobile heuristic — disable expensive features on phones to keep boot snappy. */
const isMobile =
  typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

export function World() {
  const blocks = useWorld((s) => s.blocks);
  const selectedBlockId = useWorld((s) => s.selectedBlockId);
  const tool = useWorld((s) => s.tool);
  const activeBlockType = useWorld((s) => s.activeBlockType);
  const pendingPiece = useWorld((s) => s.pendingPiece);
  const setSelected = useWorld((s) => s.setSelected);
  const setHoveredCell = useWorld((s) => s.setHoveredCell);
  const setPieceHover = useWorld((s) => s.setPieceHover);
  const placeBlock = useWorld((s) => s.placeBlock);
  const commitPiece = useWorld((s) => s.commitPiece);

  // Pointer hovering a block's face → preview placement in the adjacent cell.
  const handleFaceHover = useCallback(
    (cell: Vec3) => {
      if (pendingPiece) setPieceHover(cell);
      else if (tool === 'place') setHoveredCell(cell);
    },
    [pendingPiece, tool, setPieceHover, setHoveredCell]
  );

  // Pointer clicking a block's face → place there (stacking), or select it.
  const handleFaceClick = useCallback(
    (cell: Vec3, blockId: string) => {
      if (pendingPiece) {
        const placed = commitPiece(cell);
        if (placed && placed.length) {
          sfx.thud();
          sfx.sparkle();
        } else {
          sfx.error();
        }
        return;
      }
      if (tool === 'place') {
        const placed = placeBlock(activeBlockType, cell);
        if (placed) sfx.thud();
        return;
      }
      // select tool — pick the block that was clicked
      setSelected(blockId);
    },
    [pendingPiece, tool, activeBlockType, commitPiece, placeBlock, setSelected]
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
      camera={{ position: [10, 8, 10], fov: 45, near: 0.1, far: 200 }}
      dpr={isMobile ? [1, 1.5] : [1, 2]}
    >
      <color attach="background" args={['#070A14']} />
      <fog attach="fog" args={['#070A14', 28, 80]} />

      <Suspense fallback={null}>
        {!isMobile && <SoftShadows size={28} samples={10} focus={0.7} />}

        <ambientLight intensity={0.35} />
        <hemisphereLight args={['#5B83FF', '#0A0E1A', 0.5]} />
        <directionalLight
          position={[12, 18, 8]}
          intensity={1.2}
          castShadow={!isMobile}
          shadow-mapSize={isMobile ? [1024, 1024] : [2048, 2048]}
          shadow-camera-left={-30}
          shadow-camera-right={30}
          shadow-camera-top={30}
          shadow-camera-bottom={-30}
        />
        <directionalLight position={[-10, 6, -8]} intensity={0.45} color="#5B83FF" />

        <PlacementGrid />

        {blocks.map((b) => (
          <Block
            key={b.id}
            block={b}
            selected={b.id === selectedBlockId}
            onSelect={() => setSelected(b.id)}
            onFaceHover={handleFaceHover}
            onFaceClick={handleFaceClick}
          />
        ))}

        <OrbitControls
          enableDamping
          dampingFactor={0.08}
          minDistance={3}
          maxDistance={50}
          maxPolarAngle={Math.PI / 2 - 0.05}
          target={[0, 0, 0]}
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
