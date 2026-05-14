import { useMemo, useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import type { Block as BlockData, Vec3 } from '@/types';
import { BlockMaterial, hasAccent, isAnimatedIdle } from './BlockMaterial';
import { BlockAccent } from './BlockAccent';

interface Props {
  block: BlockData;
  selected: boolean;
  onSelect: () => void;
  /**
   * Placement raycasting (optional — omitted by the read-only VisitPage).
   * onFaceHover/onFaceClick report the cell ADJACENT to the face the
   * pointer is over, enabling Minecraft-style stacking.
   */
  onFaceHover?: (cell: Vec3) => void;
  onFaceClick?: (cell: Vec3, blockId: string) => void;
}

/**
 * Single block. Carries:
 * - A material chosen per category (BlockMaterial)
 * - An optional small accent geometry (BlockAccent) for identity
 * - A placement spring (scale 0 → 1) on first mount
 * - A gentle idle pulse on emissive-heavy types
 * - A hover float + cyan wireframe outline when selected
 * - Face-aware placement raycasting so blocks can be stacked
 */
export function Block({ block, selected, onSelect, onFaceHover, onFaceClick }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Mesh>(null);
  const mountedAt = useMemo(() => performance.now(), []);
  const idleAnimated = isAnimatedIdle(block.type);

  useFrame((state) => {
    if (!groupRef.current) return;

    // --- Placement spring: scale-in over 320ms with overshoot ---
    const elapsed = performance.now() - mountedAt;
    const placeT = Math.min(elapsed / 320, 1);
    const eased = easeOutBack(placeT);
    const placementScale = 0.001 + eased * 0.999;

    // --- Selection: subtle bob + slight up-lift ---
    const t = state.clock.elapsedTime;
    const bob = selected ? Math.sin(t * 2.4) * 0.04 : 0;
    const lift = selected ? 0.05 : 0;

    groupRef.current.position.set(
      block.position[0],
      block.position[1] + lift + bob,
      block.position[2]
    );
    groupRef.current.scale.setScalar(placementScale);

    // --- Idle pulse: gently modulate emissive intensity ---
    if (idleAnimated && bodyRef.current) {
      const mat = bodyRef.current.material as THREE.MeshPhysicalMaterial;
      const base = selected ? 1.5 : 1;
      const pulse = 0.85 + Math.sin(t * 1.6 + block.position[0] * 1.7) * 0.15;
      mat.emissiveIntensity = (mat.userData.baseEmissive ?? 0.5) * pulse * base;
    }
  });

  /** Which cell does the pointer's hit-face point into? (block cell + face normal) */
  const cellFromHit = (e: ThreeEvent<PointerEvent>): Vec3 => {
    const [bx, by, bz] = block.position;
    const lx = e.point.x - bx;
    const ly = e.point.y - by;
    const lz = e.point.z - bz;
    const ax = Math.abs(lx);
    const ay = Math.abs(ly);
    const az = Math.abs(lz);
    if (ax >= ay && ax >= az) return [bx + (Math.sign(lx) || 1), by, bz];
    if (ay >= ax && ay >= az) return [bx, by + (Math.sign(ly) || 1), bz];
    return [bx, by, bz + (Math.sign(lz) || 1)];
  };

  const handleMove = (e: ThreeEvent<PointerEvent>) => {
    if (!onFaceHover) return;
    e.stopPropagation();
    onFaceHover(cellFromHit(e));
  };

  const handleDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (e.button !== 0) return;
    if (onFaceClick) {
      onFaceClick(cellFromHit(e), block.id);
    } else {
      onSelect();
    }
  };

  return (
    <group ref={groupRef} rotation={block.rotation}>
      <mesh
        ref={bodyRef}
        castShadow
        receiveShadow
        onPointerMove={handleMove}
        onPointerDown={handleDown}
        onUpdate={(self) => {
          const m = self.material as THREE.MeshPhysicalMaterial;
          if (m.userData.baseEmissive === undefined) {
            m.userData.baseEmissive = m.emissiveIntensity;
          }
        }}
      >
        <boxGeometry args={[0.92, 0.92, 0.92]} />
        <BlockMaterial type={block.type} selected={selected} />
      </mesh>

      {hasAccent(block.type) && <BlockAccent type={block.type} />}

      {selected && (
        <mesh>
          <boxGeometry args={[1.04, 1.04, 1.04]} />
          <meshBasicMaterial color="#00E5FF" wireframe transparent opacity={0.55} />
        </mesh>
      )}
    </group>
  );
}

function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}
