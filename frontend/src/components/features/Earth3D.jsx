import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Sphere } from '@react-three/drei';
import * as THREE from 'three';

function RealisticEarth({ animPhase }) {
  const earthRef = useRef();
  const cloudsRef = useRef();
  const materialRef = useRef();
  const lightRef = useRef();
  const ambientRef = useRef();
  const backLightRef = useRef();

  const animPhaseRef = useRef(animPhase);
  useEffect(() => {
    animPhaseRef.current = animPhase;
  }, [animPhase]);

  // Load textures
  const [colorMap, normalMap, specularMap, cloudsMap] = useLoader(THREE.TextureLoader, [
    '/earth_color.jpg',
    '/earth_normal.jpg',
    '/earth_specular.jpg',
    '/earth_clouds.png',
  ]);

  useFrame(({ clock }) => {
    const elapsedTime = clock.getElapsedTime();
    if (earthRef.current) earthRef.current.rotation.y = elapsedTime * (Math.PI / 4);
    if (cloudsRef.current) cloudsRef.current.rotation.y = elapsedTime * (Math.PI / 3.5);

    // Keep base color white
    const targetColor = new THREE.Color('#ffffff');
    const ambientIntensity = 3.0;

    // Constant bright lighting
    const dirIntensity = 4.0;
    const dirColor = new THREE.Color('#ffffff');
    const backLightIntensity = 1.5;

    if (materialRef.current) {
      materialRef.current.color.lerp(targetColor, 0.05);
    }

    if (ambientRef.current) ambientRef.current.intensity = THREE.MathUtils.lerp(ambientRef.current.intensity, ambientIntensity, 0.05);

    if (lightRef.current) {
      lightRef.current.intensity = THREE.MathUtils.lerp(lightRef.current.intensity, dirIntensity, 0.05);
      lightRef.current.color.lerp(dirColor, 0.05);
    }

    if (backLightRef.current) {
      backLightRef.current.intensity = THREE.MathUtils.lerp(backLightRef.current.intensity, backLightIntensity, 0.05);
      backLightRef.current.color.lerp(dirColor, 0.05);
    }

    const currentPhase = animPhaseRef.current;
    if (cloudsRef.current) {
      cloudsRef.current.material.opacity = THREE.MathUtils.lerp(cloudsRef.current.material.opacity, currentPhase >= 2 ? 0.1 : 0.8, 0.05);
    }

    // Smoothly scale the 3D Earth inside WebGL to fit the red aura during Zoomed Earth Phase
    const targetScale = currentPhase === 0 ? 4.20 : 3.50;
    if (earthRef.current) {
      const nextScale = THREE.MathUtils.lerp(earthRef.current.scale.x, targetScale, 0.05);
      earthRef.current.scale.setScalar(nextScale);
      if (cloudsRef.current) {
        cloudsRef.current.scale.setScalar(nextScale);
      }
    }
  });

  return (
    <>
      <ambientLight ref={ambientRef} intensity={3.0} />
      <directionalLight ref={lightRef} position={[5, 3, 5]} intensity={4.0} />
      <pointLight ref={backLightRef} position={[-10, -5, -10]} intensity={1.5} color="#ffffff" />

      {/* Main Earth Sphere */}
      <Sphere ref={earthRef} args={[1, 64, 64]} scale={4.20} position={[0, 0, 0]}>
        <meshStandardMaterial
          ref={materialRef}
          map={colorMap}
          normalMap={normalMap}
          roughnessMap={specularMap}
          roughness={0.8}
        />
      </Sphere>

      {/* Clouds Layer */}
      <Sphere ref={cloudsRef} args={[1.01, 64, 64]} scale={4.20} position={[0, 0, 0]}>
        <meshPhongMaterial
          map={cloudsMap}
          transparent={true}
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </Sphere>
    </>
  );
}

export default function Earth3D({ animPhase = 0 }) {
  const containerRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const hasSize = () => container.offsetWidth > 0 && container.offsetHeight > 0;

    if (hasSize()) {
      setReady(true);
      return;
    }

    // Wait for container to get its final layout dimensions
    const observer = new ResizeObserver(() => {
      if (hasSize()) {
        setReady(true);
        observer.disconnect();
      }
    });
    observer.observe(container);

    // Backup: recheck after layout paints
    let raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (hasSize()) {
          setReady(true);
          setRetryKey(k => k + 1);
          observer.disconnect();
        }
      });
    });

    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', cursor: 'grab', position: 'relative', background: 'transparent' }}>
      {ready && (
        <Canvas key={retryKey} camera={{ position: [0, 0, 40], fov: 30 }} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
          <React.Suspense fallback={null}>
            <RealisticEarth animPhase={animPhase} />
          </React.Suspense>
          <OrbitControls enableZoom={false} enablePan={false} autoRotate={false} target={[0, 0, 0]} />
        </Canvas>
      )}
    </div>
  );
}
