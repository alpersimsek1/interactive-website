import { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, AdaptiveDpr, Sphere, Line, Torus, TorusKnot } from '@react-three/drei';
import * as THREE from 'three';

// Types for the generative art parameters
type ArtParams = {
  curveType: 'waves' | 'ribbons' | 'shell' | 'vortex';
  complexity: number; // 1-10
  amplitude: number; // 0.1-2.0
  frequency: number; // 0.1-5.0
  rotation: number; // 0-360
  monochrome: boolean;
  colorScheme: 'blue' | 'purple' | 'gray' | 'golden';
  density: number; // 10-100
};

// Default parameters
const defaultParams: ArtParams = {
  curveType: 'waves',
  complexity: 5,
  amplitude: 1.0,
  frequency: 1.0,
  rotation: 0,
  monochrome: true,
  colorScheme: 'gray',
  density: 50
};

// The ParametricSurface component that generates the actual geometries
const ParametricSurface = ({ params, time }: { params: ArtParams, time: number }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  // Generate points for the parametric surface based on parameters
  const { curves, colorPalette } = useMemo(() => {
    const curves: THREE.Vector3[][] = [];
    const colorPalette: THREE.Color[] = [];
    
    // Determine color palette based on scheme
    if (params.monochrome) {
      // Monochromatic palette with various shades
      switch (params.colorScheme) {
        case 'blue':
          for (let i = 0; i < 10; i++) {
            colorPalette.push(new THREE.Color().setHSL(0.6, 0.8, 0.2 + i * 0.08));
          }
          break;
        case 'purple':
          for (let i = 0; i < 10; i++) {
            colorPalette.push(new THREE.Color().setHSL(0.75, 0.8, 0.2 + i * 0.08));
          }
          break;
        case 'golden':
          for (let i = 0; i < 10; i++) {
            colorPalette.push(new THREE.Color().setHSL(0.12, 0.8, 0.2 + i * 0.08));
          }
          break;
        default: // gray
          for (let i = 0; i < 10; i++) {
            const value = 0.2 + i * 0.08;
            colorPalette.push(new THREE.Color(value, value, value));
          }
      }
    } else {
      // Color gradient based on scheme
      switch (params.colorScheme) {
        case 'blue':
          for (let i = 0; i < 10; i++) {
            colorPalette.push(new THREE.Color().setHSL(0.5 + i * 0.05, 0.7, 0.5));
          }
          break;
        case 'purple':
          for (let i = 0; i < 10; i++) {
            colorPalette.push(new THREE.Color().setHSL(0.7 + i * 0.03, 0.7, 0.5));
          }
          break;
        case 'golden':
          for (let i = 0; i < 10; i++) {
            colorPalette.push(new THREE.Color().setHSL(0.1 + i * 0.02, 0.7, 0.5));
          }
          break;
        default: // gray with subtle hue shifts
          for (let i = 0; i < 10; i++) {
            const value = 0.3 + i * 0.07;
            colorPalette.push(new THREE.Color(value, value, value));
          }
      }
    }
    
    // Generate curves based on type
    const segments = Math.floor(params.density * (params.complexity / 5));
    const getCurvePoints = (
      uStart: number, 
      uEnd: number, 
      vStart: number, 
      vEnd: number, 
      uCount: number, 
      vCount: number,
      generator: (u: number, v: number) => THREE.Vector3
    ) => {
      const points: THREE.Vector3[][] = [];
      
      for (let ui = 0; ui < uCount; ui++) {
        const u = uStart + (uEnd - uStart) * (ui / (uCount - 1));
        const curve: THREE.Vector3[] = [];
        
        for (let vi = 0; vi < vCount; vi++) {
          const v = vStart + (vEnd - vStart) * (vi / (vCount - 1));
          curve.push(generator(u, v));
        }
        
        points.push(curve);
      }
      
      return points;
    };
    
    const rotationRad = params.rotation * Math.PI / 180;
    const amp = params.amplitude;
    const freq = params.frequency;
    
    switch (params.curveType) {
      case 'waves': {
        // Wave-like surface with oscillations
        curves.push(...getCurvePoints(
          0, Math.PI * 2, 0, Math.PI * 2, 
          segments, Math.floor(segments / 2),
          (u, v) => {
            const x = (3 + Math.cos(u * freq) * Math.sin(v * freq) * amp) * Math.cos(u + rotationRad);
            const y = (3 + Math.cos(u * freq) * Math.sin(v * freq) * amp) * Math.sin(u + rotationRad);
            const z = Math.sin(u * freq) * amp + Math.cos(v * freq * 2) * amp;
            return new THREE.Vector3(x, y, z);
          }
        ));
        break;
      }
      case 'ribbons': {
        // Ribbon-like structures that fold and bend
        const ribbonCount = Math.floor(params.complexity * 1.5);
        for (let r = 0; r < ribbonCount; r++) {
          const phase = (r / ribbonCount) * Math.PI * 2;
          curves.push(...getCurvePoints(
            0, Math.PI * 2, 0, 1, 
            segments, 20,
            (u, v) => {
              const offset = r * 0.2;
              const width = 0.1 + v * 0.2;
              const x = (3 + Math.sin(u * freq + phase) * amp) * Math.cos(u + rotationRad);
              const y = (3 + Math.sin(u * freq + phase) * amp) * Math.sin(u + rotationRad);
              const z = Math.cos(u * freq * 2 + phase) * amp + offset;
              
              // Add perpendicular offset to create ribbon width
              const tangent = new THREE.Vector3(
                -Math.sin(u + rotationRad),
                Math.cos(u + rotationRad),
                0
              ).normalize();
              
              const normal = new THREE.Vector3(0, 0, 1);
              const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();
              
              // Offset perpendicular to the curve
              const perpOffset = binormal.multiplyScalar((v - 0.5) * width);
              
              return new THREE.Vector3(x, y, z).add(perpOffset);
            }
          ));
        }
        break;
      }
      case 'shell': {
        // Logarithmic spiral shell-like structure
        curves.push(...getCurvePoints(
          0, Math.PI * 8, 0, Math.PI * 2, 
          segments, Math.floor(segments / 3),
          (u, v) => {
            const a = amp * 0.3;
            const b = 0.15 * freq;
            const r = a * Math.exp(b * u);
            
            const x = r * Math.cos(u + rotationRad);
            const y = r * Math.sin(u + rotationRad);
            const z = r * Math.sin(v) * params.complexity * 0.05;
            
            return new THREE.Vector3(x, y, z);
          }
        ));
        break;
      }
      case 'vortex': {
        // Vortex with twisted planes
        const maxRadius = 5 * amp;
        curves.push(...getCurvePoints(
          0, 1, 0, Math.PI * 2, 
          segments, Math.floor(segments / 2),
          (u, v) => {
            const radius = u * maxRadius;
            const twist = u * params.complexity * Math.PI;
            
            const x = radius * Math.cos(v + twist + rotationRad);
            const y = radius * Math.sin(v + twist + rotationRad);
            const z = (1 - u) * 3 * amp * Math.sin(v * freq * 2) * Math.cos(v * freq * 2);
            
            return new THREE.Vector3(x, y, z);
          }
        ));
        break;
      }
    }
    
    return { curves, colorPalette };
  }, [params]);
  
  useFrame((state, delta) => {
    if (groupRef.current) {
      // Slowly rotate the entire structure for subtle animation
      groupRef.current.rotation.y += delta * 0.1;
      groupRef.current.rotation.x = Math.sin(time * 0.1) * 0.1;
    }
  });
  
  return (
    <group ref={groupRef}>
      {curves.map((curve, curveIndex) => (
        <line key={`curve-${curveIndex}`}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={curve.length}
              array={new Float32Array(curve.flatMap(v => [v.x, v.y, v.z]))}
              itemSize={3}
              args={[new Float32Array(curve.flatMap(v => [v.x, v.y, v.z])), 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial
            color={colorPalette[curveIndex % colorPalette.length]}
            linewidth={1}
            transparent
            opacity={0.8}
          />
        </line>
      ))}
      {curves.map((curve, curveIndex) => 
        curve.map((point, pointIndex) => 
          // Only render a subset of points to avoid performance issues
          (pointIndex % 4 === 0 && curveIndex % 2 === 0) ? (
            <mesh 
              key={`point-${curveIndex}-${pointIndex}`} 
              position={point}
              scale={0.05}
            >
              <sphereGeometry args={[1, 8, 8]} />
              <meshBasicMaterial 
                color={colorPalette[(curveIndex + 1) % colorPalette.length]} 
                transparent 
                opacity={0.7}
              />
            </mesh>
          ) : null
        )
      )}
    </group>
  );
};

// The main scene component with camera controls
const GenerativeArtScene = ({ params }: { params: ArtParams }) => {
  const timeRef = useRef(0);
  
  useFrame((state, delta) => {
    timeRef.current += delta;
  });
  
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <ParametricSurface params={params} time={timeRef.current} />
      <OrbitControls enablePan={false} enableZoom={true} enableRotate={true} />
    </>
  );
};

// Controls component for the UI
type ControlsProps = {
  params: ArtParams;
  setParams: React.Dispatch<React.SetStateAction<ArtParams>>;
  isDarkMode: boolean;
};

const GenerativeArtControls = ({ params, setParams, isDarkMode }: ControlsProps) => {
  const handleChange = (key: keyof ArtParams, value: any) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };
  
  return (
    <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-800/80' : 'bg-gray-100/80'} backdrop-filter backdrop-blur-sm`}>
      <div className="space-y-4">
        <div>
          <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Style
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(['waves', 'ribbons', 'shell', 'vortex'] as const).map(type => (
              <button
                key={type}
                className={`px-3 py-2 text-xs rounded-lg transition
                  ${params.curveType === type
                    ? isDarkMode 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-indigo-100 text-indigo-800'
                    : isDarkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                onClick={() => handleChange('curveType', type)}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <div className="flex justify-between">
            <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Complexity: {params.complexity}
            </label>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            step="1"
            value={params.complexity}
            onChange={(e) => handleChange('complexity', Number(e.target.value))}
            className="w-full h-1.5 bg-indigo-200 rounded-lg appearance-none cursor-pointer mt-1"
          />
        </div>
        
        <div>
          <div className="flex justify-between">
            <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Amplitude: {params.amplitude.toFixed(1)}
            </label>
          </div>
          <input
            type="range"
            min="0.1"
            max="2.0"
            step="0.1"
            value={params.amplitude}
            onChange={(e) => handleChange('amplitude', Number(e.target.value))}
            className="w-full h-1.5 bg-indigo-200 rounded-lg appearance-none cursor-pointer mt-1"
          />
        </div>
        
        <div>
          <div className="flex justify-between">
            <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Frequency: {params.frequency.toFixed(1)}
            </label>
          </div>
          <input
            type="range"
            min="0.1"
            max="5.0"
            step="0.1"
            value={params.frequency}
            onChange={(e) => handleChange('frequency', Number(e.target.value))}
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
              Density: {params.density}
            </label>
          </div>
          <input
            type="range"
            min="10"
            max="100"
            step="5"
            value={params.density}
            onChange={(e) => handleChange('density', Number(e.target.value))}
            className="w-full h-1.5 bg-indigo-200 rounded-lg appearance-none cursor-pointer mt-1"
          />
        </div>
        
        <div>
          <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Color Mode
          </label>
          <div className="flex gap-2">
            <button
              className={`flex-1 px-3 py-2 text-xs rounded-lg transition
                ${params.monochrome
                  ? isDarkMode 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-indigo-100 text-indigo-800'
                  : isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              onClick={() => handleChange('monochrome', true)}
            >
              Monochrome
            </button>
            <button
              className={`flex-1 px-3 py-2 text-xs rounded-lg transition
                ${!params.monochrome
                  ? isDarkMode 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-indigo-100 text-indigo-800'
                  : isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              onClick={() => handleChange('monochrome', false)}
            >
              Color
            </button>
          </div>
        </div>
        
        <div>
          <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Color Scheme
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(['gray', 'blue', 'purple', 'golden'] as const).map(scheme => (
              <button
                key={scheme}
                className={`px-3 py-2 text-xs rounded-lg transition
                  ${params.colorScheme === scheme
                    ? isDarkMode 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-indigo-100 text-indigo-800'
                    : isDarkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                onClick={() => handleChange('colorScheme', scheme)}
              >
                {scheme.charAt(0).toUpperCase() + scheme.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        <div className="pt-2">
          <button
            className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition
              ${isDarkMode
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                : 'bg-indigo-500 hover:bg-indigo-600 text-white'
              }`}
            onClick={() => setParams(defaultParams)}
          >
            Reset to Default
          </button>
        </div>
      </div>
    </div>
  );
};

// Main export component
export default function MathPatterns() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [params, setParams] = useState<ArtParams>(defaultParams);
  
  return (
    <div className="w-full h-full relative overflow-hidden">
      {/* Main Canvas */}
      <Canvas
        camera={{ position: [0, 0, 10], fov: 50 }}
        dpr={[1, 2]} // Responsive device pixel ratio
      >
        <color attach="background" args={[isDarkMode ? '#050912' : '#f8fafc']} />
        <GenerativeArtScene params={params} />
        <AdaptiveDpr pixelated />
      </Canvas>
      
      {/* Controls - Positioned in bottom left */}
      <div className="absolute left-6 bottom-6 w-64 z-10">
        <GenerativeArtControls 
          params={params} 
          setParams={setParams} 
          isDarkMode={isDarkMode} 
        />
      </div>
    </div>
  );
} 