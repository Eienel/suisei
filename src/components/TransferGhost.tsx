import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useWorld } from '@/state/world';
import { BLOCK_BY_ID } from '@/world/blockTypes';
import { getShapeGeometry } from '@/world/shapes';

/**
 * 3D ghost that follows the cursor while a completed defi building is
 * staged for placement in the sandbox. Renders the captured cells at the
 * hover position with a soft glow, so the player can see where the
 * Bank-and-its-staked-SUI is about to land.
 */
export function TransferGhost() {
  const pendingTransfer = useWorld((s) => s.pendingTransfer);
  const groupRef = useRef<THREE.Group>(null);

  // Pre-compute per-cell geometry + colour so we don't rebuild each frame.
  const items = useMemo(() => {
    if (!pendingTransfer) return [];
    return pendingTransfer.cells.map((c) => {
      const def = BLOCK_BY_ID[c.type];
      const shape = c.shape ?? def?.defaultShape ?? 'cube';
      return {
        offset: c.offset,
        geometry: getShapeGeometry(shape),
        color: new THREE.Color(c.color ?? def?.color ?? '#FACC15'),
      };
    });
  }, [pendingTransfer]);

  useFrame(() => {
    if (!groupRef.current) return;
    const hover = pendingTransfer?.hoverCell;
    groupRef.current.visible = !!hover;
    if (hover) groupRef.current.position.set(hover[0], hover[1], hover[2]);
  });

  if (!pendingTransfer) return null;

  return (
    <group ref={groupRef} visible={false}>
      {items.map((it, i) => (
        <mesh
          key={i}
          position={it.offset}
          geometry={it.geometry}
          raycast={() => undefined}
        >
          <meshStandardMaterial
            color={it.color}
            emissive={it.color}
            emissiveIntensity={0.6}
            transparent
            opacity={0.55}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}
