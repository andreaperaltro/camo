/**
 * Urban camouflage pattern generator
 * Characterized by rectangular blocks and geometric shapes
 */

import { PatternOptions, Context2D } from './types';
import { BasePattern } from './basePattern';
import perlin from '../utils/perlin';

export default class UrbanPattern extends BasePattern {
  constructor(canvas: HTMLCanvasElement, ctx: Context2D, options: Partial<PatternOptions> = {}) {
    // Set default urban-specific options
    const urbanOptions = {
      scale: 60,
      complexity: 70,
      colors: ['#D9D9D9', '#9E9E9E', '#616161', '#212121', '#000000'],
      blockiness: 0.8,
      angularity: 0.7,
      ...options
    };
    
    super(canvas, ctx, urbanOptions);
  }
  
  generate(): void {
    const { width, height } = this.canvas;
    const { scale, complexity, colors } = this.options;
    
    // Clear canvas and fill with base color
    this.ctx.fillStyle = colors[0];
    this.ctx.fillRect(0, 0, width, height);
    
    // Urban camo has angular geometric shapes
    // Calculate pattern properties based on options
    const blockSize = scale * 0.3;
    const shapes = Math.floor(complexity * 0.4);
    
    // Generate geometric shapes for each color layer
    for (let layer = 1; layer < colors.length; layer++) {
      this.ctx.fillStyle = colors[layer];
      
      for (let i = 0; i < shapes; i++) {
        // For urban camo, we want to create a mix of rectangles, triangles, and complex polygons
        const shapeType = Math.random();
        
        if (shapeType < 0.5) {
          // Rectangular block
          this.drawUrbanRect(width, height, blockSize);
        } else if (shapeType < 0.8) {
          // Triangle
          this.drawUrbanTriangle(width, height, blockSize);
        } else {
          // Complex polygon
          this.drawUrbanPolygon(width, height, blockSize);
        }
      }
    }
    
    // Add weathered texture to make it look more realistic
    this.addUrbanTexture(0.1, 0.05);
  }
  
  /**
   * Draw a rectangular block with slight variations
   */
  private drawUrbanRect(width: number, height: number, blockSize: number): void {
    // Calculate block dimensions
    const w = blockSize * (1 + Math.random() * 3);
    const h = blockSize * (1 + Math.random() * 3);
    
    // Position randomly on canvas
    const x = Math.random() * width;
    const y = Math.random() * height;
    
    // Sometimes rotate the rectangle
    const rotation = Math.random() > 0.5 ? Math.random() * Math.PI / 4 : 0;
    
    // Set up rotation if needed
    if (rotation !== 0) {
      this.ctx.save();
      this.ctx.translate(x, y);
      this.ctx.rotate(rotation);
      
      // Draw the rotated rectangle
      this.drawTiledRect(-w/2, -h/2, w, h);
      
      this.ctx.restore();
    } else {
      // Draw normal rectangle
      this.drawTiledRect(x - w/2, y - h/2, w, h);
    }
  }
  
  /**
   * Draw a triangular shape
   */
  private drawUrbanTriangle(width: number, height: number, blockSize: number): void {
    const size = blockSize * (2 + Math.random() * 3);
    const centerX = Math.random() * width;
    const centerY = Math.random() * height;
    
    // For seamless tiling, draw at multiple positions
    for (let offsetX = -width; offsetX <= width; offsetX += width) {
      for (let offsetY = -height; offsetY <= height; offsetY += height) {
        const x = centerX + offsetX;
        const y = centerY + offsetY;
        
        this.ctx.beginPath();
        
        // Create three points for the triangle with some randomness
        const angle1 = Math.random() * Math.PI * 2;
        const angle2 = angle1 + Math.PI * (0.5 + Math.random() * 0.5);
        const angle3 = angle2 + Math.PI * (0.5 + Math.random() * 0.5);
        
        const x1 = x + Math.cos(angle1) * size;
        const y1 = y + Math.sin(angle1) * size;
        
        const x2 = x + Math.cos(angle2) * size;
        const y2 = y + Math.sin(angle2) * size;
        
        const x3 = x + Math.cos(angle3) * size;
        const y3 = y + Math.sin(angle3) * size;
        
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.lineTo(x3, y3);
        
        this.ctx.closePath();
        this.ctx.fill();
      }
    }
  }
  
  /**
   * Draw a complex polygon (4-7 sides)
   */
  private drawUrbanPolygon(width: number, height: number, blockSize: number): void {
    const size = blockSize * (1.5 + Math.random() * 2);
    const centerX = Math.random() * width;
    const centerY = Math.random() * height;
    
    // Number of sides (4-7)
    const sides = 4 + Math.floor(Math.random() * 4);
    const angleStep = (Math.PI * 2) / sides;
    
    // Add some randomness to the starting angle
    const startAngle = Math.random() * Math.PI * 2;
    
    // Draw across boundaries for seamless tiling
    for (let offsetX = -width; offsetX <= width; offsetX += width) {
      for (let offsetY = -height; offsetY <= height; offsetY += height) {
        const x = centerX + offsetX;
        const y = centerY + offsetY;
        
        this.ctx.beginPath();
        
        // Create the polygon
        for (let i = 0; i <= sides; i++) {
          const angle = startAngle + i * angleStep;
          
          // Add some controlled variation to the radius
          // Urban camo shapes should be more angular and less organic
          const radiusVariation = size * (0.8 + Math.random() * 0.4);
          const px = x + Math.cos(angle) * radiusVariation;
          const py = y + Math.sin(angle) * radiusVariation;
          
          if (i === 0) {
            this.ctx.moveTo(px, py);
          } else {
            // Use straight lines for angular look
            this.ctx.lineTo(px, py);
          }
        }
        
        this.ctx.closePath();
        this.ctx.fill();
      }
    }
  }
  
  /**
   * Add urban texture (like concrete/asphalt)
   */
  private addUrbanTexture(intensity: number, noiseScale: number): void {
    const { width, height } = this.canvas;
    const imageData = this.ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Use multiple noise frequencies for urban texture
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        
        // Generate urban texture noise (combination of different frequencies)
        const noise1 = perlin.noise2D(x * noiseScale, y * noiseScale) * 2 - 1;
        const noise2 = perlin.noise2D(x * noiseScale * 3, y * noiseScale * 3) * 2 - 1;
        const urbanNoise = (noise1 * 0.6 + noise2 * 0.4);
        
        // Apply urban noise to each color channel
        data[i] = Math.max(0, Math.min(255, data[i] + urbanNoise * intensity * 255));
        data[i+1] = Math.max(0, Math.min(255, data[i+1] + urbanNoise * intensity * 255));
        data[i+2] = Math.max(0, Math.min(255, data[i+2] + urbanNoise * intensity * 255));
      }
    }
    
    this.ctx.putImageData(imageData, 0, 0);
  }
} 