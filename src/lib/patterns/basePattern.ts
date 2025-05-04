/**
 * Base pattern class that all pattern implementations will extend
 */

import { Pattern, PatternOptions, Context2D } from './types';
import perlin from '../utils/perlin';

export abstract class BasePattern implements Pattern {
  protected canvas: HTMLCanvasElement;
  protected ctx: Context2D;
  protected options: PatternOptions;

  constructor(canvas: HTMLCanvasElement, ctx: Context2D, options: Partial<PatternOptions> = {}) {
    this.canvas = canvas;
    this.ctx = ctx;
    
    // Set default options and merge with provided options
    this.options = {
      scale: 50,
      complexity: 50,
      colors: ['#4A7023', '#3B5323', '#78866B', '#A9BA9D', '#000000'],
      contrast: 50,
      sharpness: 50,
      ...options // Override with any provided options
    };
    
    // Initialize perlin noise with random seed
    perlin.seed(Math.random());
  }

  /**
   * Abstract generate method that all pattern classes must implement
   */
  abstract generate(): void;

  /**
   * Add noise texture to the pattern
   */
  protected addNoiseTexture(intensity: number, noiseScale: number): void {
    const { width, height } = this.canvas;
    const imageData = this.ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        
        // Generate noise value between -1 and 1
        const noise = perlin.noise2D(x * noiseScale, y * noiseScale) * 2 - 1;
        
        // Apply noise to each color channel
        data[i] = Math.max(0, Math.min(255, data[i] + noise * intensity * 255));
        data[i+1] = Math.max(0, Math.min(255, data[i+1] + noise * intensity * 255));
        data[i+2] = Math.max(0, Math.min(255, data[i+2] + noise * intensity * 255));
      }
    }
    
    this.ctx.putImageData(imageData, 0, 0);
  }

  /**
   * Helper function to convert hex color to RGB
   */
  protected hexToRgb(hex: string): { r: number, g: number, b: number } {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Parse hex values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return { r, g, b };
  }

  /**
   * Draw a rectangle that wraps around canvas edges for seamless tiling
   */
  protected drawTiledRect(x: number, y: number, width: number, height: number): void {
    const { width: canvasWidth, height: canvasHeight } = this.canvas;
    
    // Draw the rectangle at all 9 positions (3x3 grid) for seamless tiling
    for (let offsetX = -canvasWidth; offsetX <= canvasWidth; offsetX += canvasWidth) {
      for (let offsetY = -canvasHeight; offsetY <= canvasHeight; offsetY += canvasHeight) {
        this.ctx.fillRect(
          x + offsetX, 
          y + offsetY, 
          width, 
          height
        );
      }
    }
  }
} 