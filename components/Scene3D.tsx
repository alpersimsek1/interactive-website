import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useRef } from 'react';
import * as THREE from 'three';

function Box(props: any) {
  const meshRef = useRef<THREE.Mesh>(null!);
  
  return (
    <mesh
      {...props}
      ref={meshRef}
      scale={1}
      onClick={(e) => {
        e.stopPropagation();
        meshRef.current.scale.x = Math.random() + 0.5;
        meshRef.current.scale.y = Math.random() + 0.5;
        meshRef.current.scale.z = Math.random() + 0.5;
      }}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={'orange'} />
    </mesh>
  );
}

export default function Scene3D() {
  return (
    <div className="w-full h-[500px]">
      <Canvas camera={{ position: [3, 3, 3] }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <Box position={[-1.2, 0, 0]} />
        <Box position={[1.2, 0, 0]} />
        <OrbitControls />
      </Canvas>
    </div>
  );
} 