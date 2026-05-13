import * as THREE from 'three';
import { useMemo } from 'react';
import { useWorld } from '@/state/world';
import { PIECES, resolveCells } from '@/world/pieces';
import { BLOCK_BY_ID } from '@/world/blockTypes';
import { inBounds, positionKey } from '@/world/grid';

/**
 * Ghost preview of the pending Tetris-style piece, drawn at the hovered
 * cell. Translucent + emissive in green/red depending on whether the
 * placement is valid (all cells in-bounds and unoccupied).
 */
export function PieceGhost() {
  const pending = useWorld((s) => s.pendingPiece);
  const blocks = useWorld((s) => s.blocks);

  // Pre-compute occupancy so validation doesn't re-scan blocks each frame.
  const occupied = useMemo(() => {
    return new Set(blocks.map((b) => positionKey(b.position)));
  }, [blocks]);

  if (!pending || !pending.hoverCell) return null;
  const piece = PIECES[pending.pieceKey];
  if (!piece) return null;

  const cells = resolveCells(piece, pending.rotation);
  const anchor = pending.hoverCell;

  // Validate every cell
  let valid = true;
  const cellPositions: [number, number, number][] = [];
  for (const [dx, dz] of cells) {
    const pos: [number, number, number] = [anchor[0] + dx, 0, anchor[2] + dz];
    cellPositions.push(pos);
    if (!inBounds(pos) || occupied.has(positionKey(pos))) {
      valid = false;
    }
  }

  const def = BLOCK_BY_ID[pending.type];
  const baseColor = new THREE.Color(def.color);
  const tintColor = new THREE.Color(valid ? '#22c55e' : '#ef4444');
  const renderColor = baseColor.clone().lerp(tintColor, valid ? 0.25 : 0.55);

  return (
    <group>
      {cellPositions.map((pos, i) => (
        <group key={i} position={pos}>
          <mesh>
            <boxGeometry args={[0.94, 0.94, 0.94]} />
            <meshStandardMaterial
              color={renderColor}
              emissive={renderColor}
              emissiveIntensity={0.6}
              transparent
              opacity={valid ? 0.45 : 0.55}
            />
          </mesh>
          {/* Wireframe edges so the cell boundary is readable */}
          <lineSegments>
            <edgesGeometry args={[new THREE.BoxGeometry(0.96, 0.96, 0.96)]} />
            <lineBasicMaterial color={valid ? '#22c55e' : '#ef4444'} />
          </lineSegments>
        </group>
      ))}
    </group>
  );
}
