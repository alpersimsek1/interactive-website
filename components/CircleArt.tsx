import { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector2 } from 'three';
import * as THREE from 'three';

// Circle class for managing individual circles
class Circle {
  position: THREE.Vector2;
  radius: number;
  targetRadius: number;
  velocity: THREE.Vector2;
  color: string;
  glowIntensity: number;
  segments: number;
  broken: boolean;
  breakPoints: number[];
  lifespan: number;
  maxLifespan: number;
  isInitial: boolean;
  
  constructor(x: number, y: number, radius: number = 50, isInitial: boolean = false) {
    this.position = new THREE.Vector2(x, y);
    this.radius = radius;
    this.targetRadius = radius;
    this.velocity = new THREE.Vector2(
      (Math.random() - 0.5) * 0.5,
      (Math.random() - 0.5) * 0.5
    );
    this.color = '#ffffff';
    this.glowIntensity = Math.random() * 0.5 + 0.5;
    this.segments = Math.floor(Math.random() * 3) + 3; // 3-5 segments
    this.broken = Math.random() > 0.5;
    this.breakPoints = [];
    this.isInitial = isInitial;
    
    // Create random break points if this is a broken circle
    if (this.broken) {
      for (let i = 0; i < this.segments; i++) {
        this.breakPoints.push(Math.random() * 2 * Math.PI);
      }
      this.breakPoints.sort((a, b) => a - b);
    }
    
    // Give initial circles a much longer lifespan
    this.maxLifespan = isInitial ? 2000 + Math.random() * 1000 : 300 + Math.random() * 300;
    this.lifespan = this.maxLifespan;
  }
  
  update() {
    // Update position based on velocity
    this.position.add(this.velocity);
    
    // Smoothly adjust radius towards target
    this.radius += (this.targetRadius - this.radius) * 0.05;
    
    // Decrease lifespan more slowly for initial circles
    if (this.isInitial) {
      this.lifespan -= 0.2;
    } else {
      this.lifespan--;
    }
    
    return this.lifespan > 0;
  }
}

