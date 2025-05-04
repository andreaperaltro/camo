/**
 * Tiger stripe camouflage pattern generator
 * Based on Vietnam-era tiger stripe patterns with characteristic dark stripes
 * on a lighter background
 */

import { PatternOptions, Context2D } from './types';
import { BasePattern } from './basePattern';
import perlin from '../utils/perlin';

export default class TigerStripePattern extends BasePattern {
  constructor(canvas: HTMLCanvasElement, ctx: Context2D, options: Partial<PatternOptions> = {}) {
    // Set default tiger stripe-specific options
    // Traditional tiger stripe uses khaki base, olive green mid-tone, and black stripes
    const tigerOptions = {
      scale: 50,
      complexity: 70,
      colors: ['#8C7E5C', '#505B35', '#000000'], // Khaki, Olive Green, Black
      orientation: 45, // diagonal orientation in degrees
      ...options
    };
    
    super(canvas, ctx, tigerOptions);
  }
  
  generate(): void {
    const { width, height } = this.canvas;
    const { scale, complexity, colors, orientation } = this.options;
    
    // Clear canvas and fill with base color (khaki)
    this.ctx.fillStyle = colors[0];
    this.ctx.fillRect(0, 0, width, height);
    
    // Calculate pattern properties based on options
    const scaleFactor = scale / 50; // normalize to default scale
    
    // Tiger stripe pattern has two main components:
    // 1. Large olive green patches that form the base of the stripes
    // 2. Smaller black stripes within and along the edges of the green areas
    
    // First generate the mid-tone olive green patches
    this.generateTigerPatches({
      color: colors[1], // Olive green
      stripeCount: 5 + Math.floor((complexity / 100) * 5), // Number of major stripe groups
      stripeWidth: 25 * scaleFactor,
      orientation: orientation || 45,
      irregularity: 0.3 + (complexity / 100) * 0.4
    });
    
    // Then add the characteristic black stripes
    if (colors.length > 2) {
      this.generateTigerStripes({
        color: colors[2], // Black
        baseColor: colors[1], // Stripe along the olive areas
        stripeWidth: 8 * scaleFactor,
        stripeDensity: 0.4 + (complexity / 100) * 0.5,
        orientation: orientation || 45,
        irregularity: 0.4 + (complexity / 100) * 0.5
      });
    }
    
    // Add subtle noise texture for realism
    const noiseIntensity = 0.05 + (complexity / 100) * 0.15;
    const noiseScale = 0.01;
    this.addNoiseTexture(noiseIntensity, noiseScale);
  }
  
