/**
 * Utility functions for pattern generation
 */

/**
 * Wraps coordinates to ensure seamless pattern tiling
 * @param x X coordinate to wrap
 * @param y Y coordinate to wrap
 * @param width Canvas width
 * @param height Canvas height
 * @returns Wrapped coordinates
 */
export function wrapCoordinates(
  x: number, 
  y: number, 
  width: number, 
  height: number
): { x: number, y: number } {
  // Use modulo to wrap coordinates
  const wrappedX = ((x % width) + width) % width;
  const wrappedY = ((y % height) + height) % height;
  
  return { x: wrappedX, y: wrappedY };
}

/**
 * Creates a repeating grid pattern of points for seamless tiling
 * @param width Canvas width
 * @param height Canvas height
 * @param cols Number of columns
 * @param rows Number of rows
 * @param jitter Amount of random jitter to apply to points (0-1)
 * @returns Array of points { x, y }
 */
export function createSeamlessGrid(
  width: number, 
  height: number, 
  cols: number, 
  rows: number,
  jitter: number = 0
): Array<{ x: number, y: number }> {
  const points: Array<{ x: number, y: number }> = [];
  const cellWidth = width / cols;
  const cellHeight = height / rows;
  
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      // Base point coordinates at cell center
      let pointX = x * cellWidth + cellWidth / 2;
      let pointY = y * cellHeight + cellHeight / 2;
      
      // Apply jitter if specified
      if (jitter > 0) {
        // Calculate max jitter distance
        const maxJitterX = cellWidth * jitter * 0.5;
        const maxJitterY = cellHeight * jitter * 0.5;
        
        // Apply random jitter while keeping points within cells
        pointX += (Math.random() * 2 - 1) * maxJitterX;
        pointY += (Math.random() * 2 - 1) * maxJitterY;
        
        // Wrap coordinates for seamless tiling
        const wrapped = wrapCoordinates(pointX, pointY, width, height);
        pointX = wrapped.x;
        pointY = wrapped.y;
      }
      
      points.push({ x: pointX, y: pointY });
    }
  }
  
  return points;
}

/**
 * Ensures context path is seamless by duplicating path at edges
 * @param ctx Canvas context to draw with
 * @param width Canvas width
 * @param height Canvas height 
 * @param drawFn Function that creates a path
 */
export function createSeamlessPath(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  drawFn: (offsetX: number, offsetY: number) => void
): void {
  // Draw the path at the original position and at 8 surrounding positions
  // to ensure seamless tiling - creates a 3x3 grid of the pattern
  for (let offsetY = -height; offsetY <= height; offsetY += height) {
    for (let offsetX = -width; offsetX <= width; offsetX += width) {
      drawFn(offsetX, offsetY);
    }
  }
}

/**
 * Helper function to verify if a pattern is seamless
 * @param canvas Canvas element to check
 * @returns Boolean indicating if the pattern is seamless
 */
export function verifySeamless(canvas: HTMLCanvasElement): boolean {
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;
  
  const width = canvas.width;
  const height = canvas.height;
  
  // Check left-right seam
  const leftEdge = ctx.getImageData(0, 0, 1, height);
  const rightEdge = ctx.getImageData(width - 1, 0, 1, height);
  
  // Check top-bottom seam
  const topEdge = ctx.getImageData(0, 0, width, 1);
  const bottomEdge = ctx.getImageData(0, height - 1, width, 1);
  
  // Compare pixel values
  let leftRightMatch = true;
  let topBottomMatch = true;
  
  // Track mismatch count - allow some tolerance
  let mismatchCount = 0;
  const maxMismatchTolerance = Math.floor((width + height) * 0.02); // 2% tolerance
  
  // Check left-right edges
  for (let i = 0; i < height * 4; i += 4) {
    // Compare RGB values (ignoring alpha)
    for (let j = 0; j < 3; j++) {
      const leftVal = leftEdge.data[i + j];
      const rightVal = rightEdge.data[i + j];
      
      // Allow a slight tolerance in color values
      if (Math.abs(leftVal - rightVal) > 10) {
        mismatchCount++;
        if (mismatchCount > maxMismatchTolerance) {
          leftRightMatch = false;
          break;
        }
      }
    }
    if (!leftRightMatch) break;
  }
  
  // Reset mismatch count for top-bottom check
  mismatchCount = 0;
  
  // Check top-bottom edges
  for (let i = 0; i < width * 4; i += 4) {
    // Compare RGB values (ignoring alpha)
    for (let j = 0; j < 3; j++) {
      const topVal = topEdge.data[i + j];
      const bottomVal = bottomEdge.data[i + j];
      
      // Allow a slight tolerance in color values
      if (Math.abs(topVal - bottomVal) > 10) {
        mismatchCount++;
        if (mismatchCount > maxMismatchTolerance) {
          topBottomMatch = false;
          break;
        }
      }
    }
    if (!topBottomMatch) break;
  }
  
  return leftRightMatch && topBottomMatch;
} 