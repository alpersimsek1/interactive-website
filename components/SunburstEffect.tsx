import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

class SunburstParticle {
  position: THREE.Vector2;
  velocity: THREE.Vector2;
  size: number;
  color: string;
  alpha: number;
  rotation: number;
  rotationSpeed: number;
  lifespan: number;
  maxLifespan: number;
  
  constructor(x: number, y: number) {
    this.position = new THREE.Vector2(x, y);
    
    // Random velocity in all directions
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 5 + 2;
    this.velocity = new THREE.Vector2(
      Math.cos(angle) * speed,
      Math.sin(angle) * speed
    );
    
    this.size = Math.random() * 50 + 20;
    
    // Color ranges from yellow to red-orange
    const hue = Math.random() * 60 + 10; // 10-70 (red to yellow)
    const saturation = 100;
    const lightness = Math.random() * 20 + 50; // 50-70%
    this.color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    
    this.alpha = 1.0;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 0.1;
    
    // Increase lifespan for more persistent effects
    this.maxLifespan = 120 + Math.random() * 120;
    this.lifespan = this.maxLifespan;
  }
  
  update() {
    // Update position
    this.position.add(this.velocity);
    
    // Slow down velocity
    this.velocity.multiplyScalar(0.97);
    
    // Update rotation
    this.rotation += this.rotationSpeed;
    
    // Decrease size slightly
    this.size *= 0.99;
    
    // Decrease lifespan and alpha
    this.lifespan--;
    this.alpha = this.lifespan / this.maxLifespan;
    
    return this.lifespan > 0;
  }
}

export default function SunburstEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [particles, setParticles] = useState<SunburstParticle[]>([]);
  const animationFrameRef = useRef<number>(0);
  const particlesRef = useRef<SunburstParticle[]>([]);
  
  // Update particlesRef whenever particles state changes
  useEffect(() => {
    particlesRef.current = particles;
  }, [particles]);
  
  // Handle canvas click to create sunburst
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Create particles for the sunburst
    const newParticles: SunburstParticle[] = [];
    // Create more particles for a more dramatic effect
    for (let i = 0; i < 50; i++) {
      newParticles.push(new SunburstParticle(x, y));
    }
    
    // Update state with new particles
    setParticles(prev => [...prev, ...newParticles]);
  };
  
  // Initialize canvas
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
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);
  
  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const animate = () => {
      // Clear canvas with semi-transparent black for trail effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Update particles without using setState in the animation loop
      const updatedParticles: SunburstParticle[] = [];
      
      // Process existing particles
      particlesRef.current.forEach(particle => {
        // Update particle
        const isAlive = particle.update();
        if (!isAlive) return;
        
        updatedParticles.push(particle);
        
        // Draw particle
        ctx.save();
        ctx.translate(particle.position.x, particle.position.y);
        ctx.rotate(particle.rotation);
        
        // Draw glow
        const gradient = ctx.createRadialGradient(
          0, 0, 0,
          0, 0, particle.size
        );
        gradient.addColorStop(0, `rgba(255, 255, 255, ${particle.alpha * 0.9})`);
        gradient.addColorStop(0.5, `rgba(255, 200, 100, ${particle.alpha * 0.5})`);
        gradient.addColorStop(1, `rgba(255, 100, 50, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw rays
        const rayCount = 8;
        const rayLength = particle.size * 1.5;
        
        ctx.strokeStyle = `rgba(255, 255, 255, ${particle.alpha * 0.8})`;
        ctx.lineWidth = 2;
        
        for (let i = 0; i < rayCount; i++) {
          const angle = (i / rayCount) * Math.PI * 2;
          const innerRadius = particle.size * 0.8;
          const outerRadius = innerRadius + rayLength * (0.5 + Math.random() * 0.5);
          
          ctx.beginPath();
          ctx.moveTo(
            Math.cos(angle) * innerRadius,
            Math.sin(angle) * innerRadius
          );
          ctx.lineTo(
            Math.cos(angle) * outerRadius,
            Math.sin(angle) * outerRadius
          );
          ctx.stroke();
        }
        
        ctx.restore();
      });
      
      // Update state outside the animation loop, only when needed
      if (updatedParticles.length !== particlesRef.current.length) {
        setParticles(updatedParticles);
      }
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, []); // Empty dependency array since we're using refs
  
  return (
    <canvas 
      ref={canvasRef} 
      className="absolute top-0 left-0 w-full h-full z-10 cursor-pointer"
      style={{ background: 'transparent' }}
      onClick={handleClick}
    />
  );
} 