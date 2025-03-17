import { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, AdaptiveDpr, Text } from '@react-three/drei';
import * as THREE from 'three';

// Define types for superformula parameters
type SuperformulaParams = {
  a: number;
  b: number;
  m: number;
  n1: number;
  n2: number;
  n3: number;
  scale: number;
  segments: number;
  color: string;   // Base color of the shape
  wireframe: boolean; // Whether to render as wireframe
};

// Shape parameters type with all possible options
type ShapeParams = {
  superformula: SuperformulaParams;
  segments?: number;
  thickness?: number;
  tubeSegments?: number;
  tubularSegments?: number;
  meshType?: string;
  type: string;
  animation: 'rotate' | 'pulse' | 'morph' | 'wave';
};

// Default parameters for shapes
const defaultSuperellipseParams: ShapeParams = {
  type: 'superellipse',
  animation: 'rotate',
  superformula: {
    m: 8,
    n1: 2,
    n2: 15,
    n3: 15,
    a: 1,
    b: 1,
    scale: 1,
    segments: 128,
    color: '#4080ff',
    wireframe: false
  }
};

const defaultSuperellipsoidParams: ShapeParams = {
  type: 'superellipsoid',
  animation: 'rotate',
  superformula: {
    m: 6,
    n1: 1,
    n2: 10,
    n3: 10,
    a: 1,
    b: 1,
    scale: 1,
    segments: 64,
    color: '#ff40a0',
    wireframe: false
  }
};

const defaultSupertoroidParams: ShapeParams = {
  type: 'supertoroid',
  animation: 'rotate',
  superformula: {
    m: 4,
    n1: 0.5,
    n2: 1.7,
    n3: 1.7,
    a: 1,
    b: 1,
    scale: 1,
    segments: 64,
    color: '#40ff80',
    wireframe: false
  },
  thickness: 0.3,
  tubeSegments: 32,
  tubularSegments: 128
};

const defaultMobiusParams: ShapeParams = {
  type: 'mobius',
  animation: 'rotate',
  superformula: {
    m: 0,
    n1: 1,
    n2: 1,
    n3: 1,
    a: 1,
    b: 1,
    scale: 1,
    segments: 128,
    color: '#ffff40',
    wireframe: false
  },
  thickness: 0.2,
  tubeSegments: 24
};

// Superformula calculations based on Paul Bourke's research
// http://paulbourke.net/geometry/supershape/
const superformula = (theta: number, params: SuperformulaParams): number => {
  const { a = 1, b = 1, m = 6, n1 = 1, n2 = 1, n3 = 1 } = params;
  
  const part1 = Math.abs(Math.cos(m * theta / 4) / a);
  const part2 = Math.abs(Math.sin(m * theta / 4) / b);
  
  const part1Pow = Math.pow(part1, n2);
  const part2Pow = Math.pow(part2, n3);
  
  const inside = part1Pow + part2Pow;
  return Math.pow(inside, -1 / n1);
};

// Generate a superellipse using the superformula
const generateSuperellipse = (
  params: ShapeParams
): THREE.ShapeGeometry => {
  const { superformula: sfParams, segments = 128 } = params;
  const shape = new THREE.Shape();
  
  // Generate points using the superformula
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const theta = t * Math.PI * 2;
    const r = superformula(theta, sfParams);
    const x = r * Math.cos(theta) * sfParams.scale;
    const y = r * Math.sin(theta) * sfParams.scale;
    
    if (i === 0) {
      shape.moveTo(x, y);
    } else {
      shape.lineTo(x, y);
    }
  }
  
  const geometry = new THREE.ShapeGeometry(shape, segments / 2);
  // Store the original shape for extrusion
  geometry.userData = { shape };
  return geometry;
};

