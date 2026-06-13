'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/*
 * A 3D blockchain block visualization: a rotating cube with floating particles
 * representing transactions. Uses Sui accent color. Canvas-based, performant.
 * Respects prefers-reduced-motion.
 */

export function BlockchainVisualization() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check prefers-reduced-motion
    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    camera.position.z = 3;

    // Main cube (blockchain block)
    const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
    const material = new THREE.MeshStandardMaterial({
      color: 0x1746c7, // Sui accent blue
      metalness: 0.4,
      roughness: 0.6,
      emissive: 0x1746c7,
      emissiveIntensity: 0.3,
    });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    // Wireframe outline
    const wireframe = new THREE.WireframeGeometry(geometry);
    const line = new THREE.LineSegments(
      wireframe,
      new THREE.LineBasicMaterial({ color: 0x6aa3ff, transparent: true, opacity: 0.5 })
    );
    cube.add(line);

    // Floating particles (transactions)
    const particleGeometry = new THREE.BufferGeometry();
    const particleCount = 40;
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 8;
      positions[i + 1] = (Math.random() - 0.5) * 8;
      positions[i + 2] = (Math.random() - 0.5) * 8;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const particleMaterial = new THREE.PointsMaterial({
      color: 0x6aa3ff,
      size: 0.08,
      transparent: true,
      opacity: 0.6,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // Lighting
    const light = new THREE.PointLight(0xffffff, 1.5, 100);
    light.position.set(5, 5, 5);
    scene.add(light);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Animation loop
    let animationId: number;

    const animate = () => {
      animationId = requestAnimationFrame(animate);

      if (!prefersReduced) {
        // Rotate cube
        cube.rotation.x += 0.005;
        cube.rotation.y += 0.008;

        // Animate particles: float around and pulse toward cube
        const positionAttribute = particleGeometry.getAttribute('position');
        const positions = positionAttribute.array as Float32Array;

        for (let i = 0; i < positions.length; i += 3) {
          positions[i] += Math.sin(Date.now() * 0.001 + i) * 0.01;
          positions[i + 1] += Math.cos(Date.now() * 0.0008 + i) * 0.01;
          positions[i + 2] += Math.sin(Date.now() * 0.0012 + i) * 0.01;

          // Keep particles within bounds
          if (Math.abs(positions[i]) > 4)
            positions[i] = (Math.random() - 0.5) * 4;
          if (Math.abs(positions[i + 1]) > 4)
            positions[i + 1] = (Math.random() - 0.5) * 4;
          if (Math.abs(positions[i + 2]) > 4)
            positions[i + 2] = (Math.random() - 0.5) * 4;
        }

        positionAttribute.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const onWindowResize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', onWindowResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', onWindowResize);
      cancelAnimationFrame(animationId);
      container.removeChild(renderer.domElement);
      geometry.dispose();
      material.dispose();
      wireframe.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full rounded-2xl border border-line-strong bg-term-bg"
      style={{ height: '400px' }}
    />
  );
}
