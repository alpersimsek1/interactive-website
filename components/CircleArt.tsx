import { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, AdaptiveDpr, Trail, Points, Point } from '@react-three/drei';
import * as THREE from 'three';
import { useSpring, animated } from '@react-spring/three';

// Types for shape parameters
type ShapeParams = {
  type: 'circle' | 'square' | 'triangle';
  count: number;
  size: number;
  speed: number;
  rotation: number;
  distribution: 'grid' | 'spiral' | 'wave' | 'random';
  colorScheme: 'rainbow' | 'monochrome' | 'gradient' | 'pastel';
  motionPattern: 'orbital' | 'pulse' | 'wave' | 'scatter';
  interactivity: number; // 1-10: how much mouse interaction affects the shapes
};

// Default parameters
const defaultParams: ShapeParams = {
  type: 'circle',
  count: 200,
  size: 0.15,
  speed: 1.0,
  rotation: 45,
  distribution: 'spiral',
  colorScheme: 'rainbow',
  motionPattern: 'orbital',
  interactivity: 7,
};

// Controls component for the UI
type ControlsProps = {
  params: ShapeParams;
  setParams: React.Dispatch<React.SetStateAction<ShapeParams>>;
  isDarkMode: boolean;
  onShapeChange: (shape: 'circle' | 'square' | 'triangle') => void;
};

