import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, useTexture } from '@react-three/drei';
import { useRef, useState } from 'react';
import * as THREE from 'three';

function AnimatedSphere({ position = [0, 0, 0] }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const [hovered, setHover] = useState(false);
  const [active, setActive] = useState(false);
  
  // Animate the sphere
  useFrame((state, delta) => {
    meshRef.current.rotation.x += delta * 0.2;
    meshRef.current.rotation.y += delta * 0.3;
  });
  
  return (
    <mesh
      position={position as [number, number, number]}
      ref={meshRef}
      scale={active ? 1.5 : 1}
      onClick={() => setActive(!active)}
      onPointerOver={() => setHover(true)}
      onPointerOut={() => setHover(false)}
    >
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial 
        color={hovered ? 'hotpink' : 'royalblue'} 
        metalness={0.5}
        roughness={0.2}
      />
    </mesh>
  );
}

function Planet({ position = [0, 0, 0] }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const texture = useTexture('/earth.jpg'); // You'll need to add this image to your public folder
  
  useFrame((state) => {
    meshRef.current.rotation.y += 0.002;
  });
  
  return (
    <mesh ref={meshRef} position={position as [number, number, number]}>
      <sphereGeometry args={[2, 64, 64]} />
      <meshStandardMaterial map={texture} />
    </mesh>
  );
}

export default function AdvancedScene() {
  return (
    <div className="w-full h-[600px]">
      <Canvas camera={{ position: [0, 0, 10], fov: 45 }}>
        <color attach="background" args={['#000']} />
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <spotLight position={[-10, -10, -10]} angle={0.3} penumbra={1} intensity={1} castShadow />
        
        <Planet position={[0, 0, 0]} />
        <AnimatedSphere position={[-4, 2, 0]} />
        <AnimatedSphere position={[4, -2, 0]} />
        
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade />
        <OrbitControls enableZoom={true} enablePan={true} />
      </Canvas>
    </div>
  );
} 