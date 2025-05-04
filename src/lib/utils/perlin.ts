/**
 * Perlin Noise implementation for CAMO-GEN
 * Based on Perlin's improved noise algorithm (2002)
 */

// This is a port of Ken Perlin's Java code to TypeScript
// Original: http://mrl.nyu.edu/~perlin/noise/

class PerlinNoise {
    private permutation: number[];
    private perm: number[];
    private gradP: number[][];
    
    // Skew and unskew factors for 2D, 3D
    private F2 = 0.5 * (Math.sqrt(3) - 1);
    private G2 = (3 - Math.sqrt(3)) / 6;
    private F3 = 1 / 3;
    private G3 = 1 / 6;
    
    // Gradients for 2D, 3D case
    private _grad3 = [
        [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
        [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
        [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]
    ];

    constructor() {
        this.permutation = [151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225,
            140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148,
            247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32,
            57, 177, 33, 88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175,
            74, 165, 71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122,
            60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54,
            65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169,
            200, 196, 135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64,
            52, 217, 226, 250, 124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212,
            207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42, 223, 183, 170, 213,
            119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9,
            129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104,
            218, 246, 97, 228, 251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241,
            81, 51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31, 181, 199, 106, 157,
            184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254, 138, 236, 205, 93,
            222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180];

        // Duplicate the permutation array
        this.perm = new Array(512);
        this.gradP = new Array(512);

        this.seed(0);
    }

    // This is a cheap hash function that only accepts integer inputs
    // and returns an integer result. It's used by the seed function.
    private hash(n: number): number {
        return this.permutation[n & 255];
    }

    // Seed the noise function.
    public seed(seed: number): void {
        if (seed > 0 && seed < 1) {
            // Scale the seed out
            seed *= 65536;
        }

        seed = Math.floor(seed);
        if (seed < 256) {
            seed |= seed << 8;
        }

        for (let i = 0; i < 256; i++) {
            let v;
            if (i & 1) {
                v = this.permutation[i] ^ (seed & 255);
            } else {
                v = this.permutation[i] ^ ((seed >> 8) & 255);
            }

            this.perm[i] = this.perm[i + 256] = v;
            this.gradP[i] = this.gradP[i + 256] = this._grad3[v % 12];
        }
    }

    // 2D Perlin Noise
    public noise2D(x: number, y: number): number {
        // Find unit grid cell containing point
        let X = Math.floor(x), Y = Math.floor(y);
        // Get relative coordinates of point within that cell
        x = x - X; y = y - Y;
        // Wrap the integer cells at 255 (smaller integer period)
        X = X & 255; Y = Y & 255;

        // Calculate noise contributions from each of the four corners
        const n00 = this._dot2(this.gradP[X + this.perm[Y]], x, y);
        const n01 = this._dot2(this.gradP[X + this.perm[Y + 1]], x, y - 1);
        const n10 = this._dot2(this.gradP[X + 1 + this.perm[Y]], x - 1, y);
        const n11 = this._dot2(this.gradP[X + 1 + this.perm[Y + 1]], x - 1, y - 1);

        // Compute the fade curve value for x and y
        const u = this._fade(x);
        const v = this._fade(y);

        // Interpolate the four results
        return this._lerp(
            this._lerp(n00, n10, u),
            this._lerp(n01, n11, u),
            v
        );
    }

    // Generate 2D simplex noise
    public simplex2(x: number, y: number): number {
        // Find skew factors
        const s = (x + y) * this.F2;
        let i = Math.floor(x + s);
        let j = Math.floor(y + s);
        const t = (i + j) * this.G2;
        
        // Unskew the cell origin back to (x,y) space
        const X0 = i - t;
        const Y0 = j - t;
        
        // The x,y distances from the cell origin
        const x0 = x - X0;
        const y0 = y - Y0;
        
        // Determine which simplex we are in
        let i1, j1;
        if (x0 > y0) {
            i1 = 1;
            j1 = 0;
        } else {
            i1 = 0;
            j1 = 1;
        }
        
        // Offsets for corners
        const x1 = x0 - i1 + this.G2;
        const y1 = y0 - j1 + this.G2;
        const x2 = x0 - 1.0 + 2.0 * this.G2;
        const y2 = y0 - 1.0 + 2.0 * this.G2;
        
        // Wrap indexes for permutation
        const ii = i & 255;
        const jj = j & 255;
        
        // Calculate noise contributions from each corner
        let n0, n1, n2;
        
        // Corner 1
        let t0 = 0.5 - x0 * x0 - y0 * y0;
        if (t0 < 0) {
            n0 = 0;
        } else {
            t0 *= t0;
            n0 = t0 * t0 * this._dot2(this.gradP[ii + this.perm[jj]], x0, y0);
        }
        
        // Corner 2
        let t1 = 0.5 - x1 * x1 - y1 * y1;
        if (t1 < 0) {
            n1 = 0;
        } else {
            t1 *= t1;
            n1 = t1 * t1 * this._dot2(this.gradP[ii + i1 + this.perm[jj + j1]], x1, y1);
        }
        
        // Corner 3
        let t2 = 0.5 - x2 * x2 - y2 * y2;
        if (t2 < 0) {
            n2 = 0;
        } else {
            t2 *= t2;
            n2 = t2 * t2 * this._dot2(this.gradP[ii + 1 + this.perm[jj + 1]], x2, y2);
        }
        
        // Add contributions from each corner and scale
        return 70.0 * (n0 + n1 + n2);
    }

    // 1D Perlin noise - utility for some patterns
    public noise1D(x: number): number {
        // Convert to 2D noise by using a constant y value
        return this.noise2D(x, 0.5);
    }

    // Private utility methods
    private _fade(t: number): number {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    private _lerp(a: number, b: number, t: number): number {
        return (1 - t) * a + t * b;
    }

    private _dot2(g: number[], x: number, y: number): number {
        return g[0] * x + g[1] * y;
    }
}

// Create a singleton instance
const perlin = new PerlinNoise();

export default perlin; 