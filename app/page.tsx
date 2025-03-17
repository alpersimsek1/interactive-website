'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';

// Dynamically import the components with no SSR
const CircleArt = dynamic(() => import('../components/CircleArt'), { ssr: false });
const MathPatterns = dynamic(() => import('../components/MathPatterns'), { ssr: false });
const HexagonalCircles = dynamic(() => import('../components/HexagonalCircles'), { ssr: false });
const Supershapes = dynamic(() => import('../components/Supershapes'), { ssr: false });

// Define the available visualization types
type VisualizationType = '2d-math' | '3d-hex' | 'circles' | 'supershapes';

export default function Home() {
  const [activePattern, setActivePattern] = useState<VisualizationType>('2d-math');
  const [showControls, setShowControls] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // New state to keep track of the shape type in the Circle animation
  const [selectedShape, setSelectedShape] = useState<'circle' | 'square' | 'triangle'>('circle');
  
  // Add state for particle controls
  const [particleCount, setParticleCount] = useState(500);
  const [particleSpeed, setParticleSpeed] = useState(1.0);

  // Toggle controls visibility with keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'c') {
        setShowControls(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Function to handle shape change from CircleArt child component
  const handleShapeChange = (shape: 'circle' | 'square' | 'triangle') => {
    setSelectedShape(shape);
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} p-4 md:p-8 flex items-center justify-center overflow-hidden transition-colors duration-300`}>
      <div className="w-full h-[90vh] relative flex gap-6">
        {/* Control Center - Modern design */}
        <div 
          className={`h-full z-30 transition-all duration-500 ease-in-out ${
            showControls ? 'w-[280px] opacity-100' : 'w-0 opacity-0 overflow-hidden'
          }`}
        >
          <div className={`h-full ${isDarkMode ? 'bg-gray-800/90' : 'bg-white/90'} backdrop-blur-md rounded-3xl w-[280px] p-6 flex flex-col justify-between border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} shadow-lg overflow-hidden transition-colors duration-300`}>
            {/* Header */}
            <div>
              <h2 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                Control Center
              </h2>
              <p className={`text-sm mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Select a visualization style
              </p>
              
              {/* Visualization Selection */}
              <div className="space-y-3 w-full">
                <button 
                  className={`w-full px-4 py-3 rounded-xl text-left text-sm transition-all flex items-center gap-3 ${
                    activePattern === '2d-math' 
                      ? isDarkMode 
                        ? 'bg-indigo-600 text-white font-medium' 
                        : 'bg-indigo-100 text-indigo-800 font-medium'
                      : isDarkMode
                        ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => setActivePattern('2d-math')}
                >
                  <span className="w-6 h-6 flex items-center justify-center rounded-full bg-indigo-500/20">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 12h20M12 2v20"/>
                    </svg>
                  </span>
                  2D Math Patterns
                </button>
                
                {activePattern === '2d-math' && (
                  <div className={`mt-2 mb-4 px-4 py-3 rounded-xl ${isDarkMode ? 'bg-gray-700/30' : 'bg-gray-100'}`}>
                    <h3 className={`text-base font-semibold mb-1 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500`}>
                      GENERATIVE ART
                    </h3>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Create your own generative art with parametric surfaces. Design flowing curves, ribbons, shells, and vortices by adjusting complexity, amplitude, frequency, and more. Experiment with monochrome or color palettes.
                    </p>
                    <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Click and drag to rotate the structure | Use mouse wheel to zoom
                    </p>
                  </div>
                )}
                
                <button 
                  className={`w-full px-4 py-3 rounded-xl text-left text-sm transition-all flex items-center gap-3 ${
                    activePattern === '3d-hex' 
                      ? isDarkMode 
                        ? 'bg-indigo-600 text-white font-medium' 
                        : 'bg-indigo-100 text-indigo-800 font-medium'
                      : isDarkMode
                        ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => setActivePattern('3d-hex')}
                >
                  <span className="w-6 h-6 flex items-center justify-center rounded-full bg-indigo-500/20">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 19 7 19 17 12 22 5 17 5 7 12 2"/>
                    </svg>
                  </span>
                  Geodesic Architecture
                </button>
                
                {activePattern === '3d-hex' && (
                  <div className={`mt-2 mb-4 px-4 py-3 rounded-xl ${isDarkMode ? 'bg-gray-700/30' : 'bg-gray-100'}`}>
                    <h3 className={`text-base font-semibold mb-1 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500`}>
                      COSMIC TUNNEL
                    </h3>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      An architectural visualization inspired by geodesic domes and molecular structures. This 3D experience features a shrinking geodesic dome and particles that flow toward screen corners, creating an immersive tunnel effect.
                    </p>
                    
                    {/* Add particle controls */}
                    <div className="mt-3 space-y-2">
                      <div>
                        <label className={`flex justify-between items-center text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-1`}>
                          <span>Particle Count: {particleCount}</span>
                        </label>
                        <input 
                          type="range" 
                          min="100" 
                          max="1000" 
                          step="50" 
                          value={particleCount}
                          onChange={(e) => setParticleCount(Number(e.target.value))}
                          className="w-full h-1.5 bg-blue-200 rounded-lg appearance-none cursor-pointer dark:bg-blue-700"
                        />
                      </div>
                      
                      <div>
                        <label className={`flex justify-between items-center text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-1`}>
                          <span>Particle Speed: {particleSpeed.toFixed(1)}x</span>
                        </label>
                        <input 
                          type="range" 
                          min="0.5" 
                          max="3" 
                          step="0.1" 
                          value={particleSpeed}
                          onChange={(e) => setParticleSpeed(Number(e.target.value))}
                          className="w-full h-1.5 bg-blue-200 rounded-lg appearance-none cursor-pointer dark:bg-blue-700"
                        />
                      </div>
                    </div>
                    
                    <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Click and hold to increase the animation speed and intensity.
                    </p>
                  </div>
                )}
                
                <button 
                  className={`w-full px-4 py-3 rounded-xl text-left text-sm transition-all flex items-center gap-3 ${
                    activePattern === 'circles' 
                      ? isDarkMode 
                        ? 'bg-indigo-600 text-white font-medium' 
                        : 'bg-indigo-100 text-indigo-800 font-medium'
                      : isDarkMode
                        ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => setActivePattern('circles')}
                >
                  <span className="w-6 h-6 flex items-center justify-center rounded-full bg-indigo-500/20">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                    </svg>
                  </span>
                  3D Shape Patterns
                </button>
                
                {activePattern === 'circles' && (
                  <div className={`mt-2 mb-4 px-4 py-3 rounded-xl ${isDarkMode ? 'bg-gray-700/30' : 'bg-gray-100'}`}>
                    <h3 className={`text-base font-semibold mb-1 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500`}>
                      {selectedShape === 'circle' ? 'CIRCLES' : selectedShape === 'square' ? 'SQUARES' : 'TRIANGLES'} IN MOTION
                    </h3>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Create dynamic 3D shape animations with customizable patterns. Control distribution (grid, spiral, wave), motion effects, and color schemes to generate unique formations that respond to your mouse movements.
                    </p>
                    <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Move your mouse to interact | Press H to toggle advanced shape controls
                    </p>
                  </div>
                )}
                
                <button 
                  className={`w-full px-4 py-3 rounded-xl text-left text-sm transition-all flex items-center gap-3 ${
                    activePattern === 'supershapes' 
                      ? isDarkMode 
                        ? 'bg-indigo-600 text-white font-medium' 
                        : 'bg-indigo-100 text-indigo-800 font-medium'
                      : isDarkMode
                        ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => setActivePattern('supershapes')}
                >
                  <span className="w-6 h-6 flex items-center justify-center rounded-full bg-indigo-500/20">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2L4.5 10 2 18l8 4 8-4-2.5-8z"/>
                      <path d="M12 2l7.5 8L22 18l-8 4-8-4 2.5-8z"/>
                    </svg>
                  </span>
                  Supershapes
                </button>
                
                {activePattern === 'supershapes' && (
                  <div className={`mt-2 mb-4 px-4 py-3 rounded-xl ${isDarkMode ? 'bg-gray-700/30' : 'bg-gray-100'}`}>
                    <h3 className={`text-base font-semibold mb-1 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500`}>
                      SUPERSHAPES
                    </h3>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Mathematical visualizations using the Superformula, Lissajous figures, and Möbius strips. These complex geometric forms demonstrate how simple equations can create incredible 3D structures.
                    </p>
                    <div className={`mt-2 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      <p><span className="font-medium">Press 1:</span> Superformula - A generalization of the circle equation</p>
                      <p><span className="font-medium">Press 2:</span> Lissajous - Complex harmonic motion patterns</p>
                      <p><span className="font-medium">Press 3:</span> Möbius - Non-orientable surface with one boundary</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Footer with theme toggle and hide button */}
            <div className="mt-auto pt-6 border-t border-gray-700/30">
              <div className="flex items-center justify-between">
                <button 
                  onClick={() => setIsDarkMode(prev => !prev)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                    isDarkMode ? 'text-gray-300 hover:bg-gray-700/50' : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {isDarkMode ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="5"/>
                        <path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/>
                      </svg>
                      <span>Light</span>
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
                      </svg>
                      <span>Dark</span>
                    </>
                  )}
                </button>
                
                <button 
                  onClick={() => setShowControls(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                    isDarkMode ? 'text-gray-300 hover:bg-gray-700/50' : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m15 15-6-6M9 15l6-6"/>
                  </svg>
                  <span>Hide</span>
                </button>
              </div>
              
              <p className={`text-xs mt-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                Press 'C' key to toggle controls
              </p>
            </div>
          </div>
        </div>
        
        {/* Main Content Area */}
        <div className={`flex-grow h-full ${isDarkMode ? 'bg-black' : 'bg-white'} rounded-3xl relative overflow-hidden border ${isDarkMode ? 'border-gray-800' : 'border-gray-200'} shadow-lg transition-colors duration-300`}>
          {/* Toggle button for controls when hidden */}
          {!showControls && (
            <button 
              onClick={() => setShowControls(true)}
              className={`absolute top-6 left-6 z-20 p-3 rounded-full ${
                isDarkMode ? 'bg-gray-800/80' : 'bg-white/80'
              } backdrop-blur-sm border ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
              } shadow-md transition-all hover:scale-105`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isDarkMode ? 'white' : 'black'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            </button>
          )}
          
          {/* Background pattern - full screen */}
          <div className="absolute inset-0">
            {activePattern === '2d-math' && <MathPatterns />}
            {activePattern === '3d-hex' && <HexagonalCircles particleCount={particleCount} particleSpeed={particleSpeed} />}
            {activePattern === 'circles' && <CircleArt onShapeChange={handleShapeChange} />}
            {activePattern === 'supershapes' && <Supershapes />}
          </div>
          
          {/* Remove the center title with gradient and replace with only instructions */}
          {/* Instructions */}
          <div className="absolute bottom-6 left-0 w-full z-20 flex justify-center">
            <div className="bg-black/40 backdrop-blur-md px-6 py-3 rounded-full text-white/90 text-sm font-medium">
              Click and drag to interact with the visualization
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