// Generate point positions based on distribution pattern
const generatePositions = (params: ShapeParams, time: number = 0, mousePos: THREE.Vector2 = new THREE.Vector2()): THREE.Vector3[] => {
  const positions: THREE.Vector3[] = [];
  const { count, distribution, interactivity, motionPattern } = params;
  
  // Mouse influence
  const mouseInfluence = interactivity / 10;
  const mouseVector = new THREE.Vector3(
    mousePos.x * mouseInfluence, 
    mousePos.y * mouseInfluence, 
    0
  );

  switch (distribution) {
    case 'grid': {
      // Calculate grid dimensions based on count
      const gridSize = Math.ceil(Math.sqrt(count));
      const spacing = 10 / gridSize;
      
      for (let i = 0; i < count; i++) {
        const x = (i % gridSize) * spacing - (spacing * (gridSize - 1)) / 2;
        const y = Math.floor(i / gridSize) * spacing - (spacing * (gridSize - 1)) / 2;
        
        // Apply motion patterns
        let z = 0;
        let offsetX = 0;
        let offsetY = 0;
        
        if (motionPattern === 'orbital') {
          const angle = (i / count) * Math.PI * 2 + time;
          offsetX = Math.cos(angle) * (0.5 + (i % 5) * 0.1);
          offsetY = Math.sin(angle) * (0.5 + (i % 3) * 0.1);
        } else if (motionPattern === 'pulse') {
          const pulseScale = Math.sin(time * 2 + i * 0.1) * 0.3 + 1;
          offsetX = x * (pulseScale - 1);
          offsetY = y * (pulseScale - 1);
          z = Math.sin(time + i * 0.05) * 0.5;
        } else if (motionPattern === 'wave') {
          const waveX = Math.sin(time * 2 + y * 0.5) * 0.5;
          const waveY = Math.cos(time * 1.5 + x * 0.5) * 0.5;
          offsetX = waveX;
          offsetY = waveY;
          z = Math.sin(time + x * 0.5 + y * 0.5) * 0.5;
        } else if (motionPattern === 'scatter') {
          offsetX = Math.sin(time + i) * 0.7;
          offsetY = Math.cos(time * 1.3 + i * 0.7) * 0.7;
          z = Math.sin(time * 0.7 + i * 0.3) * 0.7;
        }
        
        positions.push(new THREE.Vector3(
          x + offsetX + mouseVector.x * (1 + Math.sin(time + i * 0.1)), 
          y + offsetY + mouseVector.y * (1 + Math.cos(time + i * 0.1)), 
          z
        ));
      }
      break;
    }
    case 'spiral': {
      const turns = Math.min(Math.ceil(count / 50), 8);
      const angleStep = (Math.PI * 2 * turns) / count;
      
      for (let i = 0; i < count; i++) {
        const angle = i * angleStep + time * (0.2 + (i % 10) * 0.01);
        const radius = (i / count) * 7 + 0.5;
        
        let x = Math.cos(angle) * radius;
        let y = Math.sin(angle) * radius;
        let z = 0;
        
        // Apply motion patterns
        if (motionPattern === 'orbital') {
          const orbitAngle = time * (1 + (i % 5) * 0.1);
          x += Math.cos(orbitAngle) * 0.3;
          y += Math.sin(orbitAngle) * 0.3;
        } else if (motionPattern === 'pulse') {
          const pulseScale = Math.sin(time * 2 + i * 0.1) * 0.3 + 1;
          x *= pulseScale;
          y *= pulseScale;
          z = Math.sin(time + i * 0.05) * 0.5;
        } else if (motionPattern === 'wave') {
          const waveOffset = Math.sin(angle * 3 + time * 2) * 0.5;
          x += waveOffset * Math.cos(angle + Math.PI / 2);
          y += waveOffset * Math.sin(angle + Math.PI / 2);
          z = Math.sin(time + angle) * 0.5;
        } else if (motionPattern === 'scatter') {
          const scatterAmount = 0.7 + Math.sin(time + i * 0.2) * 0.3;
          x += (Math.random() - 0.5) * scatterAmount;
          y += (Math.random() - 0.5) * scatterAmount;
          z = (Math.random() - 0.5) * scatterAmount;
        }
        
        positions.push(new THREE.Vector3(
          x + mouseVector.x * (Math.sin(time + i * 0.05) + 1), 
          y + mouseVector.y * (Math.cos(time + i * 0.05) + 1), 
          z
        ));
      }
      break;
    }
    case 'wave': {
      const cols = Math.ceil(Math.sqrt(count * 2));
      const rows = Math.ceil(count / cols);
      const xSpacing = 12 / cols;
      const ySpacing = 8 / rows;
      
      for (let i = 0; i < count; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        
        let x = col * xSpacing - (xSpacing * (cols - 1)) / 2;
        let y = row * ySpacing - (ySpacing * (rows - 1)) / 2;
        
        // Add wave effect
        const frequency = 0.5;
        const amplitude = 1.5;
        const waveOffset = Math.sin(time * frequency + col * 0.5 + row * 0.5) * amplitude;
        
        // Apply motion patterns
        let z = 0;
        if (motionPattern === 'orbital') {
          const angle = time + (col + row) * 0.1;
          x += Math.cos(angle) * 0.3;
          y += Math.sin(angle) * 0.3;
          z = waveOffset * 0.3;
        } else if (motionPattern === 'pulse') {
          const pulseScale = Math.sin(time + (col + row) * 0.1) * 0.3 + 1;
          x *= pulseScale;
          y *= pulseScale;
          z = waveOffset * 0.5;
        } else if (motionPattern === 'wave') {
          x += Math.sin(time + row * 0.5) * 0.5;
          y += waveOffset * 0.5;
          z = Math.cos(time * 0.7 + col * 0.3) * 0.5;
        } else if (motionPattern === 'scatter') {
          const scatterAmount = 0.5 + Math.sin(time + i * 0.1) * 0.2;
          x += (Math.random() - 0.5) * scatterAmount;
          y += (Math.random() - 0.5) * scatterAmount;
          z = waveOffset * 0.5 + (Math.random() - 0.5) * scatterAmount;
        }
        
        positions.push(new THREE.Vector3(
          x + mouseVector.x * Math.sin(time + col * 0.2), 
          y + mouseVector.y * Math.cos(time + row * 0.2), 
          z
        ));
      }
      break;
    }
    case 'random': {
      for (let i = 0; i < count; i++) {
        // Generate random position within bounds
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 8;
        
        let x = Math.cos(angle) * radius;
        let y = Math.sin(angle) * radius;
        let z = 0;
        
        // Apply motion patterns
        if (motionPattern === 'orbital') {
          const orbitSpeed = 0.5 + Math.random() * 0.5;
          const orbitAngle = time * orbitSpeed;
          x += Math.cos(orbitAngle) * 0.8;
          y += Math.sin(orbitAngle) * 0.8;
        } else if (motionPattern === 'pulse') {
          const pulseScale = Math.sin(time * 2 + i * 0.1) * 0.3 + 1;
          x *= pulseScale;
          y *= pulseScale;
          z = Math.sin(time + i * 0.05) * 0.8;
        } else if (motionPattern === 'wave') {
          const waveOffset = Math.sin(time + x * 0.5 + y * 0.5) * 0.8;
          x += waveOffset * 0.3;
          y += waveOffset * 0.3;
          z = waveOffset;
        } else if (motionPattern === 'scatter') {
          // Each particle drifts in a semi-random direction
          const drift = (i / count) * Math.PI * 2;
          x += Math.cos(drift + time) * 0.5;
          y += Math.sin(drift + time) * 0.5;
          z = (Math.random() - 0.5) * 0.5;
        }
        
        positions.push(new THREE.Vector3(
          x + mouseVector.x * (1 + Math.sin(time + i * 0.1) * 0.5), 
          y + mouseVector.y * (1 + Math.cos(time + i * 0.1) * 0.5), 
          z
        ));
      }
      break;
    }
  }
  
  return positions;
};