  /**
   * Generate the base patches for tiger stripe pattern
   */
  private generateTigerPatches(params: {
    color: string,
    stripeCount: number,
    stripeWidth: number,
    orientation: number,
    irregularity: number
  }): void {
    const { width, height } = this.canvas;
    const { color, stripeCount, stripeWidth, orientation, irregularity } = params;
    
    this.ctx.fillStyle = color;
    
    // Calculate perpendicular direction to the stripes
    const radians = (orientation * Math.PI) / 180;
    const perpRadians = radians + Math.PI / 2;
    
    // Unit vector perpendicular to stripe direction
    const perpX = Math.cos(perpRadians);
    const perpY = Math.sin(perpRadians);
    
    // Unit vector along stripe direction
    const dirX = Math.cos(radians);
    const dirY = Math.sin(radians);
    
    // Distance between stripe centers
    const stripeSpacing = width / (stripeCount - 1);
    
    // Create a noise map for the entire canvas to ensure continuity
    const noiseMap: number[][] = [];
    const noiseScale = 0.005 + (irregularity * 0.005);
    const gridSize = 4; // Resolution of the noise grid
    
    for (let y = 0; y < gridSize; y++) {
      noiseMap[y] = [];
      for (let x = 0; x < gridSize; x++) {
        // Noise value for this cell
        noiseMap[y][x] = perlin.noise2D(x * noiseScale, y * noiseScale);
      }
    }
    
    // Function to get interpolated noise value at any point
    const getNoise = (x: number, y: number): number => {
      const gridX = (x / width) * gridSize;
      const gridY = (y / height) * gridSize;
      
      const x0 = Math.floor(gridX);
      const y0 = Math.floor(gridY);
      const x1 = Math.min(x0 + 1, gridSize - 1);
      const y1 = Math.min(y0 + 1, gridSize - 1);
      
      const sx = gridX - x0;
      const sy = gridY - y0;
      
      // Bilinear interpolation
      const n00 = noiseMap[y0]?.[x0] || 0;
      const n01 = noiseMap[y0]?.[x1] || 0;
      const n10 = noiseMap[y1]?.[x0] || 0;
      const n11 = noiseMap[y1]?.[x1] || 0;
      
      const nx0 = n00 * (1 - sx) + n01 * sx;
      const nx1 = n10 * (1 - sx) + n11 * sx;
      
      return nx0 * (1 - sy) + nx1 * sy;
    };
    
    // Generate stripe patches
    for (let i = 0; i < stripeCount; i++) {
      // Base position along the perpendicular axis
      const baseOffset = i * stripeSpacing;
      
      // Stripe points to define the patch
      const stripePoints: { x: number, y: number }[] = [];
      
      // Generate points along the stripe length
      const steps = 20; // Number of points to define the stripe
      const stepLength = Math.sqrt(width * width + height * height) / (steps - 1);
      
      for (let step = 0; step < steps; step++) {
        // Position along the stripe direction
        const t = (step - steps / 2) * stepLength;
        const baseX = width / 2 + t * dirX;
        const baseY = height / 2 + t * dirY;
        
        // Position perpendicular to stripe direction
        // Add variation to make the stripe irregular
        const perpOffset = baseOffset + getNoise(baseX, baseY) * stripeWidth * 2 * irregularity;
        
        const x = baseX + perpOffset * perpX;
        const y = baseY + perpOffset * perpY;
        
        // Add points on both sides of the stripe
        const halfWidth = stripeWidth * (0.7 + getNoise(x + 50, y + 50) * 0.6 * irregularity);
        
        stripePoints.push({
          x: x - halfWidth * perpX,
          y: y - halfWidth * perpY
        });
        
        // Insert these at the beginning to maintain proper order
        stripePoints.unshift({
          x: x + halfWidth * perpX,
          y: y + halfWidth * perpY
        });
      }
      
      // Draw the stripe patch across boundaries for seamless tiling
      for (let offsetX = -width; offsetX <= width; offsetX += width) {
        for (let offsetY = -height; offsetY <= height; offsetY += height) {
          this.ctx.beginPath();
          
          // Draw the outline of the stripe patch
          for (let p = 0; p < stripePoints.length; p++) {
            const { x, y } = stripePoints[p];
            const px = x + offsetX;
            const py = y + offsetY;
            
            if (p === 0) {
              this.ctx.moveTo(px, py);
            } else {
              this.ctx.lineTo(px, py);
            }
          }
          
          this.ctx.closePath();
          this.ctx.fill();
        }
      }
    }
  }
  