// Generate a superellipsoid using the superformula
const generateSuperellipsoid = (
  params: ShapeParams
): THREE.BufferGeometry => {
  const { superformula: sfParams, segments = 32 } = params;
  
  const vertices: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  
  // Generate points on the sphere surface
  for (let latIdx = 0; latIdx <= segments; latIdx++) {
    const latitude = (latIdx / segments) * Math.PI - Math.PI / 2;
    
    for (let lonIdx = 0; lonIdx <= segments; lonIdx++) {
      const longitude = (lonIdx / segments) * Math.PI * 2;
      
      // Calculate radius at this point using superformula
      const r1 = superformula(longitude, sfParams);
      const r2 = superformula(latitude + Math.PI / 2, sfParams);
      
      // Convert to cartesian coordinates
      const x = sfParams.scale * r1 * Math.cos(longitude) * r2 * Math.cos(latitude);
      const y = sfParams.scale * r1 * Math.sin(longitude) * r2 * Math.cos(latitude);
      const z = sfParams.scale * r2 * Math.sin(latitude);
      
      // Add vertex
      vertices.push(x, y, z);
      
      // Add normal
      const length = Math.sqrt(x * x + y * y + z * z);
      normals.push(x / length, y / length, z / length);
      
      // Add uv
      uvs.push(lonIdx / segments, latIdx / segments);
      
      // Add indices for faces
      if (latIdx < segments && lonIdx < segments) {
        const current = latIdx * (segments + 1) + lonIdx;
        const next = current + segments + 1;
        
        indices.push(current, next, current + 1);
        indices.push(current + 1, next, next + 1);
      }
    }
  }
  
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  
  return geometry;
};

// Generate a super-toroid using a combination of superformulas
const generateSupertoroid = (
  params: ShapeParams
): THREE.BufferGeometry => {
  const { superformula: sfParams, thickness = 0.3, tubeSegments = 32, tubularSegments = 128 } = params;
  
  // Generate the central curve for the toroid using a path
  const path = new THREE.CurvePath<THREE.Vector3>();
  
  // Create curve segments to form our shape
  const points: THREE.Vector3[] = [];
  const segments = sfParams.segments;
  
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const theta = t * Math.PI * 2;
    const r = superformula(theta, sfParams);
    const x = r * Math.cos(theta) * sfParams.scale;
    const y = r * Math.sin(theta) * sfParams.scale;
    const z = 0;
    points.push(new THREE.Vector3(x, y, z));
  }
  
  // Create a smooth path through the points
  for (let i = 0; i < points.length - 1; i++) {
    const lineCurve = new THREE.LineCurve3(points[i], points[(i + 1) % points.length]);
    path.add(lineCurve);
  }
  
  // Create a tube geometry based on the path
  const geometry = new THREE.TubeGeometry(
    path,
    tubularSegments, 
    thickness, 
    tubeSegments, 
    true
  );
  
  return geometry;
};

// Generate a Möbius strip
const generateMobiusStrip = (
  params: ShapeParams
): THREE.BufferGeometry => {
  const { superformula, thickness = 0.2, tubeSegments = 24 } = params;
  const segments = superformula.segments;
  const geometry = new THREE.BufferGeometry();
  const vertices: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  
  for (let i = 0; i <= segments; i++) {
    const u = i / segments;
    const theta = u * Math.PI * 2;
    
    // Base circle of the mobius strip
    const radius = superformula.scale;
    const centerX = radius * Math.cos(theta);
    const centerY = radius * Math.sin(theta);
    const centerZ = 0;
    
    // Create points across the width of the strip
    for (let j = 0; j <= tubeSegments; j++) {
      const v = j / tubeSegments;
      const width = thickness * (2 * v - 1);
      
      // Calculate the half-twist
      const twist = theta / 2;
      
      // Apply the twist
      const x = centerX + width * Math.cos(twist) * Math.cos(theta);
      const y = centerY + width * Math.cos(twist) * Math.sin(theta);
      const z = width * Math.sin(twist);
      
      vertices.push(x, y, z);
      
      // Calculate approximate normal
      const nextTheta = ((i + 0.01) / segments) * Math.PI * 2;
      const nextTwist = nextTheta / 2;
      const nextX = radius * Math.cos(nextTheta) + width * Math.cos(nextTwist) * Math.cos(nextTheta);
      const nextY = radius * Math.sin(nextTheta) + width * Math.cos(nextTwist) * Math.sin(nextTheta);
      const nextZ = width * Math.sin(nextTwist);
      
      const tangent = new THREE.Vector3(nextX - x, nextY - y, nextZ - z).normalize();
      const widthDirection = new THREE.Vector3(
        Math.cos(twist) * Math.cos(theta),
        Math.cos(twist) * Math.sin(theta),
        Math.sin(twist)
      ).normalize();
      
      const normal = new THREE.Vector3().crossVectors(tangent, widthDirection).normalize();
      normals.push(normal.x, normal.y, normal.z);
      
      // UV coordinates
      uvs.push(u, v);
    }
  }
  
  // Create faces
  const indices: number[] = [];
  const verticesPerRow = tubeSegments + 1;
  
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < tubeSegments; j++) {
      const a = i * verticesPerRow + j;
      const b = (i + 1) * verticesPerRow + j;
      const c = i * verticesPerRow + (j + 1);
      const d = (i + 1) * verticesPerRow + (j + 1);
      
      indices.push(a, b, c);
      indices.push(c, b, d);
    }
  }
  
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  
  return geometry;
};

