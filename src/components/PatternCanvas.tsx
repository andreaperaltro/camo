"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { PatternSettings, ExportFormat } from '@/lib/patterns/types';
import PatternFactory from '@/lib/patterns/patternFactory';
import { verifySeamless } from '@/lib/utils/patternUtils';

// Helper function to compare settings objects, ignoring the _seed property
const haveSettingsChanged = (prev: PatternSettings, current: PatternSettings): boolean => {
  const keysToCompare = ['patternType', 'scale', 'complexity', 'contrast', 'sharpness'];
  
  // Check basic properties
  for (const key of keysToCompare) {
    if (prev[key as keyof PatternSettings] !== current[key as keyof PatternSettings]) {
      return true;
    }
  }
  
  // Check colors array
  if (prev.colors.length !== current.colors.length) {
    return true;
  }
  
  for (let i = 0; i < prev.colors.length; i++) {
    if (prev.colors[i] !== current.colors[i]) {
      return true;
    }
  }
  
  return false;
};

interface PatternCanvasProps {
  settings: PatternSettings;
  onAddToGallery: (dataUrl: string) => void;
  fullscreenPreview?: boolean;
  tileSize?: number;
  onTileSizeChange?: (size: number) => void;
}

export default function PatternCanvas({ 
  settings, 
  onAddToGallery, 
  fullscreenPreview = false,
  tileSize: propTileSize,
  onTileSizeChange
}: PatternCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSeamlessPreview, setShowSeamlessPreview] = useState(fullscreenPreview);
  const prevSettingsRef = useRef<PatternSettings>(settings);
  const initialRenderRef = useRef(true);
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null);
  const [isSeamless, setIsSeamless] = useState(true);
  const [patternDataUrl, setPatternDataUrl] = useState<string | null>(null);
  const [internalTileSize, setInternalTileSize] = useState(fullscreenPreview ? 128 : 128);
  
  // Debug logger for tiling preview issues
  const debugPattern = (message: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[PatternDebug] ${message}`);
    }
  };
  
  const tileSize = propTileSize !== undefined ? propTileSize : internalTileSize;
  
  // Memoize the post-processing function
  const applyPostProcessing = useCallback((
    canvas: HTMLCanvasElement, 
    ctx: CanvasRenderingContext2D, 
    contrast: number, 
    sharpness: number
  ): void => {
    try {
      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Apply contrast
      const contrastFactor = 1 + (contrast - 50) / 100;
      
      for (let i = 0; i < data.length; i += 4) {
        // Apply contrast to RGB channels
        for (let j = 0; j < 3; j++) {
          const value = data[i + j];
          const newValue = 128 + (value - 128) * contrastFactor;
          data[i + j] = Math.max(0, Math.min(255, newValue));
        }
      }
      
      // Apply sharpness (simple unsharp mask)
      if (sharpness > 50) {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        if (!tempCtx) return;
        
        // Draw the current image
        tempCtx.putImageData(imageData, 0, 0);
        
        // Apply blur
        ctx.filter = 'blur(1px)';
        ctx.drawImage(tempCanvas, 0, 0);
        
        // Get blurred image
        const blurredData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const blurredPixels = blurredData.data;
        
        // Apply unsharp mask
        const amount = (sharpness - 50) / 50 * 0.8; // 0-0.8 range
        
        for (let i = 0; i < data.length; i += 4) {
          for (let j = 0; j < 3; j++) {
            const original = data[i + j];
            const blurred = blurredPixels[i + j];
            const mask = (original - blurred) * amount;
            data[i + j] = Math.max(0, Math.min(255, original + mask));
          }
        }
        
        // Reset filter
        ctx.filter = 'none';
      }
      
      // Put the modified image data back
      ctx.putImageData(imageData, 0, 0);
    } catch (error) {
      console.error('Error in post-processing:', error);
    }
  }, []);

  // Generate pattern when settings change
  useEffect(() => {
    // Skip checking for changes on initial render
    if (initialRenderRef.current) {
      initialRenderRef.current = false;
    } else {
      // Check if we need to regenerate the pattern based on actual setting changes
      const shouldRegenerate = haveSettingsChanged(prevSettingsRef.current, settings);
      
      if (!shouldRegenerate && '_seed' in prevSettingsRef.current && '_seed' in settings) {
        // Both have _seed property, check if forced regeneration was requested
        const forceRegenerate = prevSettingsRef.current._seed !== settings._seed;
        if (!forceRegenerate) {
          return; // No need to regenerate
        }
      }
    }
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const generatePattern = async () => {
      setIsGenerating(true);
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      try {
        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Create pattern using factory
        const patternOptions = {
          scale: settings.scale,
          complexity: settings.complexity,
          colors: settings.colors,
          contrast: settings.contrast,
          sharpness: settings.sharpness
        };
        
        const pattern = PatternFactory.createPattern(
          settings.patternType,
          canvas,
          ctx,
          patternOptions
        );
        
        // Generate the pattern
        pattern.generate();
        
        // Apply post-processing (like contrast and sharpness)
        applyPostProcessing(canvas, ctx, settings.contrast, settings.sharpness);
        
        // Check if pattern is seamless
        const seamlessCheckResult = verifySeamless(canvas);
        setIsSeamless(seamlessCheckResult);
        
        // Set the pattern data URL for the background
        const dataUrl = canvas.toDataURL('image/png');
        setPatternDataUrl(dataUrl);
        
        // Add to gallery
        onAddToGallery(dataUrl);
        
        // Update prev settings reference
        prevSettingsRef.current = {...settings};

        // Directly update the background if it exists
        if (showSeamlessPreview) {
          setTimeout(() => {
            const bgElement = getOrCreatePatternBackground();
            if (bgElement) {
              bgElement.style.backgroundImage = `url("${dataUrl}")`;
              bgElement.style.backgroundSize = `${tileSize}px ${tileSize}px`;
              bgElement.style.backgroundRepeat = 'repeat';
              bgElement.style.zIndex = fullscreenPreview ? '20' : '15';
              bgElement.style.opacity = '1';
              bgElement.style.visibility = 'visible';
              bgElement.style.display = 'block';
              debugPattern('Updated pattern from generate function');
            }
          }, 50);
        }
      } catch (error) {
        console.error('Error generating pattern:', error);
      } finally {
        setIsGenerating(false);
      }
    };
    
    generatePattern();
  }, [settings, onAddToGallery, applyPostProcessing, showSeamlessPreview, tileSize, fullscreenPreview]);

  // Download the pattern
  const downloadPattern = (format: ExportFormat) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    try {
      setDownloadStatus(`Preparing ${format.toUpperCase()} file...`);
      // Create a download link
      const downloadLink = document.createElement('a');
      
      if (format === 'png') {
        // PNG download
        downloadLink.href = canvas.toDataURL('image/png');
        downloadLink.download = `camo-pattern-${settings.patternType}-${Date.now()}.png`;
      } else if (format === 'svg') {
        // SVG download - convert canvas to SVG
        const svgData = canvasToSVG(canvas);
        
        const svgBlob = new Blob([svgData], {
          type: 'image/svg+xml;charset=utf-8'
        });
        
        downloadLink.href = URL.createObjectURL(svgBlob);
        downloadLink.download = `camo-pattern-${settings.patternType}-${Date.now()}.svg`;
      }
      
      // Trigger the download
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      setDownloadStatus('Download started!');
      setTimeout(() => setDownloadStatus(null), 2000);
    } catch (error) {
      console.error('Error downloading pattern:', error);
      setDownloadStatus('Download failed');
      setTimeout(() => setDownloadStatus(null), 2000);
    }
  };

  // Convert canvas to SVG
  const canvasToSVG = (canvas: HTMLCanvasElement): string => {
    const width = canvas.width;
    const height = canvas.height;
    
    // Create SVG header with proper TypeScript template string
    const svgData = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <title>CAMO-GEN Seamless Pattern</title>
    <desc>Generated by CAMO-GEN</desc>
    
    <!-- Pattern Definition -->
    <defs>
        <pattern id="camo-pattern" x="0" y="0" width="${width}" height="${height}" patternUnits="userSpaceOnUse">
            <image href="${canvas.toDataURL('image/png')}" x="0" y="0" width="${width}" height="${height}" />
        </pattern>
    </defs>
    
    <!-- Background with pattern -->
    <rect x="0" y="0" width="${width}" height="${height}" fill="url(#camo-pattern)" />
</svg>`;
    
    return svgData;
  };

  // Enhanced direct DOM manipulation for pattern display - will run on every relevant state change
  useEffect(() => {
    // Only manipulate DOM when we have a pattern and seamless preview is enabled
    if (patternDataUrl && showSeamlessPreview) {
      debugPattern(`Direct DOM manipulation - Legacy callback`);
    }
  }, [patternDataUrl, showSeamlessPreview, tileSize, fullscreenPreview]);

  // Fix tiling issues
  useEffect(() => {
    if (patternDataUrl && showSeamlessPreview) {
      debugPattern('Updating background element');
      
      // Use a larger timeout to ensure DOM is ready
      const timeoutId = setTimeout(() => {
        const bgElement = getOrCreatePatternBackground();
        if (bgElement) {
          debugPattern('Found background element, updating styles');
          bgElement.style.backgroundImage = `url('${patternDataUrl}')`;
          bgElement.style.backgroundSize = `${tileSize}px ${tileSize}px`;
          bgElement.style.backgroundRepeat = 'repeat';
          bgElement.style.opacity = '1';
          bgElement.style.visibility = 'visible';
          bgElement.style.display = 'block';
        }
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [patternDataUrl, showSeamlessPreview, tileSize]);
  
  // Also ensure correct display when showSeamlessPreview changes
  useEffect(() => {
    if (showSeamlessPreview) {
      setTimeout(() => {
        const bgElement = getOrCreatePatternBackground();
        if (bgElement && patternDataUrl) {
          bgElement.style.backgroundImage = `url('${patternDataUrl}')`;
          bgElement.style.display = 'block';
          bgElement.style.visibility = 'visible';
          bgElement.style.opacity = '1';
          debugPattern('Showing seamless preview');
        }
      }, 50);
    } else {
      const bgElement = document.getElementById('pattern-background');
      if (bgElement) {
        bgElement.style.opacity = '0';
        bgElement.style.visibility = 'hidden';
        debugPattern('Hiding seamless preview');
      }
    }
  }, [showSeamlessPreview, patternDataUrl]);

  // Safely get pattern background element or create it if it doesn't exist
  const getOrCreatePatternBackground = () => {
    let element = document.getElementById('pattern-background');
    
    if (!element) {
      debugPattern('Creating missing pattern background element');
      const container = document.querySelector('.pattern-display-area');
      
      if (container) {
        element = document.createElement('div');
        element.id = 'pattern-background';
        element.className = 'absolute inset-0';
        element.style.position = 'absolute';
        element.style.top = '0';
        element.style.left = '0';
        element.style.width = '100%';
        element.style.height = '100%';
        element.style.zIndex = fullscreenPreview ? '20' : '15';
        
        container.appendChild(element);
        debugPattern('Successfully created new background element');
      } else {
        debugPattern('ERROR: Could not find container .pattern-display-area');
      }
    }
    
    return element;
  };
  
  // Tile size slider controls
  const adjustTileSize = (increment: boolean) => {
    const newSize = increment 
      ? Math.min(tileSize + 16, 256) 
      : Math.max(tileSize - 16, 32);
    
    setInternalTileSize(newSize);
    
    // Call the callback if provided
    if (onTileSizeChange) {
      onTileSizeChange(newSize);
    }
    
    // Immediately update the background size
    const backgroundElem = getOrCreatePatternBackground();
    if (backgroundElem) {
      backgroundElem.style.backgroundSize = `${newSize}px ${newSize}px`;
      debugPattern(`Updated tile size to ${newSize}px`);
    }
  };

  return (
    <div className={`flex flex-col ${fullscreenPreview ? 'absolute inset-0' : 'items-center justify-center'} bg-gray-900 p-0 flex-1 relative`}>
      {/* Pattern display area */}
      <div 
        className={`
          ${fullscreenPreview ? 'absolute inset-0 border-0' : 'border-4 border-white mb-4 relative md:h-[calc(100%-130px)] h-60'} 
          flex justify-center items-center overflow-hidden pattern-display-area
        `}
        style={{
          backgroundImage: !showSeamlessPreview ? 
            `linear-gradient(45deg, #333 25%, transparent 25%), 
             linear-gradient(-45deg, #333 25%, transparent 25%), 
             linear-gradient(45deg, transparent 75%, #333 75%), 
             linear-gradient(-45deg, transparent 75%, #333 75%)` 
            : 'none',
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
          zIndex: 5
        }}
      >
        {/* Static background div that will be controlled by DOM manipulation */}
        <div
          className="absolute inset-0"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: fullscreenPreview ? 20 : 15,
            display: showSeamlessPreview ? 'block' : 'none'
          }}
          id="pattern-background"
        />

        {/* Loading overlay */}
        {isGenerating && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="text-white font-bold text-2xl">Generating...</div>
          </div>
        )}

        {/* Single canvas */}
        <div className={`relative flex items-center justify-center ${showSeamlessPreview ? 'hidden' : 'w-full h-full'}`}>
          <canvas 
            ref={canvasRef} 
            width={512} 
            height={512} 
            className="max-w-full max-h-full"
          />
        </div>
        
        {/* Seamless warning */}
        {!fullscreenPreview && !isSeamless && showSeamlessPreview && (
          <div className="absolute bottom-2 bg-red-500 text-white p-2 rounded-md text-xs z-40">
            Warning: Pattern may not be perfectly seamless
          </div>
        )}
        
        {/* Tile size controls - for non-fullscreen mode */}
        {showSeamlessPreview && !fullscreenPreview && (
          <div className="absolute top-2 right-2 flex bg-gray-800 rounded-md overflow-hidden z-30">
            <button 
              className="w-8 h-8 flex items-center justify-center text-white bg-gray-700 hover:bg-gray-600"
              onClick={() => adjustTileSize(false)}
              disabled={tileSize <= 64}
            >
              -
            </button>
            <div className="w-12 h-8 flex items-center justify-center text-white text-xs">
              {tileSize}px
            </div>
            <button 
              className="w-8 h-8 flex items-center justify-center text-white bg-gray-700 hover:bg-gray-600"
              onClick={() => adjustTileSize(true)}
              disabled={tileSize >= 256}
            >
              +
            </button>
          </div>
        )}
      </div>
      
      {/* Buttons for non-fullscreen mode */}
      {!fullscreenPreview && (
        <div className="grid grid-cols-3 gap-2 w-full max-w-md mt-auto mb-10 md:mb-28">
          <button 
            className={`${showSeamlessPreview ? 'bg-gray-600' : 'bg-red-500'} text-white border-none py-3 px-4 cursor-pointer uppercase font-bold hover:bg-red-600 transition-colors relative col-span-3`}
            onClick={() => {
              setShowSeamlessPreview(!showSeamlessPreview);
            }}
            disabled={isGenerating}
          >
            {showSeamlessPreview ? "Show Original" : "Test Seamless"}
          </button>
          
          <button 
            className="bg-red-500 text-white border-none py-3 px-4 cursor-pointer uppercase font-bold hover:bg-red-600 transition-colors relative col-span-1"
            onClick={() => downloadPattern('png')}
            disabled={isGenerating}
          >
            PNG
          </button>
          <button 
            className="bg-red-500 text-white border-none py-3 px-4 cursor-pointer uppercase font-bold hover:bg-red-600 transition-colors relative col-span-1"
            onClick={() => downloadPattern('svg')}
            disabled={isGenerating}
          >
            SVG
          </button>
          <button 
            className="bg-red-500 text-white border-none py-3 px-2 text-sm cursor-pointer uppercase font-bold hover:bg-red-600 transition-colors relative col-span-1"
            onClick={() => {
              if (canvasRef.current) {
                const patternUrl = canvasRef.current.toDataURL('image/png');
                window.open(patternUrl, '_blank');
              }
            }}
            disabled={isGenerating}
          >
            Fullsize
          </button>
        </div>
      )}
      
      {/* Download status notification */}
      {downloadStatus && (
        <div className="mt-2 text-sm text-white bg-gray-800 px-4 py-2 rounded-md absolute bottom-32 md:bottom-40 z-50 left-1/2 transform -translate-x-1/2">
          {downloadStatus}
        </div>
      )}
    </div>
  );
} 