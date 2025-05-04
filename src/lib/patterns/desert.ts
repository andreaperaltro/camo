/**
 * Desert camouflage pattern generator
 * Based on the woodland pattern but with desert-specific modifications
 */

import { PatternOptions, Context2D } from './types';
import WoodlandPattern from './woodland';
import perlin from '../utils/perlin';

export default class DesertPattern extends WoodlandPattern {
  constructor(canvas: HTMLCanvasElement, ctx: Context2D, options: Partial<PatternOptions> = {}) {
    // Set default desert colors if not provided
    const desertOptions = {
      colors: ['#D4C09E', '#C2B280', '#A68C69', '#856D54', '#4D3B24'],
      scale: 40,
      complexity: 50,
      noiseIntensity: 0.2,
      ...options
    };
    
    super(canvas, ctx, desertOptions);
  }
  
  generate(): void {
    const { width, height } = this.canvas;
    const { scale, complexity, colors } = this.options;
    
    // Clear canvas and fill with base color
    this.ctx.fillStyle = colors[0];
    this.ctx.fillRect(0, 0, width, height);
    
    // Calculate pattern properties based on options
    // Desert camo has larger, smoother shapes than woodland
    const scaleFactor = scale / 50;
    const noiseScale = 0.008 / scaleFactor;
    const blobCount = Math.floor(complexity * 0.5); // Less blobs than woodland
    const minSize = 50 * scaleFactor; // Larger min size
    const maxSize = 150 * scaleFactor; // Larger max size
    
    // Generate larger organic shapes for desert pattern
    // Lower layer count for desert (less colors visible at once)
    const visibleLayers = Math.min(colors.length - 1, 3);
    
    for (let layer = 1; layer <= visibleLayers; layer++) {
      this.ctx.fillStyle = colors[layer];
      
      for (let i = 0; i < blobCount; i++) {
        const centerX = Math.random() * width;
        const centerY = Math.random() * height;
        const size = minSize + Math.random() * (maxSize - minSize);
        // Fewer points for smoother shapes
        const points = 5 + Math.floor(Math.random() * 4);
        
        this.drawDesertShape(centerX, centerY, size, points);
      }
    }
    
    // Add sand texture overlay
    this.addSandTexture(0.15, noiseScale);
  }
  
  /**
   * Draw smoother desert shapes with less variation
   */
  private drawDesertShape(centerX: number, centerY: number, radius: number, points: number): void {
    const { width, height } = this.canvas;
    const angleStep = (Math.PI * 2) / points;
    
    // Make sure shape is drawn across boundaries for seamless tiling
    for (let offsetX = -width; offsetX <= width; offsetX += width) {
      for (let offsetY = -height; offsetY <= height; offsetY += height) {
        const x = centerX + offsetX;
        const y = centerY + offsetY;
        
        this.ctx.beginPath();
        
        // Create irregular shape with less variation for desert look
        for (let i = 0; i <= points; i++) {
          const angle = i * angleStep;
          // Less variation in radius for smoother shapes
          const radiusVariation = radius * (0.9 + perlin.noise2D(Math.cos(angle) * 0.5, Math.sin(angle) * 0.5) * 0.2);
          const px = x + Math.cos(angle) * radiusVariation;
          const py = y + Math.sin(angle) * radiusVariation;
          
          if (i === 0) {
            this.ctx.moveTo(px, py);
          } else {
            // Use bezier curves for even smoother shapes
            const prevAngle = (i - 1) * angleStep;
            const prevRadiusVariation = radius * (0.9 + perlin.noise2D(Math.cos(prevAngle) * 0.5, Math.sin(prevAngle) * 0.5) * 0.2);
            const prevX = x + Math.cos(prevAngle) * prevRadiusVariation;
            const prevY = y + Math.sin(prevAngle) * prevRadiusVariation;
            
            // Two control points for smoother curves
            const cp1X = prevX + (px - prevX) * 0.3;
            const cp1Y = prevY + (py - prevY) * 0.3;
            
            const cp2X = prevX + (px - prevX) * 0.7;
            const cp2Y = prevY + (py - prevY) * 0.7;
            
            this.ctx.bezierCurveTo(cp1X, cp1Y, cp2X, cp2Y, px, py);
          }
        }
        
        this.ctx.closePath();
        this.ctx.fill();
      }
    }
  }
  
  /**
   * Add a sand-like texture overlay
   */
  private addSandTexture(intensity: number, noiseScale: number): void {
    const { width, height } = this.canvas;
    const imageData = this.ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Use a different noise frequency for sand
    const sandNoiseScale = noiseScale * 5;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        
        // Generate sand noise (more fine-grained)
        const noise1 = perlin.noise2D(x * sandNoiseScale, y * sandNoiseScale) * 2 - 1;
        const noise2 = perlin.noise2D(x * sandNoiseScale * 2, y * sandNoiseScale * 2) * 2 - 1;
        const sandNoise = (noise1 * 0.7 + noise2 * 0.3);
        
        // Apply sand noise to each color channel
        data[i] = Math.max(0, Math.min(255, data[i] + sandNoise * intensity * 255));
        data[i+1] = Math.max(0, Math.min(255, data[i+1] + sandNoise * intensity * 255));
        data[i+2] = Math.max(0, Math.min(255, data[i+2] + sandNoise * intensity * 255));
      }
    }
    
    this.ctx.putImageData(imageData, 0, 0);
  }
} 