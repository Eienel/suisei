import { useEffect, useRef } from 'react';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useWorld } from '@/state/world';
import { snapToGrid, WORLD_HALF_EXTENT } from '@/world/grid';
import { BLOCK_BY_ID } from '@/world/blockTypes';
import { sfx } from '@/audio/sfx';
import { PieceGhost } from './PieceGhost';

const GRID_SIZE = WORLD_HALF_EXTENT * 2;

/**
 * Floor plane the player clicks on. Three behaviours:
 *   - pendingPiece set → click commits the piece at the hovered cell
 *   - tool === 'place' → click drops a single block at the hovered cell
 *   - tool === 'select' → click empty space deselects
 */
export function PlacementGrid() {
  const planeRef = useRef<THREE.Mesh>(null);
  const ghostRef = useRef<THREE.Mesh>(null);

  const tool = useWorld((s) => s.tool);
  const activeBlockType = useWorld((s) => s.activeBlockType);
  const hoveredCell = useWorld((s) => s.hoveredCell);
  const setHoveredCell = useWorld((s) => s.setHoveredCell);
  const placeBlock = useWorld((s) => s.placeBlock);
  const setSelected = useWorld((s) => s.setSelected);

  const pendingPiece = useWorld((s) => s.pendingPiece);
  const setPieceHover = useWorld((s) => s.setPieceHover);
  const rotatePiece = useWorld((s) => s.rotatePiece);
  const cancelPiece = useWorld((s) => s.cancelPiece);
  const commitPiece = useWorld((s) => s.commitPiece);

  const { gl } = useThree();

  const def = BLOCK_BY_ID[activeBlockType];
  const ghostColor = new THREE.Color(def.color);

  // Hotkeys for piece placement: R rotate, Esc cancel
  useEffect(() => {
    if (!pendingPiece) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        rotatePiece();
      } else if (e.key === 'Escape') {
        cancelPiece();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pendingPiece, rotatePiece, cancelPiece]);

  useFrame(() => {
    if (!ghostRef.current) return;
    const showSingle =
      !!hoveredCell && tool === 'place' && !pendingPiece;
    ghostRef.current.visible = showSingle;
    if (hoveredCell) {
      ghostRef.current.position.set(hoveredCell[0], hoveredCell[1], hoveredCell[2]);
    }
  });

  const handleMove = (e: ThreeEvent<PointerEvent>) => {
    const p = e.point;
    const cell = snapToGrid([p.x, 0, p.z]);
    if (pendingPiece) {
      setPieceHover(cell);
      gl.domElement.style.cursor = 'pointer';
      return;
    }
    if (tool !== 'place') return;
    setHoveredCell(cell);
    gl.domElement.style.cursor = 'crosshair';
  };

  const handleLeave = () => {
    if (pendingPiece) {
      setPieceHover(null);
    } else {
      setHoveredCell(null);
    }
    gl.domElement.style.cursor = '';
  };

  const handleDown = (e: ThreeEvent<PointerEvent>) => {
    if (e.button !== 0) return;
    const p = e.point;
    const cell = snapToGrid([p.x, 0, p.z]);

    if (pendingPiece) {
      const placed = commitPiece(cell);
      if (placed && placed.length > 0) {
        sfx.thud();
        // Brief sparkle on commit
        sfx.sparkle();
      } else {
        sfx.error();
      }
      return;
    }

    if (tool !== 'place') {
      setSelected(null);
      return;
    }
    const placed = placeBlock(activeBlockType, cell);
    if (placed) sfx.thud();
  };

  return (
    <>
      {/* The big raycast plane (floor). */}
      <mesh
        ref={planeRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.5, 0]}
        receiveShadow
        onPointerMove={handleMove}
        onPointerLeave={handleLeave}
        onPointerDown={handleDown}
      >
        <planeGeometry args={[GRID_SIZE, GRID_SIZE]} />
        <meshStandardMaterial color="#0F1422" roughness={0.95} metalness={0.05} />
      </mesh>

      <gridHelper
        args={[GRID_SIZE, GRID_SIZE, '#1F2638', '#161B2A']}
        position={[0, -0.499, 0]}
      />

      {/* Single-block ghost (free-build mode) */}
      <mesh ref={ghostRef} visible={false}>
        <boxGeometry args={[0.92, 0.92, 0.92]} />
        <meshStandardMaterial
          color={ghostColor}
          emissive={ghostColor}
          emissiveIntensity={0.5}
          transparent
          opacity={0.35}
        />
      </mesh>

      {/* Piece ghost (lesson placement mode) */}
      <PieceGhost />
    </>
  );
}
