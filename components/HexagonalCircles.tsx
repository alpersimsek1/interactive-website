import { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { AdaptiveDpr, Loader } from '@react-three/drei';
import * as THREE from 'three';

// Define types for the circle particle props
type CircleParticleProps = {
  position: [number, number, number];
  size: number;
  color: THREE.Color;
  opacity: number;
};

// Circle particle component that renders an individual circle in 3D space
const CircleParticle = ({ position, size, color, opacity }: CircleParticleProps) => {
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  
  return (
    <mesh position={position} renderOrder={position[2] * -1}>
      <circleGeometry args={[size, 16]} />
      <meshBasicMaterial 
        ref={materialRef}
        color={color}
        transparent={true}
        opacity={opacity}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
};

// Define types for the glowing ring props
type GlowingRingProps = {
  position: [number, number, number];
  size: number;
  color: THREE.Color;
  opacity: number;
  thickness?: number;
};

// Glowing ring component for larger particles
const GlowingRing = ({ position, size, color, opacity, thickness = 0.1 }: GlowingRingProps) => {
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  
  return (
    <mesh position={position} renderOrder={position[2] * -1}>
      <ringGeometry args={[size * 0.8, size * 0.8 + thickness, 32]} />
      <meshBasicMaterial 
        ref={materialRef}
        color={color}
        transparent={true}
        opacity={opacity * 0.7}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
};

// Grid lines for the vortex effect
const VortexGrid = ({ time, pageLoadProgress }: { time: number, pageLoadProgress: number }) => {
  const lineCount = 24; // Number of radial lines
  const ringCount = 12; // Number of concentric rings
  const maxRadius = 22; // Maximum radius of the grid
  const vortexDepth = -100; // How far the vortex extends
  
  // Generate points for grid lines based on current animation state
  const gridPoints = useMemo(() => {
    const radialLines = [];
    const concentricRings = [];
    
    // Calculate the animation progress - controls the vortex effect
    const shrinkProgress = pageLoadProgress;
    const vortexFactor = Math.max(0.01, 1 - shrinkProgress * 0.9);
    
    // Create radial lines (like spokes on a wheel)
    for (let i = 0; i < lineCount; i++) {
      const angle = (i / lineCount) * Math.PI * 2;
      const points = [];
      
      // Create points along the line with increasing Z depth
      for (let d = 0; d <= 100; d += 4) {
        const depthFactor = d / 100;
        const radius = maxRadius * (1 - depthFactor * vortexFactor);
        
        // Calculate coordinates with vortex effect
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        const z = vortexDepth * depthFactor;
        
        points.push(new THREE.Vector3(x, y, z));
      }
      
      radialLines.push(points);
    }
    
    // Create concentric rings at different depths
    for (let d = 0; d <= 100; d += 10) {
      const depthFactor = d / 100;
      const z = vortexDepth * depthFactor;
      const radius = maxRadius * (1 - depthFactor * vortexFactor);
      const points = [];
      
      // Create points around the circle
      for (let i = 0; i <= lineCount; i++) {
        const angle = (i / lineCount) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        
        points.push(new THREE.Vector3(x, y, z));
      }
      
      concentricRings.push(points);
    }
    
    return { radialLines, concentricRings };
  }, [pageLoadProgress, time]);
  
  return (
    <group>
      {/* Render radial lines */}
      {gridPoints.radialLines.map((points, i) => (
        <line key={`radial-${i}`}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={points.length}
              array={new Float32Array(points.flatMap(p => [p.x, p.y, p.z]))}
              itemSize={3}
              args={[new Float32Array(points.flatMap(p => [p.x, p.y, p.z])), 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial 
            color="#4060ff" 
            transparent 
            opacity={0.3} 
            linewidth={1}
          />
        </line>
      ))}
      
      {/* Render concentric rings */}
      {gridPoints.concentricRings.map((points, i) => (
        <line key={`ring-${i}`}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={points.length}
              array={new Float32Array(points.flatMap(p => [p.x, p.y, p.z]))}
              itemSize={3}
              args={[new Float32Array(points.flatMap(p => [p.x, p.y, p.z])), 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial 
            color="#4060ff" 
            transparent 
            opacity={0.4 - i * 0.03} 
            linewidth={1}
          />
        </line>
      ))}
    </group>
  );
};

// Geodesic Sphere that animates by shrinking
const GeoDome = ({ time, isClicking, pageLoadProgress }: { time: number, isClicking: boolean, pageLoadProgress: number }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  
  // Animation for shrinking effect based on page load progress
  const shrinkProgress = useMemo(() => {
    return Math.min(1, pageLoadProgress * 1.2); // Slightly faster than page load
  }, [pageLoadProgress]);
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      // Rotate the geodesic sphere slowly
      meshRef.current.rotation.y += delta * 0.2 * (isClicking ? 1.5 : 1);
      meshRef.current.rotation.z += delta * 0.1 * (isClicking ? 1.5 : 1);
      
      // Pulse effect only during initial shrinking
      if (shrinkProgress < 0.8) {
        const pulseFactor = 1 + Math.sin(time * 3) * 0.05 * (1 - shrinkProgress);
        const baseScale = 18 * (1 - shrinkProgress * 0.9); // Shrink from large to small
        meshRef.current.scale.set(
          baseScale * pulseFactor, 
          baseScale * pulseFactor, 
          baseScale * pulseFactor
        );
      }
    }
    
    // Pulse the material based on clicking and animation progress
    if (materialRef.current) {
      materialRef.current.emissiveIntensity = isClicking ? 
        1.5 : 
        0.8 + Math.sin(time * 2) * 0.2 * (1 - shrinkProgress);
      
      // Update wireframe opacity based on shrinking progress
      materialRef.current.opacity = 0.9 - shrinkProgress * 0.6;
    }
  });
  
  // As it shrinks, move it deeper into the scene to enhance the vortex effect
  const zPosition = -20 - shrinkProgress * 30;
  
  return (
    <mesh 
      ref={meshRef} 
      position={[0, 0, zPosition]}
    >
      <icosahedronGeometry args={[1, 2]} />
      <meshStandardMaterial 
        ref={materialRef}
        color="#4080ff"
        wireframe={true}
        emissive="#2040ff"
        emissiveIntensity={0.8}
        transparent
        opacity={0.7}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

// Define props for the HexagonalCircles component
type HexagonalCirclesProps = {
  particleCount?: number;
  particleSpeed?: number;
};

// Define type for circle data
type CircleData = {
  position: [number, number, number];
  initialDistance: number;
  angle: number;
  size: number;
  speed: number;
  color: THREE.Color;
  opacity: number;
  hasRing: boolean;
  spawnTime: number; // When the circle should spawn
  cornerDirection: number; // Which corner this particle moves toward (0-3)
  active: boolean; // Whether this particle is currently active
  previousPositions?: [number, number, number][]; // Track positions for trail effect
};

// Define type for the cosmic tunnel props
type CosmicTunnelProps = {
  isClicking: boolean;
  pageLoadProgress: number;
};

// Main scene containing the geodesic sphere and circles in the cosmic vortex
const CosmicTunnel = ({ isClicking, pageLoadProgress, particleCount = 500, particleSpeed = 1.0 }: CosmicTunnelProps & { particleCount: number, particleSpeed: number }) => {
  const { camera, viewport } = useThree();
  const circlesRef = useRef<CircleData[]>([]);
  const groupRef = useRef<THREE.Group>(null);
  const [colorCycle, setColorCycle] = useState(0);
  const timeRef = useRef(0);
  const trailsEnabledRef = useRef(true); // Enable trails by default
  
  // Set initial camera position
  useEffect(() => {
    camera.position.z = 10;
    // Use type assertion for the camera since we know it's a PerspectiveCamera
    (camera as THREE.PerspectiveCamera).fov = 75;
    camera.updateProjectionMatrix();
  }, [camera]);
  
  // Initialize circles for the tunnel - recreate when particle count changes
  useEffect(() => {
    const circles: CircleData[] = [];
    
    for (let i = 0; i < particleCount; i++) {
      // Stagger spawn times but ensure more particles appear quickly
      const spawnTime = Math.random() * 0.5; // Faster spawning
      
      // Determine a starting position - particles start from different screen regions
      // Instead of all starting from the center, distribute them across the scene
      const startingZone = Math.floor(Math.random() * 5); // 0-4 different zones
      let x = 0, y = 0, z = -80 - Math.random() * 50; // Default deeper in scene but not too far
      
      if (startingZone === 0) {
        // Center zone - more particles start here
        x = (Math.random() * 2 - 1) * 10;
        y = (Math.random() * 2 - 1) * 10;
      } else if (startingZone === 1) {
        // Top quadrant
        x = (Math.random() * 2 - 1) * 15;
        y = 5 + Math.random() * 10;
      } else if (startingZone === 2) {
        // Bottom quadrant
        x = (Math.random() * 2 - 1) * 15;
        y = -5 - Math.random() * 10;
      } else if (startingZone === 3) {
        // Left quadrant
        x = -5 - Math.random() * 10;
        y = (Math.random() * 2 - 1) * 15;
      } else {
        // Right quadrant
        x = 5 + Math.random() * 10;
        y = (Math.random() * 2 - 1) * 15;
      }
      
      // Determine which corner is closest to this particle's starting position
      let cornerDirection = 0;
      if (x <= 0 && y <= 0) cornerDirection = 2; // bottom-left
      else if (x <= 0 && y > 0) cornerDirection = 1; // top-left
      else if (x > 0 && y <= 0) cornerDirection = 3; // bottom-right
      else cornerDirection = 0; // top-right
      
      // Calculate angle for spiral movement
      const angle = Math.atan2(y, x);
      
      circles.push({
        position: [x, y, z],
        initialDistance: Math.sqrt(x*x + y*y),
        angle: angle,
        size: 0.1 + Math.random() * 0.2, // Increased size for better visibility
        speed: 2 + Math.random() * 3, // Base speed that will be multiplied by particleSpeed
        color: new THREE.Color().setHSL(Math.random() * 0.1 + 0.6, 1, 0.5 + Math.random() * 0.5),
        opacity: 0.3 + Math.random() * 0.7, // Higher base opacity
        hasRing: Math.random() > 0.9, // 10% of particles have rings
        spawnTime: spawnTime, // When this circle should appear
        cornerDirection: cornerDirection, // The corner this particle moves toward
        active: true, // Start all particles as active immediately
        previousPositions: [] // Track previous positions for trail effect
      });
    }
    
    circlesRef.current = circles;
  }, [particleCount]); // Re-initialize when particle count changes
  
  // Animation logic with frame updates
  useFrame((state, delta) => {
    timeRef.current += delta;
    const time = timeRef.current;
    
    // Update color cycle for dynamic colors
    setColorCycle((prev) => (prev + 20 * delta) % 360);
    
    // Speed boost when clicking
    const speedMultiplier = isClicking ? 2.5 : 1.0;
    
    // Apply the user-controlled speed multiplier
    const finalSpeedMultiplier = speedMultiplier * particleSpeed;
    
    // Update each circle in the tunnel
    circlesRef.current.forEach((circle, i) => {
      // Store previous position for trail effect
      if (trailsEnabledRef.current && circle.previousPositions) {
        // Keep a limited history of previous positions
        if (circle.previousPositions.length >= 5) {
          circle.previousPositions.pop(); // Remove oldest
        }
        // Add current position to the front
        circle.previousPositions.unshift([...circle.position]);
      }
      
      // Move circle forward (toward viewer) with gradually increasing speed
      circle.position[2] += circle.speed * finalSpeedMultiplier * delta;
      
      // Calculate distanceFactor - how close is it to viewer?
      const distanceFactor = Math.min(1, Math.max(0, (circle.position[2] + 100) / 110));
      
      // Simplified corner-directed movement - more efficient
      switch(circle.cornerDirection) {
        case 0: // Top-right
          circle.position[0] += delta * (4 + distanceFactor * 8) * particleSpeed;
          circle.position[1] += delta * (4 + distanceFactor * 8) * particleSpeed;
          break;
        case 1: // Top-left
          circle.position[0] -= delta * (4 + distanceFactor * 8) * particleSpeed;
          circle.position[1] += delta * (4 + distanceFactor * 8) * particleSpeed;
          break;
        case 2: // Bottom-left
          circle.position[0] -= delta * (4 + distanceFactor * 8) * particleSpeed;
          circle.position[1] -= delta * (4 + distanceFactor * 8) * particleSpeed;
          break;
        case 3: // Bottom-right
          circle.position[0] += delta * (4 + distanceFactor * 8) * particleSpeed;
          circle.position[1] -= delta * (4 + distanceFactor * 8) * particleSpeed;
          break;
      }
      
      // Reset circle if it passes the camera or goes too far off-screen
      if (circle.position[2] > 15 || Math.abs(circle.position[0]) > 40 || Math.abs(circle.position[1]) > 30) {
        // Instead of resetting to center, pick a new random starting position
        const startingZone = Math.floor(Math.random() * 5);
        
        if (startingZone === 0) {
          // Center zone
          circle.position[0] = (Math.random() * 2 - 1) * 10;
          circle.position[1] = (Math.random() * 2 - 1) * 10;
        } else if (startingZone === 1) {
          // Top quadrant
          circle.position[0] = (Math.random() * 2 - 1) * 15;
          circle.position[1] = 5 + Math.random() * 10;
        } else if (startingZone === 2) {
          // Bottom quadrant
          circle.position[0] = (Math.random() * 2 - 1) * 15;
          circle.position[1] = -5 - Math.random() * 10;
        } else if (startingZone === 3) {
          // Left quadrant
          circle.position[0] = -5 - Math.random() * 10;
          circle.position[1] = (Math.random() * 2 - 1) * 15;
        } else {
          // Right quadrant
          circle.position[0] = 5 + Math.random() * 10;
          circle.position[1] = (Math.random() * 2 - 1) * 15;
        }
        
        // Reset Z position - not too far back
        circle.position[2] = -80 - Math.random() * 30;
        
        // Recalculate which corner is closest
        if (circle.position[0] <= 0 && circle.position[1] <= 0) circle.cornerDirection = 2; // bottom-left
        else if (circle.position[0] <= 0 && circle.position[1] > 0) circle.cornerDirection = 1; // top-left
        else if (circle.position[0] > 0 && circle.position[1] <= 0) circle.cornerDirection = 3; // bottom-right
        else circle.cornerDirection = 0; // top-right
        
        // Calculate new angle
        circle.angle = Math.atan2(circle.position[1], circle.position[0]);
        
        // Update appearance
        circle.size = 0.1 + Math.random() * 0.2;
        circle.opacity = 0.3 + Math.random() * 0.7;
        circle.hasRing = Math.random() > 0.9;
        
        // Update color based on color cycle
        const hue = ((colorCycle + Math.random() * 60) % 360) / 360;
        circle.color = new THREE.Color().setHSL(hue, 1, 0.5 + Math.random() * 0.5);
        
        // Clear previous positions when resetting
        if (circle.previousPositions) {
          circle.previousPositions = [];
        }
      }
    });
  });
  
  return (
    <>
      {/* Add ambient and directional light for 3D objects */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[0, 0, 5]} intensity={0.5} color="#ffffff" />
      <pointLight position={[0, 0, -40]} intensity={3} color="#4060ff" distance={80} />
      
      {/* Add vortex grid structure */}
      <VortexGrid time={timeRef.current} pageLoadProgress={pageLoadProgress} />
      
      {/* Add geodesic dome structure */}
      <GeoDome time={timeRef.current} isClicking={isClicking} pageLoadProgress={pageLoadProgress} />
      
      {/* Circle particles group */}
      <group ref={groupRef}>
        {circlesRef.current.map((circle, i) => {
          // Calculate fixed size with better distance-based scaling
          const distanceToCamera = 15 - circle.position[2];
          // More pronounced scaling effect for better visibility
          const displayScale = Math.max(0.7, Math.min(2.5, 1 + 1.5 / Math.max(1, distanceToCamera)));
          const displaySize = circle.size * displayScale;
          
          // Skip very distant circles but not too aggressively
          if (circle.position[2] < -150) return null;
          
          // Calculate opacity based on z distance - brighter as they get closer
          const distanceFactor = Math.min(1, Math.max(0, (circle.position[2] + 100) / 100));
          const displayOpacity = circle.opacity * distanceFactor;
          
          // Only render if visible enough
          if (displayOpacity < 0.05) return null;
          
          return (
            <group key={i}>
              {/* Add trail behind particle */}
              {trailsEnabledRef.current && circle.previousPositions && circle.previousPositions.length > 1 && (
                <line>
                  <bufferGeometry>
                    <bufferAttribute
                      attach="attributes-position"
                      count={circle.previousPositions.length + 1}
                      array={new Float32Array([
                        ...circle.position,
                        ...circle.previousPositions.flatMap(p => p)
                      ])}
                      itemSize={3}
                      args={[new Float32Array([
                        ...circle.position,
                        ...circle.previousPositions.flatMap(p => p)
                      ]), 3]}
                    />
                  </bufferGeometry>
                  <lineBasicMaterial
                    color={circle.color}
                    transparent={true}
                    opacity={displayOpacity * 0.4}
                    linewidth={1}
                  />
                </line>
              )}
            
              <CircleParticle 
                position={circle.position}
                size={displaySize}
                color={circle.color}
                opacity={displayOpacity}
              />
              
              {/* Add glowing rings to only select particles for a subtle effect */}
              {circle.hasRing && distanceFactor > 0.3 && (
                <>
                  <GlowingRing
                    position={circle.position}
                    size={displaySize * 2.5}
                    color={circle.color}
                    opacity={displayOpacity * 0.6} // More visible rings
                    thickness={displaySize * 0.8}
                  />
                </>
              )}
            </group>
          );
        })}
      </group>
    </>
  );
};

// Cosmic tunnel visualization with Three.js
export default function HexagonalCircles({ particleCount = 500, particleSpeed = 1.0 }: HexagonalCirclesProps) {
  const [isClicking, setIsClicking] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  
  // Handle page load animation
  useEffect(() => {
    // Animate the loading progress over 4 seconds for a more dramatic effect
    const duration = 4000;
    const startTime = Date.now();
    
    const animateLoading = () => {
      const elapsed = Date.now() - startTime;
      // Use easing function for smoother animation
      const progress = Math.min(1, elapsed / duration);
      // Ease in-out cubic function for smoother animation
      const easedProgress = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      
      setLoadProgress(easedProgress);
      
      if (progress < 1) {
        requestAnimationFrame(animateLoading);
      }
    };
    
    requestAnimationFrame(animateLoading);
    
    return () => {
      // Cleanup if needed
    };
  }, []);
  
  // Handle mouse interactions
  const handlePointerDown = () => setIsClicking(true);
  const handlePointerUp = () => setIsClicking(false);
  const handlePointerLeave = () => setIsClicking(false);
  
  // Define the background color based on dark mode
  const bgColor = isDarkMode ? '#050014' : '#f0f4f8';
  
  return (
    <div 
      className="w-full h-full absolute inset-0"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
    >
      <Canvas
        camera={{ position: [0, 0, 10], fov: 75 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]} // Responsive device pixel ratio
      >
        <color attach="background" args={[bgColor]} />
        
        {/* Enhanced fog with greater depth */}
        <fog attach="fog" args={[bgColor, 30, 200]} />
        
        {/* Main cosmic tunnel component */}
        <CosmicTunnel 
          isClicking={isClicking} 
          pageLoadProgress={loadProgress} 
          particleCount={particleCount}
          particleSpeed={particleSpeed}
        />
        
        {/* Performance optimizations */}
        <AdaptiveDpr pixelated />
      </Canvas>
      
      {/* Loading indicator shown only during initial animation */}
      {loadProgress < 1 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-10">
          <div className="text-white text-center">
            <div className="text-2xl mb-4">Initializing Vortex Structure</div>
            <div className="w-64 h-2 bg-gray-800 rounded-full">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${loadProgress * 100}%` }}
              />
            </div>
            <div className="mt-2">{Math.round(loadProgress * 100)}%</div>
          </div>
        </div>
      )}
    </div>
  );
} 