import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Block as BlockData } from '@/types';
import { BLOCK_BY_ID } from '@/world/blockTypes';

interface Props {
  block: BlockData;
  selected: boolean;
  onPointerDown: (e: THREE.Event) => void;
}

/**
 * Single block renderer. Phase 1 = uniform geometry per type colored by
 * the block def. Phase 2 will swap in distinct materials per category
 * (crystal, marble, neural, etc.) and use instanced meshes for perf.
 */
export function Block({ block, selected, onPointerDown }: Props) {
  const meshRef = useRef<THREE.Mesh>(null);
  const def = BLOCK_BY_ID[block.type];
  const color = new THREE.Color(def.color);

  // Gentle idle hover on selected blocks.
  useFrame((state) => {
    if (!meshRef.current) return;
    if (selected) {
      const t = state.clock.elapsedTime;
      meshRef.current.position.y = block.position[1] + Math.sin(t * 2) * 0.04;
    } else {
      meshRef.current.position.y = block.position[1];
    }
  });

  return (
    <group
      position={block.position}
      rotation={block.rotation}
      onPointerDown={(e) => {
        e.stopPropagation();
        onPointerDown(e as unknown as THREE.Event);
      }}
    >
      <mesh ref={meshRef} castShadow receiveShadow>
        <boxGeometry args={[0.92, 0.92, 0.92]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={selected ? 0.45 : 0.18}
          metalness={0.35}
          roughness={0.35}
        />
      </mesh>
      {/* Selection outline */}
      {selected && (
        <mesh>
          <boxGeometry args={[1.02, 1.02, 1.02]} />
          <meshBasicMaterial color="#00E5FF" wireframe />
        </mesh>
      )}
    </group>
  );
}
