/**
 * Flecktarn camouflage pattern generator
 * Based on the German Bundeswehr "Flecktarnmuster" (spot camouflage pattern)
 * Characterized by small, irregular spots of color
 */

import { PatternOptions, Context2D } from './types';
import { BasePattern } from './basePattern';
import perlin from '../utils/perlin';

export default class FlecktarnPattern extends BasePattern {
  constructor(canvas: HTMLCanvasElement, ctx: Context2D, options: Partial<PatternOptions> = {}) {
    // Set default flecktarn-specific options
    // German Flecktarn uses 5 colors: light green (base), dark green, brown, black, and beige
    const flecktarnOptions = {
      scale: 40,
      complexity: 80,
      colors: ['#4D5D2F', '#313C14', '#6B4C30', '#929367', '#000000'],
      blendMode: 'source-over',
      ...options
    };
    
    super(canvas, ctx, flecktarnOptions);
  }
  
  generate(): void {
    const { width, height } = this.canvas;
    const { scale, complexity, colors } = this.options;
    
    // Clear canvas and fill with base color (light green)
    this.ctx.fillStyle = colors[0];
    this.ctx.fillRect(0, 0, width, height);
    
    // Calculate pattern properties based on options
    // Flecktarn is characterized by small, irregular dots/spots
    // Scale affects spot size, complexity affects density and irregularity
    const scaleFactor = scale / 40; // normalize to default scale
    
    // Generate spots/flecks for each layer
    // First dark green spots (larger)
    this.generateFlecktarnSpots({
      color: colors[1], // Dark green
      count: 500 + Math.floor((complexity / 100) * 300),
      minSize: 5 * scaleFactor,
      maxSize: 12 * scaleFactor,
      irregularity: 0.4 + (complexity / 100) * 0.4
    });
    
    // Brown spots (medium)
    this.generateFlecktarnSpots({
      color: colors[2], // Brown
      count: 400 + Math.floor((complexity / 100) * 300),
      minSize: 4 * scaleFactor,
      maxSize: 10 * scaleFactor,
      irregularity: 0.5 + (complexity / 100) * 0.3
    });
    
    // Beige/light spots (medium-small)
    this.generateFlecktarnSpots({
      color: colors[3], // Beige/light
      count: 350 + Math.floor((complexity / 100) * 250),
      minSize: 3 * scaleFactor,
      maxSize: 9 * scaleFactor,
      irregularity: 0.5 + (complexity / 100) * 0.3
    });
    
    // Black spots (smallest)
    if (colors.length > 4) {
      this.generateFlecktarnSpots({
        color: colors[4], // Black
        count: 300 + Math.floor((complexity / 100) * 200),
        minSize: 2 * scaleFactor,
        maxSize: 7 * scaleFactor,
        irregularity: 0.6 + (complexity / 100) * 0.3
      });
    }
    
    // Add subtle noise texture for realism
    const noiseIntensity = 0.05 + (complexity / 100) * 0.1;
    const noiseScale = 0.01;
    this.addNoiseTexture(noiseIntensity, noiseScale);
  }
  
  /**
   * Generate Flecktarn spots with specified parameters
   */
  private generateFlecktarnSpots(params: {
    color: string,
    count: number,
    minSize: number,
    maxSize: number,
    irregularity: number
  }): void {
    const { width, height } = this.canvas;
    const { color, count, minSize, maxSize, irregularity } = params;
    
    this.ctx.fillStyle = color;
    
    // Generate spots using noise-controlled positions for natural clustering
    // We'll create multiple passes with different noise scales to create natural clustering
    const positions: {x: number, y: number, size: number}[] = [];
    
    // Generate potential positions (more than we need)
    const potentialPositions = count * 2;
    const noiseScale = 0.01 + irregularity * 0.02;
    
    // First pass: generate candidate positions
    for (let i = 0; i < potentialPositions; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      
      // Use perlin noise to determine if we should place a spot here
      // This creates natural clustering like real Flecktarn
      const noiseVal = perlin.noise2D(x * noiseScale, y * noiseScale);
      
      // Higher irregularity = more randomness in distribution
      if (noiseVal > -0.2 + irregularity * 0.3) {
        const size = minSize + Math.random() * (maxSize - minSize);
        positions.push({ x, y, size });
      }
    }
    
    // If we have more positions than needed, shuffle and take only what we need
    if (positions.length > count) {
      // Fisher-Yates shuffle
      for (let i = positions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [positions[i], positions[j]] = [positions[j], positions[i]];
      }
      positions.length = count;
    }
    
    // Draw the spots
    for (const { x, y, size } of positions) {
      this.drawFlecktarnSpot(x, y, size, irregularity);
    }
  }
  
  /**
   * Draw a single Flecktarn spot with the characteristic irregular shape
   */
  private drawFlecktarnSpot(centerX: number, centerY: number, radius: number, irregularity: number): void {
    const { width, height } = this.canvas;
    
    // Flecktarn spots are irregular with 5-9 points
    const points = 5 + Math.floor(Math.random() * 5);
    const angleStep = (Math.PI * 2) / points;
    
    // Make sure spot is drawn across boundaries for seamless tiling
    for (let offsetX = -width; offsetX <= width; offsetX += width) {
      for (let offsetY = -height; offsetY <= height; offsetY += height) {
        const x = centerX + offsetX;
        const y = centerY + offsetY;
        
        this.ctx.beginPath();
        
        // Create the irregular spot shape
        for (let i = 0; i <= points; i++) {
          const angle = i * angleStep + Math.random() * 0.2; // Slight angle variation
          
          // Create irregular radius with perlin noise
          const seed = Math.cos(angle) * 0.5 + Math.sin(angle) * 0.5;
          const radiusVariation = radius * (0.6 + perlin.noise2D(seed, seed * 2) * irregularity);
          
          const px = x + Math.cos(angle) * radiusVariation;
          const py = y + Math.sin(angle) * radiusVariation;
          
          if (i === 0) {
            this.ctx.moveTo(px, py);
          } else {
            // For Flecktarn, we want somewhat jagged edges, not too smooth
            const prevAngle = (i - 1) * angleStep + Math.random() * 0.2;
            const prevSeed = Math.cos(prevAngle) * 0.5 + Math.sin(prevAngle) * 0.5;
            const prevRadiusVariation = radius * (0.6 + perlin.noise2D(prevSeed, prevSeed * 2) * irregularity);
            
            const prevX = x + Math.cos(prevAngle) * prevRadiusVariation;
            const prevY = y + Math.sin(prevAngle) * prevRadiusVariation;
            
            // Use a mix of linear and curved segments
            if (Math.random() > 0.5) {
              // Linear segment for some jaggedness
              this.ctx.lineTo(px, py);
            } else {
              // Slight curve for some variety
              const cpX = (prevX + px) / 2 + (Math.random() - 0.5) * radius * 0.3;
              const cpY = (prevY + py) / 2 + (Math.random() - 0.5) * radius * 0.3;
              this.ctx.quadraticCurveTo(cpX, cpY, px, py);
            }
          }
        }
        
        this.ctx.closePath();
        this.ctx.fill();
      }
    }
  }
} 