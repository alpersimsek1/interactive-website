import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

export default function MathPatterns() {
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
    
    // Create pattern configuration
    const rings = 6;
    const maxRadius = Math.min(canvas.width, canvas.height) * 0.45;
    const segmentsPerRing = [3, 5, 8, 12, 16, 24];
    const ringRotationSpeeds = [0.0005, -0.0003, 0.0007, -0.0004, 0.0006, -0.0005];
    const ringRotationOffsets = [0, Math.PI / 4, Math.PI / 3, Math.PI / 6, Math.PI / 8, Math.PI / 5];
    
    // Animation loop
    const animate = () => {
      // Clear canvas with fade effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Update time using ref to avoid state updates
      timeRef.current += 0.01;
      const time = timeRef.current;
      
      // Calculate mouse influence
      const mouseInfluence = isClicking ? 0.5 : 0.2;
      const mouseDistanceX = (mousePos.x - centerX) / (canvas.width / 2);
      const mouseDistanceY = (mousePos.y - centerY) / (canvas.height / 2);
      const mouseAngle = Math.atan2(mouseDistanceY, mouseDistanceX);
      const mouseDistance = Math.sqrt(mouseDistanceX * mouseDistanceX + mouseDistanceY * mouseDistanceY);
      
      // Draw each ring
      for (let i = 0; i < rings; i++) {
        const radius = maxRadius * ((i + 1) / rings);
        const segments = segmentsPerRing[i];
        const rotationSpeed = ringRotationSpeeds[i];
        const rotationOffset = ringRotationOffsets[i];
        
        // Calculate current rotation with mouse influence
        const rotation = time * rotationSpeed + rotationOffset + (mouseAngle * mouseInfluence);
        
        // Draw ring with pulsating effect influenced by mouse
        const pulseAmount = Math.sin(time * 0.2 + i * 0.5) * 0.1 + 0.9;
        const mouseEffect = isClicking ? (1 + mouseDistance * 0.3) : 1;
        const currentRadius = radius * pulseAmount * mouseEffect;
        
        // Draw ring with varying opacity
        const opacity = 0.8 - i * 0.1 + Math.sin(time * 0.3 + i) * 0.1;
        ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.lineWidth = 1.5 - i * 0.2;
        
        // Draw segments
        for (let j = 0; j < segments; j++) {
          const segmentLength = 0.8 + Math.sin(time * 0.5 + j * 0.2) * 0.1;
          const startAngle = (j / segments) * Math.PI * 2 + rotation;
          const endAngle = ((j + segmentLength) / segments) * Math.PI * 2 + rotation;
          
          ctx.beginPath();
          ctx.arc(centerX, centerY, currentRadius, startAngle, endAngle);
          ctx.stroke();
        }
        
        // Draw connecting lines occasionally with pulsating effect
        if (i < rings - 1 && Math.sin(time * 0.5 + i) > 0.6) {
          const nextRadius = maxRadius * ((i + 2) / rings) * pulseAmount * mouseEffect;
          const lineCount = 3 + Math.floor(Math.sin(time * 0.2) * 2);
          
          ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 + Math.sin(time * 0.2) * 0.1})`;
          ctx.lineWidth = 0.5;
          
          for (let j = 0; j < lineCount; j++) {
            const angle = (j / lineCount) * Math.PI * 2 + time * 0.1;
            
            ctx.beginPath();
            ctx.moveTo(
              centerX + Math.cos(angle) * currentRadius,
              centerY + Math.sin(angle) * currentRadius
            );
            ctx.lineTo(
              centerX + Math.cos(angle) * nextRadius,
              centerY + Math.sin(angle) * nextRadius
            );
            ctx.stroke();
          }
        }
      }
      
      // Draw additional mathematical patterns
      drawSinWaves(ctx, centerX, centerY, maxRadius, time, mousePos, isClicking);
      drawLissajousCurve(ctx, centerX, centerY, maxRadius * 0.3, time, mousePos, isClicking);
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    // Function to draw sine wave patterns
    const drawSinWaves = (
      ctx: CanvasRenderingContext2D, 
      centerX: number, 
      centerY: number, 
      radius: number, 
      time: number,
      mousePos: THREE.Vector2,
      isClicking: boolean
    ) => {
      const mouseDistanceX = (mousePos.x - centerX) / (canvas.width / 2);
      const mouseDistanceY = (mousePos.y - centerY) / (canvas.height / 2);
      const mouseDistance = Math.sqrt(mouseDistanceX * mouseDistanceX + mouseDistanceY * mouseDistanceY);
      
      // Amplitude affected by mouse distance
      const mouseAmplitude = isClicking ? mouseDistance * 0.2 : mouseDistance * 0.1;
      const amplitude = radius * 0.05 * (1 + Math.sin(time * 0.1) * 0.3 + mouseAmplitude);
      
      // Frequency affected by mouse position
      const mouseFrequency = isClicking ? mouseDistance * 5 : mouseDistance * 2;
      const frequency = 15 + Math.sin(time * 0.05) * 3 + mouseFrequency;
      
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 0.5;
      
      for (let i = 0; i < 3; i++) {
        const phaseOffset = i * Math.PI / 3 + time * 0.05;
        const radiusOffset = radius * 0.1 * i;
        
        ctx.beginPath();
        
        for (let angle = 0; angle < Math.PI * 2; angle += 0.05) {
          const r = radius - radiusOffset + 
            amplitude * Math.sin(frequency * angle + time + phaseOffset);
          
          const x = centerX + Math.cos(angle) * r;
          const y = centerY + Math.sin(angle) * r;
          
          if (angle === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        
        ctx.closePath();
        ctx.stroke();
      }
    };
    
    // Function to draw Lissajous curves
    const drawLissajousCurve = (
      ctx: CanvasRenderingContext2D, 
      centerX: number, 
      centerY: number, 
      radius: number, 
      time: number,
      mousePos: THREE.Vector2,
      isClicking: boolean
    ) => {
      const mouseDistanceX = (mousePos.x - centerX) / (canvas.width / 2);
      const mouseDistanceY = (mousePos.y - centerY) / (canvas.height / 2);
      
      // Parameters affected by mouse position
      const a = 3 + Math.sin(time * 0.1) + (isClicking ? mouseDistanceX : mouseDistanceX * 0.5);
      const b = 2 + Math.cos(time * 0.2) + (isClicking ? mouseDistanceY : mouseDistanceY * 0.5);
      const delta = time * 0.3;
      
      // Color affected by mouse position
      const hue = ((time * 5) + (mousePos.x / canvas.width) * 180) % 360;
      const saturation = 70 + (mousePos.y / canvas.height) * 30;
      ctx.strokeStyle = `hsla(${hue}, ${saturation}%, 70%, 0.6)`;
      ctx.lineWidth = 0.8;
      
      ctx.beginPath();
      
      for (let t = 0; t < Math.PI * 10; t += 0.1) {
        const x = centerX + radius * Math.sin(a * t + delta);
        const y = centerY + radius * Math.sin(b * t);
        
        if (t === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      
      ctx.stroke();
    };
    
    animate();
    
    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [mousePos, isClicking]);
  
  return (
    <canvas 
      ref={canvasRef} 
      className="absolute top-0 left-0 w-full h-full z-0"
      style={{ background: 'black' }}
    />
  );
} 