// Get the appropriate geometry for the selected shape
const getGeometry = (
  params: ShapeParams
): THREE.BufferGeometry | THREE.ExtrudeGeometry => {
  const { type } = params;
  
  switch (type) {
    case 'superellipse': {
      return generateSuperellipse(params);
    }
    case 'superellipsoid':
      return generateSuperellipsoid(params);
    case 'supertoroid':
      return generateSupertoroid(params);
    case 'mobius':
      return generateMobiusStrip(params);
    default:
      return generateSuperellipsoid(params);
  }
};

// Component to render a single shape
const SuperShape = ({ params, time, isClicking }: { params: ShapeParams, time: number, isClicking: boolean }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial | THREE.MeshBasicMaterial>(null);
  
  // Generate the geometry based on the shape type
  const geometry = useMemo(() => {
    switch(params.type) {
      case 'superellipse': {
        // Get the shape geometry and extract the shape for extrusion
        const shapeGeom = generateSuperellipse(params);
        return new THREE.ExtrudeGeometry(shapeGeom.userData.shape, {
          depth: 0.5,
          bevelEnabled: true,
          bevelThickness: 0.1,
          bevelSize: 0.1,
          bevelSegments: 5
        });
      }
      case 'superellipsoid':
        return generateSuperellipsoid(params);
      case 'supertoroid':
        return generateSupertoroid(params);
      case 'mobius':
        return generateMobiusStrip(params);
      default:
        return new THREE.BoxGeometry(1, 1, 1);
    }
  }, [params]);
  
  // Animation behavior
  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    const mesh = meshRef.current;
    const speed = isClicking ? 2.0 : 1.0;
    
    // Different animation types
    switch(params.animation) {
      case 'rotate':
        mesh.rotation.x = time * 0.2 * speed;
        mesh.rotation.y = time * 0.3 * speed;
        break;
      case 'pulse':
        const scale = 1 + Math.sin(time * 2) * 0.1;
        mesh.scale.set(scale, scale, scale);
        break;
      case 'morph':
        // Color shift animation for materials
        if (materialRef.current) {
          const hue = (time * 0.1) % 1;
          const color = new THREE.Color().setHSL(hue, 0.7, 0.5);
          if ('color' in materialRef.current) {
            materialRef.current.color = color;
          }
          
          if (params.type === 'superellipsoid' || params.type === 'supertoroid') {
            // Rotate more dynamically for 3D shapes
            mesh.rotation.x = Math.sin(time * 0.3) * Math.PI * 0.2;
            mesh.rotation.y = time * 0.2 * speed;
            mesh.rotation.z = Math.cos(time * 0.2) * Math.PI * 0.15;
          }
        }
        break;
      case 'wave':
        mesh.position.y = Math.sin(time * 2) * 0.2;
        mesh.rotation.x = Math.sin(time * 0.5) * Math.PI * 0.15;
        mesh.rotation.y = time * 0.2 * speed;
        break;
    }
  });
  
  // Choose material based on wireframe setting
  const material = useMemo(() => {
    if (params.superformula.wireframe) {
      return (
        <meshBasicMaterial 
          ref={materialRef}
          color={params.superformula.color}
          wireframe={true}
        />
      );
    } else {
      return (
        <meshStandardMaterial 
          ref={materialRef}
          color={params.superformula.color}
          metalness={0.3}
          roughness={0.4}
        />
      );
    }
  }, [params.superformula.wireframe, params.superformula.color]);
  
  return (
    <mesh ref={meshRef} geometry={geometry}>
      {material}
    </mesh>
  );
};

