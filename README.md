# CAMO-GEN: Seamless Camouflage Pattern Generator

CAMO-GEN is a advanced web application for generating and customizing seamless camouflage patterns for design, art, and gaming applications.

## Features

- **Multiple Pattern Types**: Including Woodland, Desert, Urban, Digital, Tiger Stripe, and Flecktarn.
- **Seamless Pattern Generation**: Create patterns that can be tiled without visible seams.
- **Real-time Customization**: Adjust scale, complexity, contrast, and sharpness to perfect your pattern.
- **Color Customization**: Customize the color palette for any pattern.
- **Pattern Gallery**: Save your favorite patterns for later use.
- **Export Options**: Download patterns as PNG or SVG files.
- **Full-screen Preview**: View your patterns in a tiled grid to see how they repeat.
- **Responsive Design**: Works on desktop and mobile devices.

## Technical Improvements

The application has been significantly improved from the original version:

1. **Performance Optimization**:
   - Added memoization with useCallback to prevent unnecessary renders
   - Implemented prevSettingsRef to compare settings and only regenerate when actual changes occur
   - Added proper patterns tiling using div elements instead of CSS background-image

2. **UI Enhancements**:
   - Created collapsible sections with toggle buttons
   - Added full-screen mode with a floating toolbar
   - Implemented a gallery at the bottom of the screen

3. **Pattern Generation**:
   - Enhanced all pattern algorithms to be more responsive to settings
   - Added seamless pattern verification
   - Improved edge handling for seamless tiling

4. **Stability**:
   - Added error handling for pattern generation
   - Improved download functionality with status indicators
   - Fixed issues with canvas resizing and window dimensions

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn

### Installation

1. Clone the repository:
```
git clone https://github.com/yourusername/camo-gen.git
cd camo-gen/camo-gen-next-fixed
```

2. Install dependencies:
```
npm install
```

3. Start the development server:
```
npm run dev
```

4. Open your browser to http://localhost:3000

## Usage

1. **Select a Pattern Type**: Choose from Woodland, Desert, Urban, Digital, etc.
2. **Customize Settings**: Adjust scale, complexity, contrast, and sharpness.
3. **Change Colors**: Modify the color palette to suit your needs.
4. **Preview**: Toggle the seamless preview to see how the pattern will tile.
5. **Export**: Download your pattern as PNG or SVG.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Pattern algorithms inspired by real-world camouflage designs
- Perlin noise implementation adapted from p5.js