// Generate colors based on color scheme
const generateColors = (params: ShapeParams, time: number = 0): THREE.Color[] => {
  const colors: THREE.Color[] = [];
  const { count, colorScheme } = params;
  
  switch (colorScheme) {
    case 'rainbow': {
      for (let i = 0; i < count; i++) {
        const hue = ((i / count) + time * 0.1) % 1;
        colors.push(new THREE.Color().setHSL(hue, 0.7, 0.5));
      }
      break;
    }
    case 'monochrome': {
      for (let i = 0; i < count; i++) {
        const baseHue = time * 0.05 % 1; // Slowly cycle through hues
        const lightness = 0.3 + (i / count) * 0.5;
        colors.push(new THREE.Color().setHSL(baseHue, 0.6, lightness));
      }
      break;
    }
    case 'gradient': {
      for (let i = 0; i < count; i++) {
        const hue1 = (time * 0.1) % 1; 
        const hue2 = (hue1 + 0.5) % 1;
        const mixRatio = i / count;
        const hue = hue1 * (1 - mixRatio) + hue2 * mixRatio;
        colors.push(new THREE.Color().setHSL(hue, 0.7, 0.5));
      }
      break;
    }
    case 'pastel': {
      for (let i = 0; i < count; i++) {
        const hue = ((i / count) * 0.7 + time * 0.1) % 1;
        colors.push(new THREE.Color().setHSL(hue, 0.3, 0.7));
      }
      break;
    }
  }
  
  return colors;
};

// Shape component to render the shapes
const ShapeRenderer = ({ params, mousePos }: { params: ShapeParams, mousePos: THREE.Vector2 }) => {
  const groupRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);
  const threeMousePos = useRef(new THREE.Vector2());
  
  // Convert normalized mouse coordinates to match the grid scale
  useEffect(() => {
    threeMousePos.current.x = mousePos.x * 10;
    threeMousePos.current.y = mousePos.y * 5;
  }, [mousePos]);
  
  // Calculate positions and colors based on current parameters
  const { positions, colors, sizes } = useMemo(() => {
    const positions = generatePositions(params, timeRef.current, threeMousePos.current);
    const colors = generateColors(params, timeRef.current);
    
    // Vary sizes slightly based on position or index
    const sizes = Array(positions.length).fill(0).map((_, i) => {
      const positionFactor = Math.abs(positions[i].x * positions[i].y) * 0.05;
      const variationFactor = 0.7 + Math.sin(i * 0.5) * 0.3;
      return params.size * variationFactor * (1 + positionFactor);
    });
    
    return { positions, colors, sizes };
  }, [params, timeRef.current]);
  
  // Animation loop
  useFrame((state, delta) => {
    timeRef.current += delta * params.speed;
    
    if (groupRef.current) {
      // Update group rotation based on params
      groupRef.current.rotation.z = timeRef.current * 0.1 * (params.rotation / 45);
    }
  });
  
  return (
    <group ref={groupRef}>
      {positions.map((position, i) => {
        // Apply spring animations to each shape's position
        const { spring } = useSpring({
          spring: timeRef.current,
          config: { mass: 1, tension: 200, friction: 20 }
        });
        
        const AnimatedSphere = animated(({ scale }: { scale: number }) => (
          <mesh position={position} scale={scale}>
            {params.type === 'circle' && <sphereGeometry args={[1, 12, 12]} />}
            {params.type === 'square' && <boxGeometry args={[1.4, 1.4, 1.4]} />}
            {params.type === 'triangle' && <tetrahedronGeometry args={[1.2]} />}
            <meshBasicMaterial 
              color={colors[i]} 
              transparent 
              opacity={0.8}
            />
            {params.size > 0.2 && (
              <Trail 
                width={3} 
                length={6} 
                color={colors[i]} 
                attenuation={(t) => t * t}
              >
                <mesh visible={false}>
                  <sphereGeometry args={[0.1, 8, 8]} />
                </mesh>
              </Trail>
            )}
          </mesh>
        ));
        
        return (
          <AnimatedSphere 
            key={i} 
            scale={spring.to((s: number) => sizes[i] * (1 + Math.sin(s + i * 0.1) * 0.2))}
          />
        );
      })}
    </group>
  );
};