// Main scene component with shapes and lighting
const SuperformulasScene = ({ 
  activeShape, 
  isClicking,
  shapeParams,
  setShapeParams
}: { 
  activeShape: string,
  isClicking: boolean,
  shapeParams: Record<string, ShapeParams>,
  setShapeParams: React.Dispatch<React.SetStateAction<Record<string, ShapeParams>>>
}) => {
  const timeRef = useRef(0);
  
  useFrame((state, delta) => {
    timeRef.current += delta;
  });
  
  return (
    <>
      {/* Lighting setup */}
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#ffffff" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#8080ff" />
      
      {/* Active shape */}
      <group position={[0, 0, 0]}>
        <SuperShape 
          params={shapeParams[activeShape]} 
          time={timeRef.current} 
          isClicking={isClicking} 
        />
      </group>
      
      {/* Information text */}
      <Text
        position={[0, -2.2, 0]}
        fontSize={0.15}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        {activeShape.toUpperCase()}
      </Text>
      <Text
        position={[0, -2.5, 0]}
        fontSize={0.1}
        color="#aaaaaa"
        anchorX="center"
        anchorY="middle"
      >
        Press 1-4 to switch shapes | Press A to change animation
      </Text>
      
      {/* Camera controls */}
      <OrbitControls 
        enablePan={false}
        enableZoom={true}
        enableRotate={true}
        autoRotate={false}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI * 5/6}
      />
    </>
  );
};

// Main export component
export default function Supershapes() {
  const [isClicking, setIsClicking] = useState(false);
  const [activeShape, setActiveShape] = useState<string>('superellipsoid');
  const [shapeParams, setShapeParams] = useState<Record<string, ShapeParams>>({
    'superellipse': defaultSuperellipseParams,
    'superellipsoid': defaultSuperellipsoidParams,
    'supertoroid': defaultSupertoroidParams,
    'mobius': defaultMobiusParams
  });
  
  // Handle mouse interactions
  const handlePointerDown = () => setIsClicking(true);
  const handlePointerUp = () => setIsClicking(false);
  const handlePointerLeave = () => setIsClicking(false);
  
  // Key press handler for shape switching
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Switch between shapes
      if (e.key === '1') setActiveShape('superellipse');
      if (e.key === '2') setActiveShape('superellipsoid');
      if (e.key === '3') setActiveShape('supertoroid');
      if (e.key === '4') setActiveShape('mobius');
      
      // Change animation type
      if (e.key === 'a' || e.key === 'A') {
        setShapeParams(prev => {
          const current = prev[activeShape];
          const animations: ShapeParams['animation'][] = ['rotate', 'pulse', 'morph', 'wave'];
          const currentIndex = animations.indexOf(current.animation);
          const nextIndex = (currentIndex + 1) % animations.length;
          
          return {
            ...prev,
            [activeShape]: {
              ...current,
              animation: animations[nextIndex]
            }
          };
        });
      }
      
      // Toggle wireframe mode
      if (e.key === 'w' || e.key === 'W') {
        setShapeParams(prev => {
          const current = prev[activeShape];
          
          return {
            ...prev,
            [activeShape]: {
              ...current,
              superformula: {
                ...current.superformula,
                wireframe: !current.superformula.wireframe
              }
            }
          };
        });
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeShape]);
  
  return (
    <div 
      className="w-full h-full relative"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        dpr={[1, 2]} // Responsive device pixel ratio
      >
        <color attach="background" args={['#050912']} />
        <SuperformulasScene 
          activeShape={activeShape}
          isClicking={isClicking}
          shapeParams={shapeParams}
          setShapeParams={setShapeParams}
        />
        <AdaptiveDpr pixelated />
      </Canvas>
    </div>
  );
} 