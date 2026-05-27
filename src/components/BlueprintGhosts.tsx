import { useMemo } from 'react';
import * as THREE from 'three';
import { useWorld } from '@/state/world';
import { BUILDINGS, evaluateAll, type BlueprintCell } from '@/defi/buildings';
import { BLOCK_BY_ID } from '@/world/blockTypes';
import { getShapeGeometry } from '@/world/shapes';

/**
 * Semi-transparent ghost meshes that hint where each blueprint's missing
 * cells should go. Filled cells render nothing (the real placed block is
 * already there). Only mounts when world mode === 'defi'.
 */
export function BlueprintGhosts() {
  const mode = useWorld((s) => s.mode);
  const blocks = useWorld((s) => s.blocks);

  // Compute missing cells per building, cheap O(N) scan.
  const progress = useMemo(() => evaluateAll(blocks), [blocks]);

  if (mode !== 'defi') return null;

  return (
    <group>
      {BUILDINGS.map((b) => {
        const { missing, complete } = progress[b.id];
        if (complete) return null; // nothing left to hint
        return (
          <group key={b.id} position={b.anchor}>
            {missing.map((cell, i) => (
              <CellGhost key={i} cell={cell} disabled={!b.enabled} />
            ))}
          </group>
        );
      })}
    </group>
  );
}

function CellGhost({ cell, disabled }: { cell: BlueprintCell; disabled: boolean }) {
  // Use the first accepted type as the visual exemplar.
  const def = BLOCK_BY_ID[cell.accepts[0]];
  const shape = def?.defaultShape ?? 'cube';
  const geometry = useMemo(() => getShapeGeometry(shape), [shape]);
  const color = useMemo(
    () => new THREE.Color(disabled ? '#5C6677' : (def?.color ?? '#FACC15')),
    [def?.color, disabled],
  );
  return (
    <mesh
      position={cell.offset}
      geometry={geometry}
      raycast={() => undefined} // never block clicks on the ground
    >
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.45}
        transparent
        opacity={disabled ? 0.18 : 0.32}
        depthWrite={false}
      />
    </mesh>
  );
}