  /**
   * Generate the characteristic black stripes of tiger stripe camouflage
   */
  private generateTigerStripes(params: {
    color: string,
    baseColor: string,
    stripeWidth: number,
    stripeDensity: number,
    orientation: number,
    irregularity: number
  }): void {
    const { width, height } = this.canvas;
    const { color, baseColor, stripeWidth, stripeDensity, orientation, irregularity } = params;
    
    // Create a temporary canvas to identify the edges of the base patches
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    
    if (!tempCtx) return;
    
    // Copy the current canvas to analyze the base patches
    tempCtx.drawImage(this.canvas, 0, 0);
    const imageData = tempCtx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Convert base color to RGB for comparison
    const baseRgb = this.hexToRgb(baseColor);
    
    // Set of points that are likely to be edges of the base patches
    const edgePoints: { x: number, y: number }[] = [];
    
    // Sample grid to find potential edge points
    const sampleStep = 4; // Check every 4 pixels
    for (let y = 0; y < height; y += sampleStep) {
      for (let x = 0; x < width; x += sampleStep) {
        const idx = (y * width + x) * 4;
        
        // Check if this pixel is the base color
        const isBaseColor = (
          Math.abs(data[idx] - baseRgb.r) < 15 &&
          Math.abs(data[idx + 1] - baseRgb.g) < 15 &&
          Math.abs(data[idx + 2] - baseRgb.b) < 15
        );
        
        if (isBaseColor) {
          // Check if any neighboring pixel is not the base color (edge)
          let isEdge = false;
          
          for (let ny = -sampleStep; ny <= sampleStep; ny += sampleStep) {
            for (let nx = -sampleStep; nx <= sampleStep; nx += sampleStep) {
              // Skip the current pixel
              if (nx === 0 && ny === 0) continue;
              
              const nx2 = (x + nx + width) % width;
              const ny2 = (y + ny + height) % height;
              const nidx = (ny2 * width + nx2) * 4;
              
              const isNeighborBase = (
                Math.abs(data[nidx] - baseRgb.r) < 15 &&
                Math.abs(data[nidx + 1] - baseRgb.g) < 15 &&
                Math.abs(data[nidx + 2] - baseRgb.b) < 15
              );
              
              if (!isNeighborBase) {
                isEdge = true;
                break;
              }
            }
            if (isEdge) break;
          }
          
          // Use perlin noise to make some edges more likely to have stripes
          const noiseVal = perlin.noise2D(x * 0.01, y * 0.01);
          
          // Add edge points with some randomness based on density
          if (isEdge && Math.random() < stripeDensity && noiseVal > -0.3) {
            edgePoints.push({ x, y });
          }
        }
      }
    }
    
    // Draw black stripes along the edges
    this.ctx.fillStyle = color; // Black
    
    // Calculate stripe direction
    const radians = (orientation * Math.PI) / 180;
    const dirX = Math.cos(radians);
    const dirY = Math.sin(radians);
    
    // Draw a stripe at each edge point
    for (const { x, y } of edgePoints) {
      const stripeLength = stripeWidth * (1.5 + Math.random() * 1.5);
      const actualWidth = stripeWidth * (0.8 + Math.random() * 0.4);
      
      // Vary the stripe orientation slightly
      const angleVariation = (Math.random() - 0.5) * 0.4;
      const actualDirX = dirX * Math.cos(angleVariation) - dirY * Math.sin(angleVariation);
      const actualDirY = dirX * Math.sin(angleVariation) + dirY * Math.cos(angleVariation);
      
      // Draw the stripe with irregular edges
      this.drawTigerStripe(x, y, stripeLength, actualWidth, actualDirX, actualDirY, irregularity);
    }
  }
  
  /**
   * Draw a single tiger stripe with irregular edges
   */
  private drawTigerStripe(
    x: number, 
    y: number, 
    length: number, 
    width: number, 
    dirX: number, 
    dirY: number, 
    irregularity: number
  ): void {
    const { width: canvasWidth, height: canvasHeight } = this.canvas;
    
    // Calculate perpendicular direction
    const perpX = -dirY;
    const perpY = dirX;
    
    // Generate points for an irregular stripe
    const stripePoints: { x: number, y: number }[] = [];
    
    // Number of points on each side of the stripe
    const pointCount = 6 + Math.floor(Math.random() * 4);
    
    // Create points along one side
    for (let i = 0; i <= pointCount; i++) {
      const t = (i / pointCount - 0.5) * length;
      const baseX = x + t * dirX;
      const baseY = y + t * dirY;
      
      // Add irregularity to the width
      const noise = perlin.noise2D(baseX * 0.05, baseY * 0.05);
      const edgeVariation = width * 0.5 * irregularity * noise;
      const actualWidth = width * 0.5 + edgeVariation;
      
      stripePoints.push({
        x: baseX + perpX * actualWidth,
        y: baseY + perpY * actualWidth
      });
    }
    
    // Add points for the other side in reverse order
    for (let i = pointCount; i >= 0; i--) {
      const t = (i / pointCount - 0.5) * length;
      const baseX = x + t * dirX;
      const baseY = y + t * dirY;
      
      // Add different irregularity to the other side
      const noise = perlin.noise2D(baseX * 0.05 + 100, baseY * 0.05 + 100);
      const edgeVariation = width * 0.5 * irregularity * noise;
      const actualWidth = width * 0.5 + edgeVariation;
      
      stripePoints.push({
        x: baseX - perpX * actualWidth,
        y: baseY - perpY * actualWidth
      });
    }
    
    // Draw the stripe across boundaries for seamless tiling
    for (let offsetX = -canvasWidth; offsetX <= canvasWidth; offsetX += canvasWidth) {
      for (let offsetY = -canvasHeight; offsetY <= canvasHeight; offsetY += canvasHeight) {
        this.ctx.beginPath();
        
        for (let i = 0; i < stripePoints.length; i++) {
          const point = stripePoints[i];
          const px = point.x + offsetX;
          const py = point.y + offsetY;
          
          if (i === 0) {
            this.ctx.moveTo(px, py);
          } else {
            this.ctx.lineTo(px, py);
          }
        }
        
        this.ctx.closePath();
        this.ctx.fill();
      }
    }
  }
} 