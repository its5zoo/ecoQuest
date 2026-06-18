import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Float, Sparkles } from '@react-three/drei';

function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Procedurally generated low-poly tree
function Tree({ position, scale = 1, type = 1 }) {
  const isPine = type % 2 === 0;

  return (
    <group position={position} scale={scale}>
      {/* Trunk */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.15, 1, 5]} />
        <meshStandardMaterial color="#5C4033" roughness={0.9} />
      </mesh>
      
      {/* Leaves */}
      {isPine ? (
        <group position={[0, 1, 0]}>
          <mesh position={[0, 0.5, 0]} castShadow>
            <coneGeometry args={[0.6, 1.5, 5]} />
            <meshStandardMaterial color="#2E8B57" roughness={0.8} />
          </mesh>
          <mesh position={[0, 1, 0]} castShadow>
            <coneGeometry args={[0.5, 1.2, 5]} />
            <meshStandardMaterial color="#3CB371" roughness={0.8} />
          </mesh>
        </group>
      ) : (
        <mesh position={[0, 1.5, 0]} castShadow>
          <icosahedronGeometry args={[0.8, 1]} />
          <meshStandardMaterial color="#4ADE80" roughness={0.8} />
        </mesh>
      )}
    </group>
  );
}

function Bush({ position, scale = 1 }) {
  return (
    <mesh position={position} scale={scale} castShadow>
      <sphereGeometry args={[0.3, 7, 7]} />
      <meshStandardMaterial color="#228B22" roughness={0.8} />
    </mesh>
  );
}

function Rock({ position, scale = 1 }) {
  return (
    <mesh position={position} scale={scale} castShadow>
      <dodecahedronGeometry args={[0.3, 0]} />
      <meshStandardMaterial color="#888888" roughness={0.9} />
    </mesh>
  );
}

function Island({ level, trees, islandRadius, extraProps }) {
  const islandRef = useRef();

  useFrame((state) => {
    if (islandRef.current) {
      islandRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
    }
  });

  // Grass color improves with level
  const grassColor = useMemo(() => {
    const r = Math.max(74, 150 - level * 8);
    const g = Math.min(222, 100 + level * 12);
    const b = Math.max(128, 100 - level * 5);
    return `rgb(${r}, ${g}, ${b})`;
  }, [level]);

  return (
    <group ref={islandRef}>
      <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.5}>
        {/* Floating Earth Base */}
        <mesh position={[0, -1, 0]} receiveShadow>
          <cylinderGeometry args={[islandRadius, islandRadius * 0.75, 2, 8]} />
          <meshStandardMaterial color="#3E2723" roughness={1} />
        </mesh>
        
        {/* Grass Top */}
        <mesh position={[0, 0.1, 0]} receiveShadow>
          <cylinderGeometry args={[islandRadius + 0.1, islandRadius, 0.2, 8]} />
          <meshStandardMaterial color={grassColor} roughness={0.8} />
        </mesh>

        {/* Trees */}
        {trees.map((tree, i) => (
          <Tree key={i} position={tree.position} scale={tree.scale} type={tree.type} />
        ))}

        {/* Extra Beautification Props (Bushes, Rocks) */}
        {extraProps.map((prop, i) => (
          prop.type === 'bush' ? 
            <Bush key={`prop-${i}`} position={prop.position} scale={prop.scale} /> :
            <Rock key={`prop-${i}`} position={prop.position} scale={prop.scale} />
        ))}

        {/* Level Magic Dust */}
        {level > 3 && (
          <Sparkles count={level * 10} scale={8} size={2} speed={0.4} color="#4ADE80" opacity={0.5} />
        )}
      </Float>
    </group>
  );
}

export default function VirtualForest({ level = 1, plantedTrees = 0 }) {
  // Generate random stable positions for trees and calculate dynamic island size
  const { trees, islandRadius, extraProps } = useMemo(() => {
    const count = Math.min(50, level + plantedTrees);
    const radius = 3.5 + (count * 0.15); // Land expands as trees are planted
    
    const treesData = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + seededRandom(i * 1.7 + 0.1);
      const r = seededRandom(i * 2.3 + 0.5) * (radius - 0.8) + 0.5; // Spread trees inside the new radius
      treesData.push({
        position: [Math.cos(angle) * r, 0.2, Math.sin(angle) * r],
        scale: 0.6 + seededRandom(i * 3.1 + 0.9) * 0.6,
        type: i
      });
    }

    const propsData = [];
    if (level >= 2) {
      for(let i = 0; i < level * 2; i++) {
        const angle = seededRandom(i * 4.3 + 1.2) * Math.PI * 2;
        const r = seededRandom(i * 5.7 + 2.1) * (radius - 0.5);
        propsData.push({ type: 'bush', position: [Math.cos(angle) * r, 0.2, Math.sin(angle) * r], scale: 0.5 + seededRandom(i * 6.9 + 3.4) * 0.5 });
      }
    }
    if (level >= 3) {
      for(let i = 0; i < level; i++) {
        const angle = seededRandom(i * 7.1 + 4.5) * Math.PI * 2;
        const r = seededRandom(i * 8.3 + 5.6) * (radius - 0.5);
        propsData.push({ type: 'rock', position: [Math.cos(angle) * r, 0.2, Math.sin(angle) * r], scale: 0.5 + seededRandom(i * 9.7 + 6.7) * 0.8 });
      }
    }

    return { trees: treesData, islandRadius: radius, extraProps: propsData };
  }, [level, plantedTrees]);

  return (
    <div style={{ width: '100%', height: '300px', borderRadius: '16px', overflow: 'hidden', background: 'linear-gradient(to bottom, #87CEEB 0%, #E0F6FF 100%)' }}>
      <Canvas shadows camera={{ position: [0, 5, 10], fov: 45 }}>
        <ambientLight intensity={0.4} />
        <directionalLight 
          position={[5, 10, 5]} 
          intensity={1.5} 
          castShadow 
          shadow-mapSize={1024}
        />
        <Environment preset="city" />
        <Island level={level} trees={trees} islandRadius={islandRadius} extraProps={extraProps} />
        <OrbitControls 
          enableZoom={false} 
          enablePan={false} 
          minPolarAngle={Math.PI / 4} 
          maxPolarAngle={Math.PI / 2.2} 
          autoRotate 
          autoRotateSpeed={0.5} 
        />
      </Canvas>
    </div>
  );
}
