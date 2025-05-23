"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import PatternControls from '@/components/PatternControls';
import PatternCanvas from '@/components/PatternCanvas';
import PatternGallery from '@/components/PatternGallery';
import { PatternSettings } from '@/lib/patterns/types';
import PatternFactory from '@/lib/patterns/patternFactory';

export default function Home() {
  console.log('Home component rendering');
  
  const hasInitializedRef = useRef(false);
  const [windowDimensions, setWindowDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  // Initialize pattern settings with defaults
  const [settings, setSettings] = useState<PatternSettings>({
    patternType: 'woodland',
    scale: 50,
    complexity: 60,
    contrast: 60,
    sharpness: 50,
    colors: PatternFactory.getPresetColors('woodland'),
    _seed: Math.random() // Add initial seed
  });
  
  // Add tile size state
  const [tileSize, setTileSize] = useState(128);
  
  // Gallery storage
  const [galleryItems, setGalleryItems] = useState<string[]>([]);
  
  // UI state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Handle changes to pattern settings
  const handleSettingsChange = useCallback((newSettings: Partial<PatternSettings>) => {
    console.log('Settings changed:', newSettings);
    setSettings(prev => ({
      ...prev,
      ...newSettings
    }));
  }, []);
  
  // Handle tile size change
  const handleTileSizeChange = useCallback((newSize: number) => {
    setTileSize(newSize);
  }, []);
  
  // Force regenerate the current pattern
  const handleRegenerate = useCallback(() => {
    // Simply update a random value to trigger re-render
    setSettings(prev => {
      const newSettings = {
        ...prev,
        _seed: Math.random() // This doesn't affect the pattern directly, just forces a re-render
      };
      return newSettings;
    });
  }, []);
  
  // Handle window resize - moved after handleRegenerate is defined
  useEffect(() => {
    // Use a more efficient resize handling with debounce
    let resizeTimer: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const newWidth = window.innerWidth;
        const newHeight = window.innerHeight;
        
        // Only update if significant changes (reduces unnecessary renders)
        if (Math.abs(windowDimensions.width - newWidth) > 100 ||
            Math.abs(windowDimensions.height - newHeight) > 100) {
          setWindowDimensions({
            width: newWidth,
            height: newHeight,
          });
          handleRegenerate();
        }
      }, 250); // Debounce time of 250ms
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
    };
  }, [windowDimensions, handleRegenerate]);
  
  // Add pattern to gallery with size limit
  const handleAddToGallery = useCallback((dataUrl: string) => {
    // Only add if it's not already in the gallery
    setGalleryItems(prevItems => {
      if (prevItems.includes(dataUrl)) {
        return prevItems;
      }
      
      // Keep only the most recent items to prevent localStorage quota issues
      const newGallery = [...prevItems, dataUrl];
      // Limit to 5 items max
      return newGallery.length > 5 ? newGallery.slice(-5) : newGallery;
    });
  }, []);

  // Ensure the app initiates pattern generation immediately
  useEffect(() => {
    // Force generation on first load
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      
      // Only need one regeneration call with a short delay
      setTimeout(() => {
        handleRegenerate();
      }, 200);
    }
  }, [handleRegenerate]);

  // Memoize serialized gallery data to prevent unnecessary re-serialization
  const serializedGallery = useMemo(() => {
    if (galleryItems.length === 0) return '';
    try {
      // Limit to 5 items for performance and storage quota
      const limitedItems = galleryItems.slice(-5);
      return JSON.stringify(limitedItems);
    } catch (e) {
      console.error('Failed to serialize gallery:', e);
      return '';
    }
  }, [galleryItems]);
  
  // Load gallery from localStorage on first load
  useEffect(() => {
    const savedGallery = localStorage.getItem('camo-gen-gallery');
    if (savedGallery) {
      try {
        setGalleryItems(JSON.parse(savedGallery));
      } catch (e) {
        console.error('Failed to load gallery from localStorage', e);
      }
    }
  }, []);
  
  // Save gallery to localStorage when it changes - optimized
  useEffect(() => {
    if (serializedGallery) {
      try {
        localStorage.setItem('camo-gen-gallery', serializedGallery);
      } catch (e) {
        console.error('Failed to save gallery to localStorage:', e);
        // If we hit a quota error, try saving fewer items
        try {
          const singleItem = JSON.stringify(galleryItems.slice(-1));
          localStorage.setItem('camo-gen-gallery', singleItem);
        } catch (retryError) {
          console.error('Still failed to save gallery to localStorage:', retryError);
        }
      }
    }
  }, [serializedGallery, galleryItems]);
  
  // Handle pattern selection from gallery
  const handleSelectPattern = useCallback((dataUrl: string) => {
    // Create a temporary image to extract pattern data
    const img = new Image();
    img.src = dataUrl;
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return;
      
      // Draw the selected pattern to the canvas
      ctx.drawImage(img, 0, 0);
      
      // For now, just trigger a redraw
      handleRegenerate();
    };
  }, [handleRegenerate]);

  // Toggle sidebar collapsed state
  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);

  return (
    <main className="flex flex-col h-screen bg-gray-900 overflow-hidden relative">
      {/* Header */}
      <header className="bg-red-500 text-white p-2 flex items-center justify-between z-50">
        <h1 className="font-bold text-xl tracking-wider uppercase">
          CAMO-GEN
        </h1>
        <div className="flex items-center">
          <a href="/test" className="text-white underline text-xs mr-4">Pattern Test Page</a>
          <span className="text-xs uppercase mr-4">Seamless Pattern Generator</span>
          <button 
            onClick={() => {
              console.log('Regenerate button clicked');
              handleRegenerate();
            }}
            className="bg-white text-red-500 px-2 py-1 text-xs rounded hover:bg-gray-200"
          >
            Regenerate
          </button>
        </div>
      </header>
      
      {/* Base background color layer */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundColor: '#4c5e3d', // Base green color as fallback
        }}
      />
      
      {/* Debug Element */}
      <div className="absolute top-16 left-4 z-50 bg-black bg-opacity-70 text-white text-xs p-2 rounded">
        Debug info: tileSize={tileSize}, pattern={settings.patternType}, collapsedSidebar={sidebarCollapsed.toString()}
        <div className="mt-2 flex flex-col space-y-2">
          <button 
            onClick={() => handleRegenerate()}
            className="bg-red-500 text-white px-2 py-1 rounded"
          >
            Force Regen
          </button>
          <button 
            onClick={() => {
              setSettings(prev => ({
                ...prev,
                _seed: Math.random(),
                patternType: 'tiger'
              }));
              console.log('Forcing tiger pattern');
            }}
            className="bg-blue-500 text-white px-2 py-1 rounded"
          >
            Tiger Pattern
          </button>
          <button 
            onClick={() => {
              setSettings(prev => ({
                ...prev,
                _seed: Math.random(),
                patternType: 'woodland'
              }));
              console.log('Forcing woodland pattern');
            }}
            className="bg-green-500 text-white px-2 py-1 rounded"
          >
            Woodland Pattern
          </button>
        </div>
      </div>

      {/* Full-screen pattern preview */}
      <div className="flex-1 relative overflow-hidden">
        {/* Pattern Canvas component */}
        <PatternCanvas 
          key={`canvas-${settings._seed}-${windowDimensions.width}-${windowDimensions.height}`}
          settings={settings}
          onAddToGallery={handleAddToGallery}
          fullscreenPreview={true}
          tileSize={tileSize}
          onTileSizeChange={handleTileSizeChange}
        />
        
        {/* Floating toolbar toggle button */}
        <button 
          className="absolute top-4 right-4 z-50 bg-red-500 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-all"
          onClick={toggleSidebar}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="currentColor" 
            className={`w-6 h-6 transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`}
          >
            <path d="M6.75 12a.75.75 0 01-.75-.75V6a.75.75 0 011.5 0v5.25a.75.75 0 01-.75.75zm4.5 0a.75.75 0 01-.75-.75V2.25a.75.75 0 011.5 0v9a.75.75 0 01-.75.75zm4.5 0a.75.75 0 01-.75-.75V9a.75.75 0 011.5 0v2.25a.75.75 0 01-.75.75z" />
          </svg>
        </button>
        
        {/* Floating controls panel */}
        <div 
          className={`absolute top-4 right-16 z-40 transition-all duration-300 transform ${
            sidebarCollapsed ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
          }`}
        >
          <div className="bg-gray-900 bg-opacity-90 rounded-lg shadow-2xl border border-red-500 backdrop-blur-sm">
            <PatternControls 
              settings={settings}
              onSettingsChange={handleSettingsChange}
              onRegenerate={handleRegenerate}
              compact={true}
              tileSize={tileSize}
              onTileSizeChange={handleTileSizeChange}
            />
          </div>
        </div>
        
        {/* Gallery at bottom */}
        <PatternGallery 
          galleryItems={galleryItems}
          onSelectPattern={handleSelectPattern}
        />
      </div>
    </main>
  );
}