// Canvas component for drawing the circles
function CircleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [mousePos, setMousePos] = useState<Vector2>(new Vector2(0, 0));
  const [isClicking, setIsClicking] = useState(false);
  const animationFrameRef = useRef<number>(0);
  const circlesRef = useRef<Circle[]>([]);
  
  // Update circlesRef whenever circles state changes
  useEffect(() => {
    circlesRef.current = circles;
  }, [circles]);
  
  // Initialize canvas and event listeners
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
    
    // Handle mouse movement
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos(new Vector2(e.clientX, e.clientY));
      
      // Create small circles when dragging
      if (isClicking && Math.random() < 0.3) {
        const newCircle = new Circle(
          e.clientX, 
          e.clientY, 
          Math.random() * 30 + 10,
          false
        );
        setCircles(prev => [...prev, newCircle]);
      }
    };
    
    // Handle mouse clicks
    const handleMouseDown = (e: MouseEvent) => {
      setIsClicking(true);
      // Create a new circle at mouse position
      const newCircle = new Circle(e.clientX, e.clientY, Math.random() * 80 + 40);
      setCircles(prev => [...prev, newCircle]);
    };
    
    const handleMouseUp = () => {
      setIsClicking(false);
    };
    
    // Add event listeners
    window.addEventListener('resize', resizeCanvas);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    
    // Initial resize
    resizeCanvas();
    
    // Create initial circles
    const initialCircles = [];
    for (let i = 0; i < 8; i++) {
      initialCircles.push(
        new Circle(
          Math.random() * window.innerWidth,
          Math.random() * window.innerHeight,
          Math.random() * 100 + 50,
          true // Mark as initial circle
        )
      );
    }
    setCircles(initialCircles);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isClicking]);
  
  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const animate = () => {
      // Clear canvas with more transparency to create trail effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Update circles without using setState in the animation loop
      const updatedCircles: Circle[] = [];
      
      // Process existing circles
      circlesRef.current.forEach(circle => {
        const isAlive = circle.update();
        if (!isAlive) return;
        
        // If clicking, make circles near mouse expand
        if (isClicking) {
          const distance = mousePos.distanceTo(circle.position);
          if (distance < 200) {
            circle.targetRadius = circle.targetRadius * 1.01;
            // Add some velocity away from mouse
            const direction = new Vector2()
              .subVectors(circle.position, mousePos)
              .normalize()
              .multiplyScalar(0.2);
            circle.velocity.add(direction);
          }
        }
        
        // Keep circles within bounds of the canvas
        if (circle.position.x < -circle.radius) circle.position.x = canvas.width + circle.radius;
        if (circle.position.x > canvas.width + circle.radius) circle.position.x = -circle.radius;
        if (circle.position.y < -circle.radius) circle.position.y = canvas.height + circle.radius;
        if (circle.position.y > canvas.height + circle.radius) circle.position.y = -circle.radius;
        
        updatedCircles.push(circle);
      });
      
      // Add a new circle occasionally
      if (Math.random() < 0.01 && updatedCircles.length < 30) {
        updatedCircles.push(
          new Circle(
            Math.random() * canvas.width,
            Math.random() * canvas.height,
            Math.random() * 100 + 20
          )
        );
      }
      
      // Update state outside the animation loop, only when needed
      if (updatedCircles.length !== circlesRef.current.length) {
        setCircles(updatedCircles);
      }
      
      // Draw each circle
      updatedCircles.forEach(circle => {
        const alpha = circle.lifespan / circle.maxLifespan;
        
        // Draw glow effect
        const gradient = ctx.createRadialGradient(
          circle.position.x, circle.position.y, 0,
          circle.position.x, circle.position.y, circle.radius * 1.5
        );
        
        // Add some color variation
        const hue = (circle.position.x / canvas.width) * 60; // 0-60 (red to yellow)
        gradient.addColorStop(0, `hsla(${hue}, 100%, 80%, ${0.3 * alpha * circle.glowIntensity})`);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(circle.position.x, circle.position.y, circle.radius * 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw circle outline
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.lineWidth = 1;
        
        if (circle.broken) {
          // Draw broken circle with segments
          for (let i = 0; i < circle.breakPoints.length; i++) {
            const startAngle = circle.breakPoints[i];
            const endAngle = circle.breakPoints[(i + 1) % circle.breakPoints.length];
            
            ctx.beginPath();
            ctx.arc(
              circle.position.x, 
              circle.position.y, 
              circle.radius, 
              startAngle, 
              endAngle
            );
            ctx.stroke();
          }
        } else {
          // Draw complete circle
          ctx.beginPath();
          ctx.arc(circle.position.x, circle.position.y, circle.radius, 0, Math.PI * 2);
          ctx.stroke();
        }
        
        // Draw concentric circles
        for (let i = 1; i <= 3; i++) {
          const innerRadius = circle.radius * (1 - i * 0.2);
          if (innerRadius <= 0) continue;
          
          ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
          ctx.lineWidth = 0.5;
          
          if (circle.broken) {
            // Draw broken inner circles
            for (let j = 0; j < circle.breakPoints.length; j++) {
              const startAngle = circle.breakPoints[j];
              const endAngle = circle.breakPoints[(j + 1) % circle.breakPoints.length];
              
              ctx.beginPath();
              ctx.arc(
                circle.position.x, 
                circle.position.y, 
                innerRadius, 
                startAngle, 
                endAngle
              );
              ctx.stroke();
            }
          } else {
            // Draw complete inner circles
            ctx.beginPath();
            ctx.arc(circle.position.x, circle.position.y, innerRadius, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
      });
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [mousePos, isClicking]); // Only depend on mousePos and isClicking, not circles
  
  return (
    <canvas 
      ref={canvasRef} 
      className="absolute top-0 left-0 w-full h-full z-0"
      style={{ background: 'black' }}
    />
  );
}

// Sun effect component that appears on click
function SunEffect({ position = [0, 0, 0] }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const [active, setActive] = useState(false);
  const [scale, setScale] = useState(1);
  
  // Handle click to activate sun effect
  const handleClick = () => {
    setActive(true);
    setScale(1);
  };
  
  // Animate the sun effect
  useFrame((state, delta) => {
    if (active) {
      setScale(prev => {
        const newScale = prev + delta * 5;
        if (newScale > 10) {
          setActive(false);
          return 1;
        }
        return newScale;
      });
      
      if (meshRef.current) {
        meshRef.current.scale.set(scale, scale, scale);
        meshRef.current.rotation.y += delta;
        meshRef.current.rotation.z += delta * 0.5;
      }
    }
  });
  
  return (
    <mesh
      position={position as [number, number, number]}
      ref={meshRef}
      onClick={handleClick}
    >
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial 
        color={'#ff5500'} 
        emissive={'#ff8800'}
        emissiveIntensity={active ? 2 : 0.5}
        metalness={0.3}
        roughness={0.4}
      />
    </mesh>
  );
}

export default function CircleArt() {
  return (
    <div className="w-full h-screen relative overflow-hidden">
      <CircleCanvas />
    </div>
  );
} 