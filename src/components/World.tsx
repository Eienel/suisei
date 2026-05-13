import { Canvas } from '@react-three/fiber';
import { OrbitControls, SoftShadows } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, SMAA } from '@react-three/postprocessing';
import { Suspense } from 'react';
import * as THREE from 'three';
import { useWorld } from '@/state/world';
import { Block } from './Block';
import { PlacementGrid } from './PlacementGrid';

/** Mobile heuristic — disable expensive features on phones to keep boot snappy. */
const isMobile =
  typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

export function World() {
  const blocks = useWorld((s) => s.blocks);
  const selectedBlockId = useWorld((s) => s.selectedBlockId);
  const setSelected = useWorld((s) => s.setSelected);

  return (
    <Canvas
      shadows={!isMobile}
      gl={{
        antialias: !isMobile,
        toneMapping: THREE.ACESFilmicToneMapping,
        outputColorSpace: THREE.SRGBColorSpace,
        powerPreference: 'default',
        failIfMajorPerformanceCaveat: false,
      }}
      camera={{ position: [10, 8, 10], fov: 45, near: 0.1, far: 200 }}
      dpr={isMobile ? [1, 1.5] : [1, 2]}
    >
      <color attach="background" args={['#070A14']} />
      <fog attach="fog" args={['#070A14', 28, 80]} />

      <Suspense fallback={null}>
        {!isMobile && <SoftShadows size={28} samples={10} focus={0.7} />}

        {/* Lighting rig — key + rim + soft ambient. No external HDR (CDN) so
            cold start works on flaky cellular. */}
        <ambientLight intensity={0.35} />
        <hemisphereLight args={['#5B83FF', '#0A0E1A', 0.5]} />
        <directionalLight
          position={[12, 18, 8]}
          intensity={1.2}
          castShadow={!isMobile}
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-30}
          shadow-camera-right={30}
          shadow-camera-top={30}
          shadow-camera-bottom={-30}
        />
        <directionalLight position={[-10, 6, -8]} intensity={0.45} color="#5B83FF" />

        <PlacementGrid />

        {blocks.map((b) => (
          <Block
            key={b.id}
            block={b}
            selected={b.id === selectedBlockId}
            onSelect={() => setSelected(b.id)}
          />
        ))}

        <OrbitControls
          enableDamping
          dampingFactor={0.08}
          minDistance={3}
          maxDistance={50}
          maxPolarAngle={Math.PI / 2 - 0.05}
          target={[0, 0, 0]}
          mouseButtons={{
            LEFT: undefined as unknown as THREE.MOUSE,
            MIDDLE: THREE.MOUSE.PAN,
            RIGHT: THREE.MOUSE.ROTATE,
          }}
        />

        <EffectComposer multisampling={0} enabled={!isMobile}>
          <SMAA />
          <Bloom mipmapBlur intensity={0.6} luminanceThreshold={0.6} luminanceSmoothing={0.4} />
          <Vignette eskil={false} offset={0.15} darkness={0.55} />
        </EffectComposer>
      </Suspense>
    </Canvas>
  );
}
