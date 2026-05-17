import { useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { Tour } from '@/agent/runTour';

const STOP_HOLD_MS = 5500;
const STOP_EASE_MS = 1800;

/**
 * Animates the orbiting camera through a sequence of tour stops.
 * Lerps both camera position and lookAt target between stops, holds
 * for STOP_HOLD_MS, then advances. Calls onAdvance with the stop
 * index so the parent can render the narration overlay.
 */
export function TourPlayer({
  tour,
  onAdvance,
  onComplete,
}: {
  tour: Tour;
  onAdvance: (stopIndex: number) => void;
  onComplete: () => void;
}) {
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3(0, 1, 0));
  const [stopIdx, setStopIdx] = useState(0);

  // Per-segment animation state. We store start/end vectors and a
  // clock-relative start time, then lerp inside useFrame.
  const seg = useRef<{
    startPos: THREE.Vector3;
    endPos: THREE.Vector3;
    startTarget: THREE.Vector3;
    endTarget: THREE.Vector3;
    startMs: number;
  } | null>(null);

  // Kick off the first segment on mount + whenever stopIdx advances.
  useEffect(() => {
    const stop = tour.stops[stopIdx];
    if (!stop) return;
    // Safety clamp: keep the camera above the floor and at a sane
    // distance. The model picks freely; an underground or absurdly-far
    // camera makes the tour look broken.
    const camY = Math.max(2, Math.min(stop.camera[1], 30));
    const camX = Math.max(-40, Math.min(stop.camera[0], 40));
    const camZ = Math.max(-40, Math.min(stop.camera[2], 40));
    const lookY = Math.max(0, Math.min(stop.lookAt[1], 20));
    seg.current = {
      startPos: camera.position.clone(),
      endPos: new THREE.Vector3(camX, camY, camZ),
      startTarget: target.current.clone(),
      endTarget: new THREE.Vector3(stop.lookAt[0], lookY, stop.lookAt[2]),
      startMs: performance.now(),
    };
    onAdvance(stopIdx);
  }, [stopIdx, tour.stops, camera, onAdvance]);

  // Schedule the advance to the next stop.
  useEffect(() => {
    const total = tour.stops.length;
    const isLast = stopIdx === total - 1;
    const t = setTimeout(
      () => {
        if (isLast) onComplete();
        else setStopIdx((i) => i + 1);
      },
      STOP_EASE_MS + STOP_HOLD_MS,
    );
    return () => clearTimeout(t);
  }, [stopIdx, tour.stops.length, onComplete]);

  useFrame(() => {
    const s = seg.current;
    if (!s) return;
    const elapsed = performance.now() - s.startMs;
    const t = Math.min(1, elapsed / STOP_EASE_MS);
    const eased = easeInOut(t);
    camera.position.lerpVectors(s.startPos, s.endPos, eased);
    target.current.lerpVectors(s.startTarget, s.endTarget, eased);
    camera.lookAt(target.current);
  });

  return null;
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}
