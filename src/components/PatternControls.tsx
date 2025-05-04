"use client";

import React, { useState } from 'react';
import { PatternSettings, PatternType } from '@/lib/patterns/types';
import PatternFactory from '@/lib/patterns/patternFactory';

interface PatternControlsProps {
  settings: PatternSettings;
  onSettingsChange: (settings: Partial<PatternSettings>) => void;
  onRegenerate: () => void;
  compact?: boolean;
  tileSize?: number;
  onTileSizeChange?: (size: number) => void;
}

// Collapsible section component
const CollapsibleSection = ({ 
  title, 
  children, 
  defaultOpen = false 
}: { 
  title: string; 
  children: React.ReactNode; 
  defaultOpen?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="mb-3">
      <div 
        className="flex justify-between items-center bg-gray-800 py-2 px-2 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h2 className="uppercase font-bold text-sm tracking-wider">{title}</h2>
        <span className="text-xs">{isOpen ? '▲' : '▼'}</span>
      </div>
      <div className={`p-2 ${isOpen ? 'block' : 'hidden'}`}>
        {children}
      </div>
    </div>
  );
};

export default function PatternControls({ 
  settings, 
  onSettingsChange, 
  onRegenerate,
  compact = false,
  tileSize = 128,
  onTileSizeChange
}: PatternControlsProps) {
  // Get available pattern types
  const patternTypes = PatternFactory.getPatternTypes();
  
  // Get pattern presets
  const presets = PatternFactory.getPatternPresets();
  
  // Handle pattern type change
  const handlePatternTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as PatternType;
    
    // Get preset colors for the pattern type
    const colors = PatternFactory.getPresetColors(newType);
    
    // Get preset settings for the pattern type
    const presetSettings = presets[newType];
    
    // Update settings with new type, colors, and preset settings
    onSettingsChange({
      patternType: newType,
      colors,
      ...presetSettings
    });
  };
  
  // Handle slider changes
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>, property: keyof PatternSettings) => {
    onSettingsChange({
      [property]: parseInt(e.target.value)
    });
  };
  
  // Handle tile size change
  const handleTileSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onTileSizeChange) {
      onTileSizeChange(parseInt(e.target.value, 10));
    }
  };
  
  // Handle color changes
  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const newColors = [...settings.colors];
    newColors[index] = e.target.value;
    
    onSettingsChange({
      colors: newColors
    });
  };
  
  // Apply preset 
  const applyPreset = (presetName: PatternType) => {
    // Get preset colors for the pattern type
    const colors = PatternFactory.getPresetColors(presetName);
    
    // Get preset settings for the pattern type
    const presetSettings = presets[presetName];
    
    // Update settings with new type, colors, and preset settings
    onSettingsChange({
      patternType: presetName,
      colors,
      ...presetSettings
    });
  };

  // Compact slider component
  const Slider = ({ 
    label, 
    value, 
    min, 
    max, 
    property 
  }: { 
    label: string; 
    value: number; 
    min: number; 
    max: number; 
    property: keyof PatternSettings;
  }) => (
    <div className="mb-2">
      <div className="flex justify-between items-center text-xs mb-1">
        <span className="uppercase font-bold">{label}</span>
        <span className="font-bold bg-gray-800 px-2 py-1 rounded">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => handleSliderChange(e, property)}
        className="w-full h-4 bg-gray-900 border border-white appearance-none cursor-pointer"
      />
    </div>
  );

  return (
    <div className={`bg-gray-900 text-white p-2 ${compact ? 'w-80 max-h-[500px]' : 'w-full md:w-76 md:h-[calc(100vh-64px)]'} overflow-y-auto border-red-500 ${compact ? 'rounded-lg' : 'md:border-r-4 md:border-b-0 border-b-4'}`}>
      <CollapsibleSection title="Pattern Type" defaultOpen={true}>
        <select 
          className="w-full mb-2 h-8 bg-gray-900 text-white border border-white px-2 font-mono text-sm"
          value={settings.patternType}
          onChange={handlePatternTypeChange}
        >
          {patternTypes.map((type) => (
            <option key={type} value={type}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </option>
          ))}
        </select>
        
        <div className="grid grid-cols-2 gap-1 mb-2">
          {['woodland', 'desert', 'urban', 'digital'].map((preset) => (
            <button
              key={preset}
              className="bg-red-500 text-white border-none py-1 cursor-pointer uppercase font-bold text-xs hover:bg-red-600 transition-colors"
              onClick={() => applyPreset(preset as PatternType)}
            >
              {preset}
            </button>
          ))}
        </div>
        
        <button
          className="bg-red-500 text-white border-none py-2 cursor-pointer uppercase font-bold w-full text-sm hover:bg-red-600 transition-colors"
          onClick={onRegenerate}
        >
          GENERATE NEW
        </button>
      </CollapsibleSection>
      
      <CollapsibleSection title="Colors">
        <div className="grid grid-cols-2 gap-1">
          {settings.colors.slice(0, 4).map((color, index) => (
            <div key={index} className="mb-2">
              <label className="block mb-1 text-xs uppercase font-bold">
                {index === 0 ? 'Base' : `Color ${index+1}`}
              </label>
              <input
                type="color"
                value={color}
                onChange={(e) => handleColorChange(e, index)}
                className="w-full h-8 bg-gray-900 border border-white"
              />
            </div>
          ))}
        </div>
      </CollapsibleSection>
      
      <CollapsibleSection title="Pattern Settings" defaultOpen={true}>
        <Slider label="Scale" value={settings.scale} min={10} max={100} property="scale" />
        <Slider label="Complexity" value={settings.complexity} min={1} max={100} property="complexity" />
        <Slider label="Contrast" value={settings.contrast} min={0} max={100} property="contrast" />
        <Slider label="Sharpness" value={settings.sharpness} min={0} max={100} property="sharpness" />
      </CollapsibleSection>
      
      <CollapsibleSection title="Display Settings" defaultOpen={true}>
        <div className="mb-2">
          <div className="flex justify-between items-center text-xs mb-1">
            <span className="uppercase font-bold">Pattern Size</span>
            <span className="font-bold bg-gray-800 px-2 py-1 rounded">{tileSize}px</span>
          </div>
          <input
            type="range"
            min={32}
            max={256}
            step={8}
            value={tileSize}
            onChange={handleTileSizeChange}
            className="w-full h-4 bg-gray-900 border border-white appearance-none cursor-pointer"
          />
          <p className="text-xs text-gray-400 mt-1">
            Controls how large the pattern tiles appear on screen
          </p>
        </div>
      </CollapsibleSection>
    </div>
  );
} 