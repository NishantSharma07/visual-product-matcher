import sharp from 'sharp';

const COLOR_NAMES = {
  '#FF0000': 'red', '#FF4444': 'red', '#CC0000': 'dark red',
  '#FFA500': 'orange', '#FF8C00': 'dark orange', '#FFB347': 'light orange',
  '#FFFF00': 'yellow', '#FFD700': 'gold', '#FFFFE0': 'light yellow',
  '#00FF00': 'green', '#008000': 'dark green', '#90EE90': 'light green',
  '#00FFFF': 'cyan', '#008B8B': 'dark cyan', '#E0FFFF': 'light cyan',
  '#0000FF': 'blue', '#000080': 'navy', '#87CEEB': 'sky blue',
  '#800080': 'purple', '#4B0082': 'indigo', '#DA70D6': 'orchid',
  '#FFC0CB': 'pink', '#FF1493': 'deep pink', '#FFB6C1': 'light pink',
  '#A52A2A': 'brown', '#8B4513': 'saddle brown', '#D2691E': 'chocolate',
  '#000000': 'black', '#FFFFFF': 'white', '#808080': 'gray',
  '#C0C0C0': 'silver', '#FFD700': 'gold', '#F5F5DC': 'beige',
};

const rgbToHex = (r, g, b) => {
  return '#' + [r, g, b].map(x => {
    const hex = Math.round(x).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('').toUpperCase();
};

const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

const rgbToHsl = (r, g, b) => {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
};

const getColorDistance = (color1, color2) => {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return 100;
  
  const rDiff = rgb1.r - rgb2.r;
  const gDiff = rgb1.g - rgb2.g;
  const bDiff = rgb1.b - rgb2.b;
  
  return Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
};

const findClosestColorName = (hex) => {
  let closestName = 'unknown';
  let minDistance = Infinity;
  
  for (const [colorHex, colorName] of Object.entries(COLOR_NAMES)) {
    const distance = getColorDistance(hex, colorHex);
    if (distance < minDistance) {
      minDistance = distance;
      closestName = colorName;
    }
  }
  
  return closestName;
};

const quantizeColors = (pixels, numColors = 5) => {
  const colorMap = new Map();
  
  for (let i = 0; i < pixels.length; i += 4) {
    const r = Math.round(pixels[i] / 17) * 17;
    const g = Math.round(pixels[i + 1] / 17) * 17;
    const b = Math.round(pixels[i + 2] / 17) * 17;
    const a = pixels[i + 3];
    
    if (a < 128) continue;
    
    const key = `${r},${g},${b}`;
    colorMap.set(key, (colorMap.get(key) || 0) + 1);
  }
  
  const sortedColors = Array.from(colorMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, numColors);
  
  const totalPixels = sortedColors.reduce((sum, [, count]) => sum + count, 0);
  
  return sortedColors.map(([rgb, count]) => {
    const [r, g, b] = rgb.split(',').map(Number);
    const hex = rgbToHex(r, g, b);
    return {
      hex,
      rgb: { r, g, b },
      percentage: Math.round((count / totalPixels) * 100),
      count
    };
  });
};

const calculateBrightness = (pixels) => {
  let totalBrightness = 0;
  let validPixels = 0;
  
  for (let i = 0; i < pixels.length; i += 4) {
    const a = pixels[i + 3];
    if (a < 128) continue;
    
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    totalBrightness += brightness;
    validPixels++;
  }
  
  return validPixels > 0 ? Math.round((totalBrightness / validPixels) / 255 * 100) : 50;
};

const calculateContrast = (pixels) => {
  const brightnesses = [];
  
  for (let i = 0; i < pixels.length; i += 4) {
    const a = pixels[i + 3];
    if (a < 128) continue;
    
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    brightnesses.push(brightness);
  }
  
  if (brightnesses.length === 0) return 50;
  
  const avg = brightnesses.reduce((a, b) => a + b) / brightnesses.length;
  const variance = brightnesses.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / brightnesses.length;
  const stdDev = Math.sqrt(variance);
  
  return Math.min(Math.round((stdDev / 128) * 100), 100);
};

const detectColorHarmony = (colors) => {
  if (colors.length < 2) return 'monochromatic';
  
  const hues = colors.map(color => {
    const rgb = hexToRgb(color.hex);
    return rgbToHsl(rgb.r, rgb.g, rgb.b).h;
  });
  
  const hueDiffs = [];
  for (let i = 0; i < hues.length - 1; i++) {
    hueDiffs.push(Math.abs(hues[i] - hues[i + 1]));
  }
  
  const avgDiff = hueDiffs.reduce((a, b) => a + b, 0) / hueDiffs.length;
  
  if (avgDiff < 30) return 'monochromatic';
  if (avgDiff > 150) return 'complementary';
  if (avgDiff > 100) return 'triadic';
  if (avgDiff > 60) return 'analogous';
  return 'varied';
};

const isGrayscale = (colors) => {
  return colors.every(color => {
    const rgb = hexToRgb(color.hex);
    const diff = Math.max(
      Math.abs(rgb.r - rgb.g),
      Math.abs(rgb.g - rgb.b),
      Math.abs(rgb.b - rgb.r)
    );
    return diff < 20;
  });
};

const getTemperature = (colors) => {
  let warmCount = 0;
  let coolCount = 0;
  
  colors.forEach(color => {
    const rgb = hexToRgb(color.hex);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    const hue = hsl.h;
    
    if ((hue >= 0 && hue <= 60) || (hue >= 300 && hue <= 360)) {
      warmCount += color.percentage;
    } else if (hue >= 180 && hue <= 270) {
      coolCount += color.percentage;
    }
  });
  
  if (warmCount > coolCount * 1.5) return 'warm';
  if (coolCount > warmCount * 1.5) return 'cool';
  return 'neutral';
};

export const extractColors = async (imagePath, options = {}) => {
  const {
    numColors = 5,
    resizeWidth = 100,
    resizeHeight = 100,
  } = options;
  
  try {
    const startTime = Date.now();
    
    const image = sharp(imagePath);
    const metadata = await image.metadata();
    
    const { data, info } = await image
      .resize(resizeWidth, resizeHeight, { fit: 'cover' })
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    const dominantColors = quantizeColors(data, numColors);
    const brightness = calculateBrightness(data);
    const contrast = calculateContrast(data);
    const colorPalette = dominantColors.map(c => findClosestColorName(c.hex));
    const harmony = detectColorHarmony(dominantColors);
    const grayscale = isGrayscale(dominantColors);
    const temperature = getTemperature(dominantColors);
    
    const primaryColor = dominantColors[0];
    const secondaryColor = dominantColors[1] || dominantColors[0];
    
    const processingTime = Date.now() - startTime;
    
    return {
      dominantColors,
      colorPalette,
      primaryColor: {
        hex: primaryColor.hex,
        name: findClosestColorName(primaryColor.hex),
        rgb: primaryColor.rgb,
        hsl: rgbToHsl(primaryColor.rgb.r, primaryColor.rgb.g, primaryColor.rgb.b),
      },
      secondaryColor: {
        hex: secondaryColor.hex,
        name: findClosestColorName(secondaryColor.hex),
        rgb: secondaryColor.rgb,
        hsl: rgbToHsl(secondaryColor.rgb.r, secondaryColor.rgb.g, secondaryColor.rgb.b),
      },
      brightness,
      contrast,
      colorHarmony: harmony,
      isGrayscale: grayscale,
      temperature,
      imageMetadata: {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        space: metadata.space,
      },
      processingTime,
    };
  } catch (error) {
    throw new Error(`Color extraction failed: ${error.message}`);
  }
};

export const compareColors = (colors1, colors2) => {
  if (!colors1 || !colors2) return 0;
  
  let totalSimilarity = 0;
  let comparisons = 0;
  
  colors1.forEach(color1 => {
    colors2.forEach(color2 => {
      const distance = getColorDistance(color1.hex, color2.hex);
      const maxDistance = Math.sqrt(255 * 255 * 3);
      const similarity = Math.max(0, 100 - (distance / maxDistance * 100));
      totalSimilarity += similarity * (color1.percentage / 100) * (color2.percentage / 100);
      comparisons += (color1.percentage / 100) * (color2.percentage / 100);
    });
  });
  
  return comparisons > 0 ? Math.round(totalSimilarity / comparisons) : 0;
};

export const generateColorPalette = (dominantColors, count = 5) => {
  const palette = [];
  
  dominantColors.slice(0, count).forEach(color => {
    const rgb = hexToRgb(color.hex);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    
    palette.push({
      original: color.hex,
      lighter: rgbToHex(
        Math.min(rgb.r + 40, 255),
        Math.min(rgb.g + 40, 255),
        Math.min(rgb.b + 40, 255)
      ),
      darker: rgbToHex(
        Math.max(rgb.r - 40, 0),
        Math.max(rgb.g - 40, 0),
        Math.max(rgb.b - 40, 0)
      ),
      name: findClosestColorName(color.hex),
      percentage: color.percentage,
    });
  });
  
  return palette;
};

export default {
  extractColors,
  compareColors,
  generateColorPalette,
  rgbToHex,
  hexToRgb,
  rgbToHsl,
  getColorDistance,
  findClosestColorName,
};
