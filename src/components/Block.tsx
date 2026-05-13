import { useEffect, useMemo, useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import type { Block as BlockData } from '@/types';
import { BlockMaterial, hasAccent, isAnimatedIdle } from './BlockMaterial';
import { BlockAccent } from './BlockAccent';

interface Props {
  block: BlockData;
  selected: boolean;
  onSelect: () => void;
}

/**
 * Single block. Carries:
 * - A material chosen per category (BlockMaterial)
 * - An optional small accent geometry (BlockAccent) for identity
 * - A placement spring (scale 0 → 1) on first mount
 * - A gentle idle pulse on emissive-heavy types
 * - A hover float + cyan wireframe outline when selected
 */
export function Block({ block, selected, onSelect }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Mesh>(null);
  const mountedAt = useMemo(() => performance.now(), []);
  const idleAnimated = isAnimatedIdle(block.type);

  // Smooth interpolated targets for selection state.
  const targetScale = useRef(1);
  const targetLift = useRef(0);

  useEffect(() => {
    targetScale.current = 1;
  }, []);

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
    targetLift.current = lift;

    groupRef.current.position.set(
      block.position[0],
      block.position[1] + targetLift.current + bob,
      block.position[2]
    );
    groupRef.current.scale.setScalar(placementScale);

    // --- Idle pulse: gently modulate emissive intensity ---
    if (idleAnimated && bodyRef.current) {
      const mat = bodyRef.current.material as THREE.MeshPhysicalMaterial;
      const base = selected ? 1.5 : 1;
      const pulse = 0.85 + Math.sin(t * 1.6 + block.position[0] * 1.7) * 0.15;
      // We can't read the original easily; instead, keep a per-frame factor.
      // Default emissiveIntensity from material is set on mount; we apply
      // a multiplicative factor here that hovers around the chosen base.
      mat.emissiveIntensity = (mat.userData.baseEmissive ?? 0.5) * pulse * base;
    }
  });

  const handleDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (e.button !== 0) return;
    onSelect();
  };

  return (
    <group ref={groupRef} rotation={block.rotation}>
      <mesh
        ref={bodyRef}
        castShadow
        receiveShadow
        onPointerDown={handleDown}
        onUpdate={(self) => {
          // Stash the initial emissiveIntensity so the idle pulse can ref it.
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

      {/* Selection outline */}
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
