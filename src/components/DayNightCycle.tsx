import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { sky, advanceSky } from '@/world/sky';

const SUN_ORBIT_RADIUS = 22;
const SUN_HEIGHT = 18;

const COLOR_DAY_BG = new THREE.Color('#9DBBE5');     // muted daylight blue
const COLOR_NIGHT_BG = new THREE.Color('#070A14');   // ink night
const COLOR_FOG_DAY = new THREE.Color('#A8C2DD');
const COLOR_FOG_NIGHT = new THREE.Color('#070A14');
const COLOR_SUN_DAY = new THREE.Color('#FFE3B3');
const COLOR_SUN_NIGHT = new THREE.Color('#5B83FF');
const COLOR_AMBIENT_DAY = new THREE.Color('#FFFFFF');
const COLOR_AMBIENT_NIGHT = new THREE.Color('#3B4A78');

/**
 * Drives the day/night cycle: sun azimuth, key-light colour & intensity,
 * ambient/hemisphere mix, scene background, fog. Renders the directional
 * "sun" light itself so it can move smoothly.
 */
export function DayNightCycle({
  enabled = true,
}: {
  enabled?: boolean;
}) {
  const sunRef = useRef<THREE.DirectionalLight>(null);
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const hemiRef = useRef<THREE.HemisphereLight>(null);

  const { scene } = useThree();
  const tmp = new THREE.Color();

  useFrame((_state, dt) => {
    if (enabled) advanceSky(dt);

    const n = sky.nightFactor; // 0 day, 1 night
    const day = 1 - n;

    // Sun position rotates on a tilted orbit
    if (sunRef.current) {
      const a = sky.sunAngle;
      sunRef.current.position.set(
        Math.cos(a) * SUN_ORBIT_RADIUS,
        Math.sin(a) * SUN_HEIGHT,
        Math.sin(a + Math.PI / 4) * 8,
      );
      sunRef.current.intensity = 0.15 + day * 1.4;
      tmp.copy(COLOR_SUN_DAY).lerp(COLOR_SUN_NIGHT, n);
      sunRef.current.color.copy(tmp);
    }

    if (ambientRef.current) {
      ambientRef.current.intensity = 0.15 + day * 0.3;
      tmp.copy(COLOR_AMBIENT_DAY).lerp(COLOR_AMBIENT_NIGHT, n);
      ambientRef.current.color.copy(tmp);
    }

    if (hemiRef.current) {
      hemiRef.current.intensity = 0.25 + day * 0.6;
    }

    // Background + fog colour
    if (scene.background instanceof THREE.Color) {
      tmp.copy(COLOR_DAY_BG).lerp(COLOR_NIGHT_BG, n);
      scene.background.copy(tmp);
    }
    if (scene.fog instanceof THREE.Fog) {
      tmp.copy(COLOR_FOG_DAY).lerp(COLOR_FOG_NIGHT, n);
      scene.fog.color.copy(tmp);
    }
  });

  return (
    <>
      <ambientLight ref={ambientRef} intensity={0.35} />
      <hemisphereLight ref={hemiRef} args={['#9DC0FF', '#1B243F', 0.6]} />
      <directionalLight
        ref={sunRef}
        position={[12, 18, 8]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        shadow-bias={-0.0005}
      />
    </>
  );
}
