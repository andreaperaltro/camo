/**
 * Pattern Factory - Factory class to manage all pattern types
 */

import { Pattern, PatternOptions, PatternType, Context2D } from './types';

// We'll implement these imports later when we create the pattern classes
import WoodlandPattern from './woodland';
import DigitalPattern from './digital';
import TigerStripePattern from './tiger';
import DesertPattern from './desert';
import FlecktarnPattern from './flecktarn';
import UrbanPattern from './urban';

export default class PatternFactory {
  /**
   * Factory method to create the appropriate pattern instance
   */
  static createPattern(
    type: PatternType, 
    canvas: HTMLCanvasElement, 
    ctx: Context2D, 
    options: Partial<PatternOptions> = {}
  ): Pattern {
    switch (type.toLowerCase() as PatternType) {
      case 'woodland':
        return new WoodlandPattern(canvas, ctx, options);
          
      case 'digital':
        return new DigitalPattern(canvas, ctx, options);
          
      case 'tiger':
        return new TigerStripePattern(canvas, ctx, options);
          
      case 'desert':
        return new DesertPattern(canvas, ctx, options);
          
      case 'urban':
        return new UrbanPattern(canvas, ctx, options);
          
      case 'flecktarn':
        return new FlecktarnPattern(canvas, ctx, options);
          
      default:
        console.warn(`Pattern type '${type}' not recognized, defaulting to woodland`);
        return new WoodlandPattern(canvas, ctx, options);
    }
  }
  
  /**
   * Helper method to get preset colors for a pattern type
   */
  static getPresetColors(type: PatternType): string[] {
    switch (type.toLowerCase() as PatternType) {
      case 'woodland':
        return ['#4A7023', '#3B5323', '#78866B', '#A9BA9D', '#000000'];
          
      case 'desert':
        return ['#D4C09E', '#C2B280', '#A68C69', '#856D54', '#4D3B24'];
          
      case 'urban':
        return ['#D9D9D9', '#9E9E9E', '#616161', '#212121', '#000000'];
          
      case 'digital':
        return ['#445C2B', '#79573E', '#B7A998', '#1B0E00', '#000000'];
          
      case 'tiger':
        return ['#4A7023', '#3B5323', '#78866B', '#A9BA9D', '#000000'];
          
      case 'flecktarn':
        return ['#2F3D28', '#526138', '#9C8438', '#AB4E19', '#35241A'];
          
      default:
        return ['#4A7023', '#3B5323', '#78866B', '#A9BA9D', '#000000'];
    }
  }

  /**
   * Get all available pattern types
   */
  static getPatternTypes(): PatternType[] {
    return [
      'woodland',
      'desert',
      'urban',
      'digital',
      'tiger',
      'flecktarn'
    ];
  }

  /**
   * Get pattern presets
   */
  static getPatternPresets() {
    return {
      woodland: {
        scale: 50,
        complexity: 60,
        contrast: 60,
        sharpness: 50
      },
      desert: {
        scale: 40,
        complexity: 50,
        contrast: 40,
        sharpness: 40
      },
      urban: {
        scale: 60,
        complexity: 70,
        contrast: 70,
        sharpness: 60
      },
      digital: {
        scale: 30,
        complexity: 30,
        contrast: 80,
        sharpness: 90
      },
      tiger: {
        scale: 50,
        complexity: 70,
        contrast: 60,
        sharpness: 40
      },
      flecktarn: {
        scale: 40,
        complexity: 80,
        contrast: 60,
        sharpness: 50
      }
    };
  }
} 