// Controls UI component
const ShapeArtControls = ({ params, setParams, isDarkMode, onShapeChange }: ControlsProps) => {
  const handleChange = (key: keyof ShapeParams, value: any) => {
    setParams(prev => {
      const newParams = { ...prev, [key]: value };
      // If the shape type changes, trigger the callback
      if (key === 'type') {
        onShapeChange(value);
      }
      return newParams;
    });
  };
  
  return (
    <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-800/80' : 'bg-gray-100/80'} backdrop-filter backdrop-blur-sm overflow-y-auto max-h-[calc(100vh-180px)]`}>
      <div className="space-y-4">
        <div>
          <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Shape Type
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['circle', 'square', 'triangle'] as const).map(type => (
              <button
                key={type}
                className={`px-3 py-2 text-xs rounded-lg transition
                  ${params.type === type
                    ? isDarkMode 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-indigo-100 text-indigo-800'
                    : isDarkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                onClick={() => handleChange('type', type)}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Distribution Pattern
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(['grid', 'spiral', 'wave', 'random'] as const).map(dist => (
              <button
                key={dist}
                className={`px-3 py-2 text-xs rounded-lg transition
                  ${params.distribution === dist
                    ? isDarkMode 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-indigo-100 text-indigo-800'
                    : isDarkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                onClick={() => handleChange('distribution', dist)}
              >
                {dist.charAt(0).toUpperCase() + dist.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Motion Pattern
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(['orbital', 'pulse', 'wave', 'scatter'] as const).map(motion => (
              <button
                key={motion}
                className={`px-3 py-2 text-xs rounded-lg transition
                  ${params.motionPattern === motion
                    ? isDarkMode 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-indigo-100 text-indigo-800'
                    : isDarkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                onClick={() => handleChange('motionPattern', motion)}
              >
                {motion.charAt(0).toUpperCase() + motion.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Color Scheme
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(['rainbow', 'monochrome', 'gradient', 'pastel'] as const).map(color => (
              <button
                key={color}
                className={`px-3 py-2 text-xs rounded-lg transition
                  ${params.colorScheme === color
                    ? isDarkMode 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-indigo-100 text-indigo-800'
                    : isDarkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                onClick={() => handleChange('colorScheme', color)}
              >
                {color.charAt(0).toUpperCase() + color.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <div className="flex justify-between">
            <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Count: {params.count}
            </label>
          </div>
          <input
            type="range"
            min="50"
            max="1000"
            step="50"
            value={params.count}
            onChange={(e) => handleChange('count', Number(e.target.value))}
            className="w-full h-1.5 bg-indigo-200 rounded-lg appearance-none cursor-pointer mt-1"
          />
        </div>
        
        <div>
          <div className="flex justify-between">
            <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Size: {params.size.toFixed(2)}
            </label>
          </div>
          <input
            type="range"
            min="0.05"
            max="0.4"
            step="0.01"
            value={params.size}
            onChange={(e) => handleChange('size', Number(e.target.value))}
            className="w-full h-1.5 bg-indigo-200 rounded-lg appearance-none cursor-pointer mt-1"
          />
        </div>
        
        <div>
          <div className="flex justify-between">
            <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Speed: {params.speed.toFixed(1)}x
            </label>
          </div>
          <input
            type="range"
            min="0.1"
            max="3.0"
            step="0.1"
            value={params.speed}
            onChange={(e) => handleChange('speed', Number(e.target.value))}
            className="w-full h-1.5 bg-indigo-200 rounded-lg appearance-none cursor-pointer mt-1"
          />
        </div>
        
        <div>
          <div className="flex justify-between">
            <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Rotation: {params.rotation}°
            </label>
          </div>
          <input
            type="range"
            min="0"
            max="360"
            step="5"
            value={params.rotation}
            onChange={(e) => handleChange('rotation', Number(e.target.value))}
            className="w-full h-1.5 bg-indigo-200 rounded-lg appearance-none cursor-pointer mt-1"
          />
        </div>
        
        <div>
          <div className="flex justify-between">
            <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Interactivity: {params.interactivity}
            </label>
          </div>
          <input
            type="range"
            min="0"
            max="10"
            step="1"
            value={params.interactivity}
            onChange={(e) => handleChange('interactivity', Number(e.target.value))}
            className="w-full h-1.5 bg-indigo-200 rounded-lg appearance-none cursor-pointer mt-1"
          />
        </div>
        
        <div className="pt-2">
          <button
            className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition
              ${isDarkMode
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                : 'bg-indigo-500 hover:bg-indigo-600 text-white'
              }`}
            onClick={() => {
              setParams(defaultParams);
              onShapeChange(defaultParams.type);
            }}
          >
            Reset to Default
          </button>
        </div>
      </div>
    </div>
  );
};

// Main ShapeArt scene component
const ShapeArtScene = ({ params, mousePos }: { params: ShapeParams, mousePos: THREE.Vector2 }) => {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <ShapeRenderer params={params} mousePos={mousePos} />
      <OrbitControls 
        enablePan={false} 
        enableZoom={true} 
        enableRotate={true}
        autoRotate={false}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 1.5}
      />
    </>
  );
};

// Main export component
type CircleArtProps = {
  onShapeChange: (shape: 'circle' | 'square' | 'triangle') => void;
};

export default function CircleArt({ onShapeChange }: CircleArtProps) {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [params, setParams] = useState<ShapeParams>(defaultParams);
  const [mousePos, setMousePos] = useState<THREE.Vector2>(new THREE.Vector2(0, 0));
  const [showShapeControls, setShowShapeControls] = useState(false);
  
  // Mouse movement handler
  const handleMouseMove = (event: React.MouseEvent) => {
    // Convert to normalized coordinates (-1 to 1)
    const x = (event.clientX / window.innerWidth) * 2 - 1;
    const y = -((event.clientY / window.innerHeight) * 2 - 1);
    setMousePos(new THREE.Vector2(x, y));
  };
  
  // Keyboard handler for toggling controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'h' || e.key === 'H') {
        setShowShapeControls(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  return (
    <div 
      className="w-full h-full relative overflow-hidden" 
      onMouseMove={handleMouseMove}
    >
      {/* Main Canvas */}
      <Canvas
        camera={{ position: [0, 0, 15], fov: 60 }}
        dpr={[1, 2]} // Responsive device pixel ratio
      >
        <color attach="background" args={[isDarkMode ? '#050912' : '#f8fafc']} />
        <ShapeArtScene params={params} mousePos={mousePos} />
        <AdaptiveDpr pixelated />
      </Canvas>
      
      {/* Show/Hide Controls Button */}
      <button
        onClick={() => setShowShapeControls(prev => !prev)}
        className={`absolute top-6 right-6 p-3 rounded-full ${
          isDarkMode ? 'bg-gray-800/80' : 'bg-white/80'
        } shadow-lg z-20 transition-all`}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke={isDarkMode ? 'white' : 'black'} 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          {showShapeControls ? (
            <path d="M15 15l-6-6M9 15l6-6" />
          ) : (
            <path d="M12 2L4.5 10 2 18l8 4 8-4-2.5-8z" />
          )}
        </svg>
      </button>
      
      {/* Controls - Only shown when toggled */}
      {showShapeControls && (
        <div className="absolute right-6 bottom-6 w-64 z-10">
          <ShapeArtControls 
            params={params} 
            setParams={setParams} 
            isDarkMode={isDarkMode} 
            onShapeChange={onShapeChange}
          />
        </div>
      )}
      
      {/* Instructions when controls are hidden */}
      {!showShapeControls && (
        <div className="absolute bottom-6 left-0 w-full flex justify-center">
          <div className="bg-black/40 backdrop-blur-md px-6 py-3 rounded-full text-white/90 text-sm font-medium">
            Press H to toggle shape controls | Mouse to interact
          </div>
        </div>
      )}
    </div>
  );
} 