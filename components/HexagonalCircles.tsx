import { useRef, useEffect, useState } from 'react';

// Define interface for face data
interface FaceData {
  vertices: number[];
  center: [number, number, number];
  isPentagon: boolean;
}

export default function HexagonalCircles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const wormholeRef = useRef<number>(0);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isClicking, setIsClicking] = useState(false);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions
    const resizeCanvas = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    };
    
    // Handle mouse events
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    };
    
    const handleMouseDown = () => {
      setIsClicking(true);
    };
    
    const handleMouseUp = () => {
      setIsClicking(false);
    };
    
    const handleMouseLeave = () => {
      setIsClicking(false);
    };
    
    // Add event listeners
    window.addEventListener('resize', resizeCanvas);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    
    resizeCanvas();
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Animation variables
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) * 0.4;
    
    // Create geodesic sphere
    const { vertices, faces } = createGeodesicSphere(2); // Level 2 subdivision
    
    // Animation loop
    const animate = () => {
      // Clear canvas with solid black background
      ctx.fillStyle = 'rgba(0, 0, 0, 1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Update time
      timeRef.current += 0.003;
      const time = timeRef.current;
      
      // Update wormhole effect
      if (isClicking) {
        wormholeRef.current = Math.min(1, wormholeRef.current + 0.03);
      } else {
        wormholeRef.current = Math.max(0, wormholeRef.current - 0.02);
      }
      
      // Calculate mouse influence
      const mouseInfluence = isClicking ? 0.5 : 0.2;
      const mouseDistanceX = (mousePos.x - centerX) / (canvas.width / 2);
      const mouseDistanceY = (mousePos.y - centerY) / (canvas.height / 2);
      
      // 3D rotation based on mouse position and time
      const rotationX = time * 0.1 + mouseDistanceY * mouseInfluence * 2;
      const rotationY = time * 0.15 + mouseDistanceX * mouseInfluence * 2;
      const rotationZ = isClicking ? time * 0.05 : 0;
      
      // Draw wormhole effect if active
      if (wormholeRef.current > 0) {
        try {
          drawWormholeEffect(ctx, centerX, centerY, radius, time, wormholeRef.current);
        } catch (error) {
          console.error("Error in wormhole effect:", error);
        }
      }
      
      // Draw the geodesic sphere
      drawGeodesicSphere(
        ctx,
        centerX,
        centerY,
        radius,
        vertices,
        faces,
        rotationX,
        rotationY,
        rotationZ,
        wormholeRef.current
      );
      
      // Continue animation
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    // Start animation
    animate();
    
    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [mousePos, isClicking]);
  
  // Create a geodesic sphere by subdividing an icosahedron
  const createGeodesicSphere = (subdivisions: number) => {
    // Golden ratio for icosahedron
    const phi = (1 + Math.sqrt(5)) / 2;
    
    // Icosahedron vertices (normalized)
    const baseVertices = [
      [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
      [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
      [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1]
    ].map(([x, y, z]) => normalize([x, y, z]));
    
    // Icosahedron faces (20 triangular faces)
    const baseFaces = [
      [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
      [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
      [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
      [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]
    ];
    
    // Subdivide the icosahedron
    let vertices = [...baseVertices];
    let faces = [...baseFaces];
    
    // Helper function to get midpoint of two vertices
    const getMidpoint = (a: number, b: number, vertexMap: Map<string, number>, currentVertices: number[][]) => {
      // Ensure consistent key regardless of vertex order
      const key = a < b ? `${a}-${b}` : `${b}-${a}`;
      
      if (vertexMap.has(key)) {
        return vertexMap.get(key)!;
      }
      
      // Calculate midpoint and normalize to sphere
      const va = currentVertices[a];
      const vb = currentVertices[b];
      const midpoint = normalize([
        (va[0] + vb[0]) / 2,
        (va[1] + vb[1]) / 2,
        (va[2] + vb[2]) / 2
      ]);
      
      // Add new vertex
      const index = currentVertices.length;
      currentVertices.push(midpoint);
      vertexMap.set(key, index);
      
      return index;
    };
    
    // Perform subdivision
    for (let i = 0; i < subdivisions; i++) {
      const newFaces = [];
      const vertexMap = new Map<string, number>();
      
      for (const face of faces) {
        const [a, b, c] = face;
        
        // Get midpoints
        const ab = getMidpoint(a, b, vertexMap, vertices);
        const bc = getMidpoint(b, c, vertexMap, vertices);
        const ca = getMidpoint(c, a, vertexMap, vertices);
        
        // Create 4 new faces
        newFaces.push([a, ab, ca]);
        newFaces.push([b, bc, ab]);
        newFaces.push([c, ca, bc]);
        newFaces.push([ab, bc, ca]);
      }
      
      faces = newFaces;
    }
    
    return { vertices, faces };
  };
  
  // Normalize a vector to unit length
  const normalize = (v: number[]): number[] => {
    const length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    return [v[0] / length, v[1] / length, v[2] / length];
  };
  
  // Draw wormhole effect
  const drawWormholeEffect = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    radius: number,
    time: number,
    intensity: number
  ) => {
    // Draw concentric circles for wormhole effect
    const maxCircles = 15;
    const circleSpacing = radius / maxCircles;
    
    // Create a gradient from center to edge
    const gradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, radius * intensity
    );
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(0.5, 'rgba(20, 100, 150, 0.2)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    // Draw wormhole background
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * intensity, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw concentric circles
    for (let i = 0; i < maxCircles; i++) {
      const circleRadius = i * circleSpacing * intensity;
      const alpha = 0.5 - (i / maxCircles) * 0.4;
      
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(centerX, centerY, circleRadius, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    // Draw stars in the wormhole
    const starCount = Math.floor(100 * intensity);
    
    for (let i = 0; i < starCount; i++) {
      // Calculate star position in polar coordinates
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * radius * intensity;
      
      // Convert to cartesian coordinates
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;
      
      // Star size and brightness based on distance from center
      const normalizedDistance = distance / (radius * intensity);
      const starSize = 1 + Math.random() * 2 * (1 - normalizedDistance);
      const brightness = 0.5 + 0.5 * (1 - normalizedDistance);
      
      // Draw the star
      ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
      ctx.beginPath();
      ctx.arc(x, y, starSize, 0, Math.PI * 2);
      ctx.fill();
    }
  };
  
  // Draw the geodesic sphere
  const drawGeodesicSphere = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    radius: number,
    vertices: number[][],
    faces: number[][],
    rotationX: number,
    rotationY: number,
    rotationZ: number,
    wormholeIntensity: number
  ) => {
    // Apply 3D rotation to vertices
    const rotatedVertices = vertices.map(vertex => {
      let [x, y, z] = vertex;
      
      // Apply rotation around X axis
      const y1 = y * Math.cos(rotationX) - z * Math.sin(rotationX);
      const z1 = y * Math.sin(rotationX) + z * Math.cos(rotationX);
      
      // Apply rotation around Y axis
      const x2 = x * Math.cos(rotationY) + z1 * Math.sin(rotationY);
      const z2 = -x * Math.sin(rotationY) + z1 * Math.cos(rotationY);
      
      // Apply rotation around Z axis
      const x3 = x2 * Math.cos(rotationZ) - y1 * Math.sin(rotationZ);
      const y3 = x2 * Math.sin(rotationZ) + y1 * Math.cos(rotationZ);
      
      return [x3, y3, z2];
    });
    
    // Calculate face depths for sorting
    const faceDepths = faces.map(face => {
      // Calculate average z-coordinate for depth sorting
      let avgZ = 0;
      for (const vertexIndex of face) {
        avgZ += rotatedVertices[vertexIndex][2];
      }
      avgZ /= face.length;
      
      return { face, avgZ };
    });
    
    // Sort faces by depth (back to front)
    faceDepths.sort((a, b) => a.avgZ - b.avgZ);
    
    // Draw faces
    for (const { face, avgZ } of faceDepths) {
      // Project vertices to 2D
      const projectedVertices = face.map(vertexIndex => {
        const [x, y, z] = rotatedVertices[vertexIndex];
        
        // Apply perspective projection
        const scale = 1.5 / (2 + z);
        
        // Apply wormhole distortion if active
        let distortionX = 0;
        let distortionY = 0;
        
        if (wormholeIntensity > 0) {
          // Calculate distortion based on distance and wormhole intensity
          const distortionFactor = wormholeIntensity * 0.5 * (1 - Math.max(0, z));
          distortionX = -x * distortionFactor;
          distortionY = -y * distortionFactor;
        }
        
        // Apply projection with distortion
        const projX = centerX + (x + distortionX) * radius * scale;
        const projY = centerY + (y + distortionY) * radius * scale;
        
        return [projX, projY];
      });
      
      // Calculate brightness based on orientation
      const normalizedZ = (avgZ + 1) / 2;
      const brightness = 0.3 + 0.7 * normalizedZ;
      
      // Draw face
      ctx.beginPath();
      projectedVertices.forEach(([x, y], i) => {
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.closePath();
      
      // Fill face with color
      ctx.fillStyle = `rgba(255, 255, 255, ${brightness * 0.7})`;
      ctx.fill();
      
      // Draw edge
      ctx.strokeStyle = `rgba(255, 255, 255, ${brightness * 0.9})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  };
  
  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-full"
      style={{ background: 'black' }}
    />
  );
} 