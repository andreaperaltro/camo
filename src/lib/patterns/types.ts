/**
 * Type definitions for pattern system
 */

// Base pattern options that all patterns will use
export interface PatternOptions {
  scale: number;
  complexity: number;
  colors: string[];
  contrast: number;
  sharpness: number;
  [key: string]: number | string | string[] | boolean | undefined; // More specific than 'any'
}

// Canvas context type - for proper TypeScript typing
export type Context2D = CanvasRenderingContext2D;

// Base Pattern interface that all pattern classes must implement
export interface Pattern {
  generate: () => void;
}

// Pattern types we support
export type PatternType = 
  | 'woodland'
  | 'desert'
  | 'urban'
  | 'digital'
  | 'tiger' 
  | 'flecktarn';

// Interface for pattern presets
export interface PatternPreset {
  scale: number;
  complexity: number;
  contrast: number; 
  sharpness: number;
}

// Interface for color presets
export interface ColorPreset {
  [key: string]: string[];
}

// Pattern settings for the UI
export interface PatternSettings {
  patternType: PatternType;
  scale: number;
  complexity: number;
  contrast: number;
  sharpness: number;
  colors: string[];
  _seed?: number;  // Optional property for forcing pattern regeneration
}

// Export format type
export type ExportFormat = 'png' | 'svg'; 