import type { BlockType } from '@/types';
import { BLOCK_BY_ID } from '@/world/blockTypes';

/**
 * Small geometric accent rendered above/on the cube body to reinforce
 * the block's identity. Keeps each type instantly readable.
 */
export function BlockAccent({ type }: { type: BlockType }) {
  const def = BLOCK_BY_ID[type];

  switch (type) {
    case 'wallet_keystone':
      // Short cylinder keystone
      return (
        <mesh position={[0, 0.56, 0]} castShadow>
          <cylinderGeometry args={[0.18, 0.22, 0.16, 24]} />
          <meshStandardMaterial
            color={def.color}
            metalness={0.7}
            roughness={0.3}
            emissive={def.color}
            emissiveIntensity={0.25}
          />
        </mesh>
      );

    case 'governance_marble':
      // Small fluted column
      return (
        <mesh position={[0, 0.58, 0]} castShadow>
          <cylinderGeometry args={[0.18, 0.2, 0.2, 16]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.45} metalness={0} />
        </mesh>
      );

    case 'security_bunker':
      // Four rivets near top corners
      return (
        <group position={[0, 0.46, 0]}>
          {[
            [-0.32, 0, -0.32],
            [0.32, 0, -0.32],
            [-0.32, 0, 0.32],
            [0.32, 0, 0.32],
          ].map(([x, y, z], i) => (
            <mesh key={i} position={[x, y, z]} castShadow>
              <sphereGeometry args={[0.06, 12, 12]} />
              <meshStandardMaterial color="#5B83FF" metalness={0.9} roughness={0.3} />
            </mesh>
          ))}
        </group>
      );

    case 'defi_vault':
      // Round vault face on +Z side
      return (
        <mesh position={[0, 0, 0.47]} rotation={[0, 0, 0]} castShadow>
          <cylinderGeometry args={[0.28, 0.28, 0.04, 28]} />
          <meshStandardMaterial
            color="#FFE066"
            metalness={1}
            roughness={0.2}
            emissive="#FF8A00"
            emissiveIntensity={0.18}
          />
        </mesh>
      );

    case 'token_prism':
      // Octahedron floating above
      return (
        <mesh position={[0, 0.6, 0]} castShadow>
          <octahedronGeometry args={[0.18, 0]} />
          <meshPhysicalMaterial
            color={def.color}
            emissive={def.color}
            emissiveIntensity={0.6}
            metalness={0.4}
            roughness={0.15}
            transmission={0.4}
            thickness={0.4}
            ior={1.7}
            clearcoat={1}
          />
        </mesh>
      );

    case 'contract_obelisk':
      // Thin cyan pillar
      return (
        <mesh position={[0, 0.55, 0]} castShadow>
          <boxGeometry args={[0.18, 0.32, 0.18]} />
          <meshStandardMaterial
            color="#0F2A3A"
            emissive={def.color}
            emissiveIntensity={0.7}
            metalness={0.4}
            roughness={0.3}
          />
        </mesh>
      );

    case 'oracle_lens':
      // Glassy sphere "eye"
      return (
        <mesh position={[0, 0.56, 0]} castShadow>
          <sphereGeometry args={[0.16, 24, 24]} />
          <meshPhysicalMaterial
            color={def.color}
            emissive={def.color}
            emissiveIntensity={0.7}
            metalness={0.1}
            roughness={0.05}
            transmission={0.7}
            thickness={0.3}
            ior={1.55}
            clearcoat={1}
          />
        </mesh>
      );

    case 'ai_neural':
      // Wireframe icosahedron — a neural node
      return (
        <mesh position={[0, 0.58, 0]}>
          <icosahedronGeometry args={[0.16, 1]} />
          <meshBasicMaterial color="#FFB7DA" wireframe transparent opacity={0.85} />
        </mesh>
      );

    default:
      return null;
  }
}
