import { useRef } from 'react';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useWorld } from '@/state/world';
import { snapToGrid, WORLD_HALF_EXTENT } from '@/world/grid';
import { BLOCK_BY_ID } from '@/world/blockTypes';
import { sfx } from '@/audio/sfx';

const GRID_SIZE = WORLD_HALF_EXTENT * 2;

/**
 * Invisible plane the user clicks on to place blocks. Also renders the
 * ghost preview of the block-about-to-be-placed at the hovered cell.
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
  const { gl } = useThree();

  const def = BLOCK_BY_ID[activeBlockType];
  const ghostColor = new THREE.Color(def.color);

  useFrame(() => {
    if (!ghostRef.current) return;
    ghostRef.current.visible = !!hoveredCell && tool === 'place';
    if (hoveredCell) {
      ghostRef.current.position.set(hoveredCell[0], hoveredCell[1], hoveredCell[2]);
    }
  });

  const handleMove = (e: ThreeEvent<PointerEvent>) => {
    if (tool !== 'place') return;
    const p = e.point;
    const cell = snapToGrid([p.x, 0, p.z]);
    setHoveredCell(cell);
    gl.domElement.style.cursor = 'crosshair';
  };

  const handleLeave = () => {
    setHoveredCell(null);
    gl.domElement.style.cursor = '';
  };

  const handleDown = (e: ThreeEvent<PointerEvent>) => {
    if (e.button !== 0) return;
    if (tool !== 'place') {
      // Clicking empty space deselects.
      setSelected(null);
      return;
    }
    const p = e.point;
    const cell = snapToGrid([p.x, 0, p.z]);
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
        <meshStandardMaterial
          color="#0F1422"
          roughness={0.95}
          metalness={0.05}
        />
      </mesh>

      {/* Grid overlay so users can see cells without it overpowering the world. */}
      <gridHelper
        args={[GRID_SIZE, GRID_SIZE, '#1F2638', '#161B2A']}
        position={[0, -0.499, 0]}
      />

      {/* Ghost preview of the next block at the hovered cell. */}
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
    </>
  );
}
