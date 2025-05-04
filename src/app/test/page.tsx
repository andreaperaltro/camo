"use client";

import React, { useState, useEffect } from 'react';
import PatternTester from '@/components/PatternTester';
import Link from 'next/link';

export default function TestPage() {
  // Simple red square pattern
  const redPattern = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAIAAAACUFjqAAAAFElEQVR4nGP8z4AKGAYYjEocGQAAGiAF0RPbS3EAAAAASUVORK5CYII=';
  
  // Checkerboard pattern
  const checkerPattern = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAH0lEQVQYV2NkQAX/GZH4/xkYGBhhAmAOSBJEwDkgAQCCrgQEqRgDDwAAAABJRU5ErkJggg==';
  
  // Actual generated pattern if we can get one
  const [patternDataUrl, setPatternDataUrl] = useState<string>(redPattern);
  const [tileSize, setTileSize] = useState<number>(100);
  
  useEffect(() => {
    console.log('Test page mounted');
    // Try to draw a pattern directly
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Create a simple pattern
      ctx.fillStyle = '#44aa33';
      ctx.fillRect(0, 0, 200, 200);
      
      // Add some random shapes
      for (let i = 0; i < 20; i++) {
        const x = Math.random() * 200;
        const y = Math.random() * 200;
        const size = 10 + Math.random() * 30;
        
        ctx.fillStyle = `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Get the data URL
      try {
        const dataUrl = canvas.toDataURL('image/png');
        console.log('Generated pattern URL:', dataUrl.substring(0, 50) + '...');
        setPatternDataUrl(dataUrl);
      } catch (error) {
        console.error('Failed to get dataURL:', error);
      }
    }
  }, []);
  
  return (
    <div className="relative min-h-screen bg-gray-900 p-4">
      <div className="bg-red-600 text-white p-4 mb-4 rounded">
        <h1 className="text-2xl font-bold mb-2">Pattern Test Page</h1>
        <p>This page tests direct pattern rendering in Next.js.</p>
        <Link href="/" className="text-white underline">
          Return to main app
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="h-80 bg-gray-800 rounded overflow-hidden">
          <h2 className="bg-gray-700 text-white p-2">Hard-coded red pattern</h2>
          <PatternTester dataUrl={redPattern} />
        </div>
        
        <div className="h-80 bg-gray-800 rounded overflow-hidden">
          <h2 className="bg-gray-700 text-white p-2">Hard-coded checker pattern</h2>
          <PatternTester dataUrl={checkerPattern} />
        </div>
        
        <div className="h-80 bg-gray-800 rounded overflow-hidden">
          <h2 className="bg-gray-700 text-white p-2">Dynamically generated pattern</h2>
          <PatternTester dataUrl={patternDataUrl} />
        </div>
        
        <div className="h-80 bg-gray-800 rounded overflow-hidden">
          <h2 className="bg-gray-700 text-white p-2">CSS background-image (control)</h2>
          <div className="w-full h-full relative">
            <div 
              className="absolute inset-0"
              style={{
                backgroundImage: `url("${patternDataUrl}")`,
                backgroundRepeat: 'repeat',
                backgroundSize: `${tileSize}px ${tileSize}px`
              }}
            />
            <div className="absolute top-2 right-2 flex space-x-2 bg-black bg-opacity-50 p-2 rounded">
              <button 
                onClick={() => setTileSize(prev => Math.max(50, prev - 50))}
                className="bg-red-500 text-white px-2 py-1 rounded"
              >
                -
              </button>
              <span className="text-white">{tileSize}px</span>
              <button 
                onClick={() => setTileSize(prev => Math.min(200, prev + 50))}
                className="bg-red-500 text-white px-2 py-1 rounded"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white p-2 rounded">
        All pattern tests on this page should always be visible, regardless of the main app issues.
      </div>
    </div>
  );
} 