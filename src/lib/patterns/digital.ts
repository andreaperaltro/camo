/**
 * Digital camouflage pattern generator
 * Based on modern military digital patterns like MARPAT and CADPAT
 */

import { PatternOptions, Context2D } from './types';
import { BasePattern } from './basePattern';
import perlin from '../utils/perlin';

export default class DigitalPattern extends BasePattern {
  constructor(canvas: HTMLCanvasElement, ctx: Context2D, options: Partial<PatternOptions> = {}) {
    // Set default digital-specific options
    const digitalOptions = {
      scale: 30,
      complexity: 30,
      colors: ['#445C2B', '#79573E', '#B7A998', '#1B0E00', '#000000'],
      blockSize: 10,
      ...options
    };
    
    super(canvas, ctx, digitalOptions);
  }
  
  generate(): void {
    const { width, height } = this.canvas;
    const { scale, complexity, colors } = this.options;
    
    // Clear canvas and fill with base color
    this.ctx.fillStyle = colors[0];
    this.ctx.fillRect(0, 0, width, height);
    
    // For digital camouflage, scale directly determines the block size
    // Smaller scale value = smaller blocks = more detail
    // Range from 3 pixels (scale 10) to 10 pixels (scale 100)
    const blockSize = Math.max(3, Math.min(10, Math.round((scale / 100) * 8) + 2));
    
    // Grid dimensions
    const cols = Math.ceil(width / blockSize);
    const rows = Math.ceil(height / blockSize);
    
    // Generate noise map for the entire canvas
    const noiseMap: number[][] = [];
    // Use complexity to determine noise resolution (higher complexity = more detailed shapes)
    const noiseScale = 0.01 + ((100 - complexity) / 100) * 0.05;
    
    // Create noise map for entire grid
    for (let y = 0; y < rows; y++) {
      noiseMap[y] = [];
      for (let x = 0; x < cols; x++) {
        // Noise value at this grid position
        noiseMap[y][x] = perlin.noise2D(x * noiseScale, y * noiseScale);
      }
    }
    
    // Process the noise map to create realistic digital shapes
    // First, quantize the noise to create more distinct areas with proper shapes
    const colorLayers = colors.length - 1; // Exclude base color
    const quantizedMap: number[][] = [];
    
    for (let y = 0; y < rows; y++) {
      quantizedMap[y] = [];
      for (let x = 0; x < cols; x++) {
        // Transform -1...1 to 0...1 range
        const normalizedNoise = (noiseMap[y][x] + 1) / 2;
        
        // Assign color layer based on noise value
        // We reverse colors so darker colors are more prevalent (like in real digital camo)
        const layer = Math.floor(normalizedNoise * (colorLayers + 1));
        quantizedMap[y][x] = Math.min(colorLayers, layer);
      }
    }
    
    // Apply cellular automata to create more realistic, clustered shapes
    // This will create the blocky, connected areas characteristic of digital camo
    const enhancedMap = this.enhanceShapes(quantizedMap, rows, cols, complexity);

    // Draw the digital pattern using the enhanced map
    for (let layer = 1; layer <= colorLayers; layer++) {
      this.ctx.fillStyle = colors[layer];
      
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          if (enhancedMap[y][x] === layer - 1) {
            // Draw this pixel as part of the current color layer
            this.drawTiledRect(x * blockSize, y * blockSize, blockSize, blockSize);
          }
        }
      }
    }
    
    // Add a subtle noise texture for realism
    const noiseIntensity = 0.02 + (complexity / 100) * 0.05;
    const noiseTextureScale = 0.5;
    this.addNoiseTexture(noiseIntensity, noiseTextureScale);
  }
  
  /**
   * Enhance the digital pattern shapes to be more realistic through cellular automata
   * This creates more coherent blocks that better resemble real digital camouflage
   */
  private enhanceShapes(
    map: number[][], 
    rows: number, 
    cols: number, 
    complexity: number
  ): number[][] {
    // Create a copy of the map
    const result: number[][] = [];
    for (let y = 0; y < rows; y++) {
      result[y] = [...map[y]];
    }
    
    // Determine number of iterations based on complexity
    // Lower complexity = fewer iterations = larger and more uniform shapes
    const iterations = Math.max(1, Math.floor(complexity / 25));
    
    // Apply cellular automata rules multiple times to create more natural looking shapes
    for (let iteration = 0; iteration < iterations; iteration++) {
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          // Get neighboring cells
          const neighbors = this.getNeighbors(map, x, y, rows, cols);
          const currentValue = map[y][x];
          
          // Count how many neighbors have the same value
          const sameNeighbors = neighbors.filter(n => n === currentValue).length;
          
          // Rules for cellular automata:
          // If a cell has many similar neighbors, it likely stays the same
          // If surrounded by mostly different neighbors, it may change
          if (sameNeighbors < 3) {
            // This cell is isolated, find most common neighbor value
            const neighborCounts = neighbors.reduce((counts: {[key: number]: number}, value) => {
              counts[value] = (counts[value] || 0) + 1;
              return counts;
            }, {});
            
            // Find the most common neighbor value
            let mostCommonValue = currentValue;
            let highestCount = 0;
            
            for (const [value, count] of Object.entries(neighborCounts)) {
              if (count > highestCount) {
                highestCount = count;
                mostCommonValue = parseInt(value);
              }
            }
            
            // Only change if the most common value is sufficiently frequent
            if (highestCount >= 4) {
              result[y][x] = mostCommonValue;
            }
          }
        }
      }
      
      // Update the map for the next iteration
      for (let y = 0; y < rows; y++) {
        map[y] = [...result[y]];
      }
    }
    
    return result;
  }
  
  /**
   * Get the values of neighboring cells in the grid with wraparound
   */
  private getNeighbors(map: number[][], x: number, y: number, rows: number, cols: number): number[] {
    const neighbors: number[] = [];
    
    // Check all 8 surrounding neighbors with wraparound
    for (let yOffset = -1; yOffset <= 1; yOffset++) {
      for (let xOffset = -1; xOffset <= 1; xOffset++) {
        // Skip the center cell
        if (xOffset === 0 && yOffset === 0) continue;
        
        // Calculate neighbor position with wraparound
        const nx = (x + xOffset + cols) % cols;
        const ny = (y + yOffset + rows) % rows;
        
        neighbors.push(map[ny][nx]);
      }
    }
    
    return neighbors;
  }
} 