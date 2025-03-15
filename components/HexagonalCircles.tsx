import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

export default function HexagonalCircles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const [mousePos, setMousePos] = useState<THREE.Vector2>(new THREE.Vector2(0, 0));
  const [isClicking, setIsClicking] = useState(false);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    // Handle mouse events
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos(new THREE.Vector2(e.clientX, e.clientY));
    };
    
    const handleMouseDown = () => {
      setIsClicking(true);
    };
    
    const handleMouseUp = () => {
      setIsClicking(false);
    };
    
    // Add event listeners
    window.addEventListener('resize', resizeCanvas);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    
    resizeCanvas();
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
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
    
    // Create geodesic sphere configuration
    const radius = Math.min(canvas.width, canvas.height) * 0.4;
    
    // Generate icosahedron vertices (12 vertices)
    const phi = (1 + Math.sqrt(5)) / 2; // Golden ratio
    const icosahedronVertices = [
      [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
      [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
      [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1]
    ].map(([x, y, z]) => normalizeVector(x, y, z));
    
    // Generate icosahedron faces (20 triangular faces)
    const icosahedronFaces = [
      [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
      [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
      [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
      [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]
    ];
    
    // Subdivide icosahedron to create geodesic structure
    const frequency = 3; // Subdivision frequency (higher = more detailed)
    const { vertices, faces } = subdivideIcosahedron(icosahedronVertices, icosahedronFaces, frequency);
    
    // Generate face centers and identify face type (pentagon or hexagon)
    const faceData = generateFaceData(vertices, faces);
    
    // Animation loop
    const animate = () => {
      // Clear canvas with solid background
      ctx.fillStyle = 'rgba(245, 245, 245, 1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Update time using ref to avoid state updates
      timeRef.current += 0.003;
      const time = timeRef.current;
      
      // Calculate mouse influence
      const mouseInfluence = isClicking ? 0.5 : 0.2;
      const mouseDistanceX = (mousePos.x - centerX) / (canvas.width / 2);
      const mouseDistanceY = (mousePos.y - centerY) / (canvas.height / 2);
      const mouseAngle = Math.atan2(mouseDistanceY, mouseDistanceX);
      const mouseDistance = Math.sqrt(mouseDistanceX * mouseDistanceX + mouseDistanceY * mouseDistanceY);
      
      // 3D rotation based on mouse position and time
      const rotationX = time * 0.1 + mouseDistanceY * mouseInfluence * 2;
      const rotationY = time * 0.15 + mouseDistanceX * mouseInfluence * 2;
      const rotationZ = isClicking ? time * 0.05 : 0;
      
      // Draw the geodesic structure
      drawGeodesicStructure(
        ctx, 
        centerX, 
        centerY, 
        radius, 
        vertices, 
        faceData, 
        rotationX, 
        rotationY, 
        rotationZ
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
  
  // Normalize a 3D vector to unit length
  const normalizeVector = (x: number, y: number, z: number): [number, number, number] => {
    const length = Math.sqrt(x * x + y * y + z * z);
    return [x / length, y / length, z / length];
  };
  
  // Subdivide an icosahedron to create a geodesic structure
  const subdivideIcosahedron = (
    vertices: [number, number, number][],
    faces: number[][],
    frequency: number
  ) => {
    // Create a cache for midpoint vertices to avoid duplicates
    const midpointCache: Record<string, number> = {};
    
    // Function to get or create a midpoint vertex
    const getMidpoint = (i1: number, i2: number): number => {
      // Ensure consistent ordering of indices
      const [a, b] = i1 < i2 ? [i1, i2] : [i2, i1];
      const key = `${a}-${b}`;
      
      if (midpointCache[key] !== undefined) {
        return midpointCache[key];
      }
      
      // Calculate midpoint
      const v1 = vertices[a];
      const v2 = vertices[b];
      const midpoint = normalizeVector(
        (v1[0] + v2[0]) / 2,
        (v1[1] + v2[1]) / 2,
        (v1[2] + v2[2]) / 2
      );
      
      // Add to vertices and cache
      const index = vertices.length;
      vertices.push(midpoint);
      midpointCache[key] = index;
      
      return index;
    };
    
    // Subdivide each face
    for (let f = 0; f < frequency; f++) {
      const newFaces: number[][] = [];
      
      for (const face of faces) {
        // Get the three vertices of the face
        const [a, b, c] = face;
        
        // Calculate midpoints
        const ab = getMidpoint(a, b);
        const bc = getMidpoint(b, c);
        const ca = getMidpoint(c, a);
        
        // Create four new faces
        newFaces.push([a, ab, ca]);
        newFaces.push([b, bc, ab]);
        newFaces.push([c, ca, bc]);
        newFaces.push([ab, bc, ca]);
      }
      
      faces = newFaces;
    }
    
    return { vertices, faces };
  };
  
  // Generate face data including centers and types (pentagon/hexagon)
  const generateFaceData = (
    vertices: [number, number, number][],
    faces: number[][]
  ) => {
    // Create a map to track vertex adjacency
    const vertexFaces: Record<number, number[]> = {};
    
    // Map faces to vertices
    faces.forEach((face, faceIndex) => {
      face.forEach(vertexIndex => {
        if (!vertexFaces[vertexIndex]) {
          vertexFaces[vertexIndex] = [];
        }
        vertexFaces[vertexIndex].push(faceIndex);
      });
    });
    
    // Generate face centers and identify face types
    const faceData = faces.map(face => {
      // Calculate face center
      const center = [0, 0, 0];
      face.forEach(vertexIndex => {
        const vertex = vertices[vertexIndex];
        center[0] += vertex[0];
        center[1] += vertex[1];
        center[2] += vertex[2];
      });
      
      center[0] /= face.length;
      center[1] /= face.length;
      center[2] /= face.length;
      
      // Normalize center to lie on the sphere
      const normalizedCenter = normalizeVector(center[0], center[1], center[2]);
      
      // Determine if this is a pentagon or hexagon
      // In a geodesic dome, 12 vertices will have 5 adjacent faces (pentagons)
      // The rest will have 6 adjacent faces (hexagons)
      const isPentagon = face.some(vertexIndex => {
        // Original icosahedron vertices become pentagons
        return vertexIndex < 12;
      });
      
      return {
        center: normalizedCenter,
        vertices: face.map(index => vertices[index]),
        isPentagon
      };
    });
    
    return faceData;
  };
  
  // Apply 3D rotation to a point
  const rotatePoint = (
    point: [number, number, number],
    rotationX: number,
    rotationY: number,
    rotationZ: number
  ): [number, number, number] => {
    let [x, y, z] = point;
    
    // Rotate around X axis
    const cosX = Math.cos(rotationX);
    const sinX = Math.sin(rotationX);
    const y1 = y * cosX - z * sinX;
    const z1 = y * sinX + z * cosX;
    
    // Rotate around Y axis
    const cosY = Math.cos(rotationY);
    const sinY = Math.sin(rotationY);
    const x2 = x * cosY + z1 * sinY;
    const z2 = -x * sinY + z1 * cosY;
    
    // Rotate around Z axis
    const cosZ = Math.cos(rotationZ);
    const sinZ = Math.sin(rotationZ);
    const x3 = x2 * cosZ - y1 * sinZ;
    const y3 = x2 * sinZ + y1 * cosZ;
    
    return [x3, y3, z2];
  };
  
  // Project a 3D point to 2D screen coordinates
  const projectPoint = (
    point: [number, number, number],
    centerX: number,
    centerY: number,
    radius: number
  ): [number, number, number] => {
    const [x, y, z] = point;
    
    // Simple perspective projection
    const scale = radius / (2 + z);
    const screenX = centerX + x * scale;
    const screenY = centerY + y * scale;
    
    // Return screen coordinates and depth (z) for sorting
    return [screenX, screenY, z];
  };
  
  // Draw the geodesic structure
  const drawGeodesicStructure = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    radius: number,
    vertices: [number, number, number][],
    faceData: any[],
    rotationX: number,
    rotationY: number,
    rotationZ: number
  ) => {
    // Sort faces by depth (painter's algorithm)
    const sortedFaces = [...faceData].map(face => {
      // Rotate the center point
      const rotatedCenter = rotatePoint(face.center, rotationX, rotationY, rotationZ);
      // Project to screen coordinates
      const [screenX, screenY, depth] = projectPoint(rotatedCenter, centerX, centerY, radius);
      
      return {
        ...face,
        screenCenter: [screenX, screenY],
        depth
      };
    }).sort((a, b) => a.depth - b.depth);
    
    // Draw faces from back to front
    sortedFaces.forEach(face => {
      const { vertices, isPentagon, screenCenter, depth } = face;
      
      // Calculate screen coordinates for each vertex
      const screenVertices = vertices.map((vertex: [number, number, number]) => {
        const rotated = rotatePoint(vertex, rotationX, rotationY, rotationZ);
        const [x, y] = projectPoint(rotated, centerX, centerY, radius);
        return [x, y];
      });
      
      // Draw the face
      drawPolygon(
        ctx,
        screenVertices,
        screenCenter,
        isPentagon,
        depth
      );
    });
    
    // Draw connecting lines for structural effect
    drawConnectingLines(ctx, centerX, centerY, radius, rotationX, rotationY);
  };
  
  // Draw a polygon (pentagon or hexagon)
  const drawPolygon = (
    ctx: CanvasRenderingContext2D,
    vertices: [number, number][],
    center: [number, number],
    isPentagon: boolean,
    depth: number
  ) => {
    // Calculate visibility based on depth (front faces are more visible)
    const visibility = Math.max(0, Math.min(1, (depth + 1) * 0.5));
    
    // Set colors based on polygon type
    const hue = isPentagon ? 200 : 190; // Slightly different colors for pentagons/hexagons
    const saturation = 70 - visibility * 20; // Less saturated for back faces
    const lightness = 50 - visibility * 10; // Darker for back faces
    
    // Draw polygon
    ctx.beginPath();
    vertices.forEach(([x, y], i) => {
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    
    // Very subtle fill
    ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${0.05 + visibility * 0.1})`;
    ctx.fill();
    
    // Edge highlight
    ctx.strokeStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${0.4 + visibility * 0.4})`;
    ctx.lineWidth = 1 * (0.5 + visibility * 0.5);
    ctx.stroke();
    
    // Add subtle shadow for depth
    if (depth > 0) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
      ctx.shadowBlur = 2;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
    } else {
      ctx.shadowColor = 'transparent';
    }
  };
  
  // Draw connecting lines for structural effect
  const drawConnectingLines = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    radius: number,
    rotationX: number,
    rotationY: number
  ) => {
    // Create a few structural lines for visual effect
    const lineCount = 12; // 12 lines for the 12 vertices of the icosahedron
    
    for (let i = 0; i < lineCount; i++) {
      // Calculate angles based on icosahedron vertices
      const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle
      const y = 1 - (i / (lineCount - 1)) * 2; // y goes from 1 to -1
      const radius2 = Math.sqrt(1 - y * y); // radius at y
      const theta = phi * i; // golden angle increment
      
      // Calculate 3D point on the sphere
      const x = Math.cos(theta) * radius2;
      const z = Math.sin(theta) * radius2;
      
      // Rotate the point
      const [rx, ry, rz] = rotatePoint([x, y, z], rotationX, rotationY, 0);
      
      // Project to screen coordinates
      const innerRadius = radius * 0.2;
      const outerRadius = radius * 1.05;
      
      // Only draw lines that are somewhat visible (facing forward)
      if (rz > -0.2) {
        // Calculate screen coordinates
        const [x1, y1] = projectPoint([rx * 0.2, ry * 0.2, rz * 0.2], centerX, centerY, radius);
        const [x2, y2] = projectPoint([rx, ry, rz], centerX, centerY, radius);
        
        // Draw the line with subtle color
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = `rgba(30, 120, 160, ${0.1 + Math.max(0, rz) * 0.2})`;
        ctx.lineWidth = 0.5 + Math.max(0, rz) * 0.5;
        ctx.stroke();
      }
    }
  };
  
  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-full"
      style={{ 
        background: 'linear-gradient(to bottom, #f5f5f5 0%, #e0e0e0 100%)'
      }}
    />
  );
} 