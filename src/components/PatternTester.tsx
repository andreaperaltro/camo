"use client";

import React, { useEffect, useState } from 'react';

interface PatternTesterProps {
  dataUrl?: string;
}

export default function PatternTester({ dataUrl }: PatternTesterProps) {
  const [hasRun, setHasRun] = useState(false);
  const [bgStyle, setBgStyle] = useState({});
  
  // This is a hardcoded data URL for a simple test pattern (a small red square)
  const testPattern = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mP8z8BQz0AEYBxVSF+FAO5UC4vV3x6eAAAAAElFTkSuQmCC';
  
  useEffect(() => {
    console.log('PatternTester mounted');
    
    // Set a background style with the pattern
    setBgStyle({
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundImage: `url("${dataUrl || testPattern}")`,
      backgroundRepeat: 'repeat',
      backgroundSize: '100px 100px',
      zIndex: 30
    });
    
    setHasRun(true);
  }, [dataUrl]);

  return (
    <div className="relative w-full h-full border-4 border-yellow-500">
      <div style={bgStyle} className="test-pattern" />
      <div className="absolute top-0 left-0 bg-black bg-opacity-50 text-white p-2 z-40">
        Pattern Tester {hasRun ? 'initialized' : 'loading'}
      </div>
    </div>
  );
} 