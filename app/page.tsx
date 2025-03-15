'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';

// Dynamically import the components with no SSR
const CircleArt = dynamic(() => import('../components/CircleArt'), { ssr: false });
const MathPatterns = dynamic(() => import('../components/MathPatterns'), { ssr: false });
const HexagonalCircles = dynamic(() => import('../components/HexagonalCircles'), { ssr: false });

// Define the available visualization types
type VisualizationType = '2d-math' | '3d-hex' | 'circles';

export default function Home() {
  const [activePattern, setActivePattern] = useState<VisualizationType>('2d-math');
  const [showControls, setShowControls] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);

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
                  Circle Animations
                </button>
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
            {activePattern === '3d-hex' && <HexagonalCircles />}
            {activePattern === 'circles' && <CircleArt />}
          </div>
          
          {/* Center title with gradient */}
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
            {activePattern !== '3d-hex' && (
              <h1 className="text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                {activePattern === '2d-math' && '2D DESIGN'}
                {activePattern === 'circles' && 'CIRCLES'}
              </h1>
            )}
            
            {activePattern === '3d-hex' && activePattern !== '3d-hex' && (
              <p className="mt-4 text-lg text-blue-300/80 max-w-md text-center">
                An architectural visualization inspired by geodesic domes and molecular structures
              </p>
            )}
          </div>
          
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
