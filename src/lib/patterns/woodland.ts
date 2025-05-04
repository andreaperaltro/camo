/**
 * Woodland camouflage pattern generator
 * Based on classic military woodland patterns like US M81 Woodland and British DPM
 */

import { PatternOptions, Context2D } from './types';
import { BasePattern } from './basePattern';
import perlin from '../utils/perlin';

export default class WoodlandPattern extends BasePattern {
  constructor(canvas: HTMLCanvasElement, ctx: Context2D, options: Partial<PatternOptions> = {}) {
    // Set default woodland-specific options with colors similar to US M81 Woodland
    const woodlandOptions = {
      scale: 50,
      complexity: 50,
      colors: ['#4B5320', '#222D12', '#6B8E23', '#7B6E52', '#000000'], // Olive, Dark Green, Light Green, Brown, Black
      blendMode: 'source-over',
      ...options
    };
    
    super(canvas, ctx, woodlandOptions);
  }
  
  generate(): void {
    const { width, height } = this.canvas;
    const { scale, complexity, colors } = this.options;
    
    // Clear canvas and fill with base color (olive green)
    this.ctx.fillStyle = colors[0];
    this.ctx.fillRect(0, 0, width, height);
    
    // Calculate pattern properties based on options
    const scaleFactor = scale / 50;
    
    // Create the distinctive elongated shapes of woodland camo
    this.createWoodlandShapes({
      color: colors[1], // Dark green
      count: 6 + Math.floor((complexity / 100) * 10),
      minSize: 60 * scaleFactor,
      maxSize: 200 * scaleFactor,
      irregularity: 0.4 + (complexity / 100) * 0.4
    });
    
    // Create medium-sized light green patches
    this.createWoodlandShapes({
      color: colors[2], // Light green
      count: 8 + Math.floor((complexity / 100) * 12),
      minSize: 40 * scaleFactor,
      maxSize: 140 * scaleFactor,
      irregularity: 0.5 + (complexity / 100) * 0.3
    });
    
    // Create smaller brown patches
    this.createWoodlandShapes({
      color: colors[3], // Brown
      count: 10 + Math.floor((complexity / 100) * 15),
      minSize: 30 * scaleFactor,
      maxSize: 100 * scaleFactor,
      irregularity: 0.6 + (complexity / 100) * 0.3
    });
    
    // Add black specks and streaks for detail
    if (colors.length > 4) {
      this.createWoodlandShapes({
        color: colors[4], // Black
        count: 5 + Math.floor((complexity / 100) * 10),
        minSize: 15 * scaleFactor,
        maxSize: 60 * scaleFactor,
        irregularity: 0.7 + (complexity / 100) * 0.3,
        elongation: 0.6
      });
    }
    
    // Add subtle noise texture for realism - more texture with higher complexity
    const noiseIntensity = 0.05 + (complexity / 100) * 0.15;
    const noiseScale = 0.005 + ((100 - scale) / 100) * 0.01;
    this.addNoiseTexture(noiseIntensity, noiseScale);
  }
  
  /**
   * Create woodland camouflage shapes with specified parameters
   */
  private createWoodlandShapes(params: {
    color: string,
    count: number,
    minSize: number,
    maxSize: number,
    irregularity: number,
    elongation?: number
  }): void {
    const { width, height } = this.canvas;
    const { color, count, minSize, maxSize, irregularity, elongation = 0.4 } = params;
    
    this.ctx.fillStyle = color;
    
    // Create shapes in a grid to ensure even distribution
    const gridSize = Math.ceil(Math.sqrt(count));
    const cellWidth = width / gridSize;
    const cellHeight = height / gridSize;
    
    for (let i = 0; i < count; i++) {
      // Get grid position
      const gridX = i % gridSize;
      const gridY = Math.floor(i / gridSize);
      
      // Add randomness within the grid cell
      const centerX = (gridX + 0.3 + Math.random() * 0.4) * cellWidth;
      const centerY = (gridY + 0.3 + Math.random() * 0.4) * cellHeight;
      
      // Random size within range
      const size = minSize + Math.random() * (maxSize - minSize);
      
      // Random rotation for natural look
      const rotation = Math.random() * Math.PI * 2;
      
      // Determine shape complexity - more points = more detailed shape
      // Points between 6-12 depending on complexity and random variation
      const points = 6 + Math.floor(Math.random() * 7);
      
      // Draw shape with realistic woodland characteristics
      this.drawWoodlandShape(centerX, centerY, size, points, rotation, irregularity, elongation);
    }
  }
  
  /**
   * Draw a realistic woodland camouflage shape with specified parameters
   */
  private drawWoodlandShape(
    centerX: number, 
    centerY: number, 
    radius: number, 
    points: number,
    rotation: number,
    irregularity: number,
    elongation: number
  ): void {
    const { width, height } = this.canvas;
    const angleStep = (Math.PI * 2) / points;
    
    // Make sure shape is drawn across boundaries for seamless tiling
    for (let offsetX = -width; offsetX <= width; offsetX += width) {
      for (let offsetY = -height; offsetY <= height; offsetY += height) {
        const x = centerX + offsetX;
        const y = centerY + offsetY;
        
        this.ctx.beginPath();
        
        // Create irregular woodland shape with varying radius and elongation
        for (let i = 0; i <= points; i++) {
          const angle = i * angleStep + rotation;
          
          // Calculate elongation factor based on angle
          // This creates more stretched shapes in one direction
          const stretchFactor = 1 + elongation * Math.cos(angle * 2);
          
          // Create irregular radius with perlin noise for natural edges
          const seed = Math.cos(angle) * 0.5 + Math.sin(angle) * 0.5;
          const radiusVariation = radius * stretchFactor * (0.7 + perlin.noise2D(seed, seed * 2) * irregularity);
          
          const px = x + Math.cos(angle) * radiusVariation;
          const py = y + Math.sin(angle) * radiusVariation;
          
          if (i === 0) {
            this.ctx.moveTo(px, py);
          } else {
            // Create smoother edges for woodland pattern
            const prevAngle = (i - 1) * angleStep + rotation;
            const prevStretch = 1 + elongation * Math.cos(prevAngle * 2);
            const prevSeed = Math.cos(prevAngle) * 0.5 + Math.sin(prevAngle) * 0.5;
            const prevRadiusVariation = radius * prevStretch * (0.7 + perlin.noise2D(prevSeed, prevSeed * 2) * irregularity);
            
            const prevX = x + Math.cos(prevAngle) * prevRadiusVariation;
            const prevY = y + Math.sin(prevAngle) * prevRadiusVariation;
            
            // Calculate control point with slight randomness
            const midAngle = (angle + prevAngle) / 2;
            const cpDistance = Math.sqrt(Math.pow(px - prevX, 2) + Math.pow(py - prevY, 2)) * 0.5;
            const cpAngleVariation = (Math.random() - 0.5) * 0.5;
            
            const cpX = (prevX + px) / 2 + Math.cos(midAngle + cpAngleVariation) * cpDistance * 0.3;
            const cpY = (prevY + py) / 2 + Math.sin(midAngle + cpAngleVariation) * cpDistance * 0.3;
            
            this.ctx.quadraticCurveTo(cpX, cpY, px, py);
          }
        }
        
        this.ctx.closePath();
        this.ctx.fill();
      }
    }
  }
} 