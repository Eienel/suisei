import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { TargetBlock } from '@/data/lessons';
import { BLOCK_BY_ID } from '@/world/blockTypes';

/**
 * Small wireframe 3D preview of the lesson's target structure. Lives
 * alongside the build canvas as a "what to build" reference.
 */
export function BlueprintPreview({ target }: { target: readonly TargetBlock[] }) {
  // Camera framing — center on the target's bounding-box center
  const center = computeCenter(target);

  return (
    <Canvas
      camera={{
        position: [center[0] + 4, center[1] + 3, center[2] + 4],
        fov: 40,
        near: 0.1,
        far: 50,
      }}
      gl={{
        antialias: true,
        powerPreference: 'default',
        failIfMajorPerformanceCaveat: false,
      }}
      dpr={[1, 1.5]}
    >
      <color attach="background" args={['#0A0E1A']} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[4, 6, 4]} intensity={0.8} />

      {target.map((b, i) => {
        const def = BLOCK_BY_ID[b.type];
        return (
          <group key={i} position={b.position}>
            {/* Solid faded body */}
            <mesh>
              <boxGeometry args={[0.92, 0.92, 0.92]} />
              <meshStandardMaterial
                color={def.color}
                emissive={def.color}
                emissiveIntensity={0.35}
                transparent
                opacity={0.18}
              />
            </mesh>
            {/* Wireframe edges */}
            <lineSegments>
              <edgesGeometry args={[new THREE.BoxGeometry(0.94, 0.94, 0.94)]} />
              <lineBasicMaterial color={def.color} />
            </lineSegments>
          </group>
        );
      })}

      <gridHelper args={[10, 10, '#1F2638', '#161B2A']} position={[0, -0.5, 0]} />

      <OrbitControls
        enableDamping
        dampingFactor={0.1}
        autoRotate
        autoRotateSpeed={0.6}
        minDistance={3}
        maxDistance={15}
        target={center}
        enablePan={false}
      />
    </Canvas>
  );
}

function computeCenter(target: readonly TargetBlock[]): [number, number, number] {
  if (target.length === 0) return [0, 0, 0];
  let sx = 0;
  let sy = 0;
  let sz = 0;
  for (const t of target) {
    sx += t.position[0];
    sy += t.position[1];
    sz += t.position[2];
  }
  return [sx / target.length, sy / target.length, sz / target.length];
}
