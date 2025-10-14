import sharp from 'sharp';

const detectEdgeDensity = async (imagePath) => {
  try {
    const edges = await sharp(imagePath)
      .resize(200, 200, { fit: 'cover' })
      .greyscale()
      .convolve({
        width: 3,
        height: 3,
        kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1]
      })
      .raw()
      .toBuffer();
    
    let edgePixels = 0;
    const threshold = 50;
    
    for (let i = 0; i < edges.length; i++) {
      if (edges[i] > threshold) edgePixels++;
    }
    
    return (edgePixels / edges.length) * 100;
  } catch (error) {
    return 0;
  }
};

const detectLineOrientation = async (imagePath) => {
  try {
    const { data, info } = await sharp(imagePath)
      .resize(100, 100, { fit: 'cover' })
      .greyscale()
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    let horizontalVariance = 0;
    let verticalVariance = 0;
    
    for (let y = 0; y < info.height - 1; y++) {
      for (let x = 0; x < info.width - 1; x++) {
        const idx = y * info.width + x;
        const horizontalDiff = Math.abs(data[idx] - data[idx + 1]);
        const verticalDiff = Math.abs(data[idx] - data[idx + info.width]);
        horizontalVariance += horizontalDiff;
        verticalVariance += verticalDiff;
      }
    }
    
    const ratio = horizontalVariance / (verticalVariance + 1);
    
    if (ratio > 1.3) return 'horizontal';
    if (ratio < 0.7) return 'vertical';
    return 'mixed';
  } catch (error) {
    return 'mixed';
  }
};

const detectRepetition = async (imagePath) => {
  try {
    const { data, info } = await sharp(imagePath)
      .resize(100, 100, { fit: 'cover' })
      .greyscale()
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    const blockSize = 10;
    const blocks = [];
    
    for (let y = 0; y < info.height - blockSize; y += blockSize) {
      for (let x = 0; x < info.width - blockSize; x += blockSize) {
        const blockValues = [];
        for (let by = 0; by < blockSize; by++) {
          for (let bx = 0; bx < blockSize; bx++) {
            const idx = (y + by) * info.width + (x + bx);
            blockValues.push(data[idx]);
          }
        }
        const avg = blockValues.reduce((a, b) => a + b, 0) / blockValues.length;
        blocks.push(avg);
      }
    }
    
    let similarBlocks = 0;
    const threshold = 15;
    
    for (let i = 0; i < blocks.length; i++) {
      for (let j = i + 1; j < blocks.length; j++) {
        if (Math.abs(blocks[i] - blocks[j]) < threshold) {
          similarBlocks++;
        }
      }
    }
    
    const totalComparisons = (blocks.length * (blocks.length - 1)) / 2;
    return totalComparisons > 0 ? (similarBlocks / totalComparisons) * 100 : 0;
  } catch (error) {
    return 0;
  }
};

const detectTexture = async (imagePath) => {
  try {
    const stats = await sharp(imagePath)
      .resize(200, 200, { fit: 'cover' })
      .greyscale()
      .stats();
    
    const stdDev = stats.channels[0].stdev;
    const mean = stats.channels[0].mean;
    
    const edgeDensity = await detectEdgeDensity(imagePath);
    
    if (stdDev < 20 && edgeDensity < 10) return 'smooth';
    if (stdDev < 30 && edgeDensity < 15) return 'matte';
    if (stdDev > 80 && edgeDensity > 40) return 'rough';
    if (mean > 200 && stdDev < 25) return 'glossy';
    if (edgeDensity > 30) return 'textured';
    
    return 'plain';
  } catch (error) {
    return 'unknown';
  }
};

const detectPattern = async (imagePath) => {
  try {
    const edgeDensity = await detectEdgeDensity(imagePath);
    const repetition = await detectRepetition(imagePath);
    const orientation = await detectLineOrientation(imagePath);
    
    if (edgeDensity < 10 && repetition < 20) {
      return 'solid';
    }
    
    if (repetition > 60) {
      if (orientation === 'horizontal' || orientation === 'vertical') {
        return 'striped';
      }
      if (edgeDensity > 40) {
        return 'checked';
      }
      return 'geometric';
    }
    
    if (edgeDensity > 50 && repetition > 30) {
      return 'floral';
    }
    
    if (edgeDensity > 40 && repetition < 30) {
      return 'abstract';
    }
    
    if (edgeDensity > 25) {
      return 'textured';
    }
    
    return 'plain';
  } catch (error) {
    return 'unknown';
  }
};

const analyzeComplexity = async (imagePath) => {
  try {
    const stats = await sharp(imagePath)
      .resize(200, 200, { fit: 'cover' })
      .stats();
    
    const edgeDensity = await detectEdgeDensity(imagePath);
    const repetition = await detectRepetition(imagePath);
    
    const colorVariance = stats.channels.reduce((sum, ch) => sum + ch.stdev, 0) / stats.channels.length;
    
    const complexityScore = (edgeDensity * 0.4) + (colorVariance / 2.55 * 0.4) + ((100 - repetition) * 0.2);
    
    if (complexityScore < 20) return { level: 'simple', score: Math.round(complexityScore) };
    if (complexityScore < 40) return { level: 'moderate', score: Math.round(complexityScore) };
    if (complexityScore < 60) return { level: 'complex', score: Math.round(complexityScore) };
    return { level: 'very complex', score: Math.round(complexityScore) };
  } catch (error) {
    return { level: 'unknown', score: 0 };
  }
};

const detectSymmetry = async (imagePath) => {
  try {
    const { data, info } = await sharp(imagePath)
      .resize(100, 100, { fit: 'cover' })
      .greyscale()
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    let horizontalSymmetry = 0;
    let verticalSymmetry = 0;
    
    const midX = Math.floor(info.width / 2);
    const midY = Math.floor(info.height / 2);
    
    for (let y = 0; y < info.height; y++) {
      for (let x = 0; x < midX; x++) {
        const leftIdx = y * info.width + x;
        const rightIdx = y * info.width + (info.width - 1 - x);
        const diff = Math.abs(data[leftIdx] - data[rightIdx]);
        verticalSymmetry += (255 - diff) / 255;
      }
    }
    
    for (let x = 0; x < info.width; x++) {
      for (let y = 0; y < midY; y++) {
        const topIdx = y * info.width + x;
        const bottomIdx = (info.height - 1 - y) * info.width + x;
        const diff = Math.abs(data[topIdx] - data[bottomIdx]);
        horizontalSymmetry += (255 - diff) / 255;
      }
    }
    
    const totalPixels = info.width * info.height;
    const vSymScore = (verticalSymmetry / (midX * info.height)) * 100;
    const hSymScore = (horizontalSymmetry / (info.width * midY)) * 100;
    
    return {
      vertical: Math.round(vSymScore),
      horizontal: Math.round(hSymScore),
      overall: Math.round((vSymScore + hSymScore) / 2)
    };
  } catch (error) {
    return { vertical: 0, horizontal: 0, overall: 0 };
  }
};

const detectShapeDistribution = async (imagePath) => {
  try {
    const edgeDensity = await detectEdgeDensity(imagePath);
    const repetition = await detectRepetition(imagePath);
    
    if (edgeDensity < 15) return 'uniform';
    if (repetition > 50) return 'scattered';
    if (edgeDensity > 40 && repetition < 30) return 'random';
    return 'mixed';
  } catch (error) {
    return 'unknown';
  }
};

export const analyzePattern = async (imagePath) => {
  try {
    const startTime = Date.now();
    
    const [
      pattern,
      texture,
      complexity,
      symmetry,
      shapeDistribution,
      orientation
    ] = await Promise.all([
      detectPattern(imagePath),
      detectTexture(imagePath),
      analyzeComplexity(imagePath),
      detectSymmetry(imagePath),
      detectShapeDistribution(imagePath),
      detectLineOrientation(imagePath)
    ]);
    
    const processingTime = Date.now() - startTime;
    
    return {
      pattern,
      texture,
      complexity,
      symmetry,
      shapeDistribution,
      orientation,
      processingTime
    };
  } catch (error) {
    throw new Error(`Pattern analysis failed: ${error.message}`);
  }
};

export const comparePatterns = (pattern1, pattern2) => {
  if (!pattern1 || !pattern2) return 0;
  
  let score = 0;
  let factors = 0;
  
  if (pattern1.pattern === pattern2.pattern) {
    score += 40;
  } else if (
    (pattern1.pattern === 'solid' && pattern2.pattern === 'plain') ||
    (pattern1.pattern === 'plain' && pattern2.pattern === 'solid')
  ) {
    score += 30;
  } else if (
    (pattern1.pattern === 'striped' && pattern2.pattern === 'geometric') ||
    (pattern1.pattern === 'geometric' && pattern2.pattern === 'striped')
  ) {
    score += 25;
  }
  factors++;
  
  if (pattern1.texture === pattern2.texture) {
    score += 30;
  } else if (
    (pattern1.texture === 'smooth' && pattern2.texture === 'matte') ||
    (pattern1.texture === 'matte' && pattern2.texture === 'smooth')
  ) {
    score += 20;
  }
  factors++;
  
  const complexityDiff = Math.abs(pattern1.complexity.score - pattern2.complexity.score);
  score += Math.max(0, 20 - (complexityDiff / 5));
  factors++;
  
  const symmetryDiff = Math.abs(pattern1.symmetry.overall - pattern2.symmetry.overall);
  score += Math.max(0, 10 - (symmetryDiff / 10));
  factors++;
  
  return Math.round(score / factors * (100 / 25));
};

export const getPatternTags = (patternAnalysis) => {
  const tags = [];
  
  tags.push(patternAnalysis.pattern);
  tags.push(patternAnalysis.texture);
  tags.push(patternAnalysis.complexity.level);
  
  if (patternAnalysis.symmetry.overall > 70) {
    tags.push('symmetric');
  }
  
  if (patternAnalysis.orientation !== 'mixed') {
    tags.push(`${patternAnalysis.orientation}-lines`);
  }
  
  if (patternAnalysis.shapeDistribution !== 'unknown') {
    tags.push(patternAnalysis.shapeDistribution);
  }
  
  return tags;
};

export const suggestStyle = (patternAnalysis) => {
  const { pattern, texture, complexity } = patternAnalysis;
  
  if (pattern === 'solid' && texture === 'smooth') return 'minimalist';
  if (pattern === 'solid' && texture === 'matte') return 'modern';
  if (pattern === 'geometric' && complexity.level === 'simple') return 'contemporary';
  if (pattern === 'geometric' && complexity.level === 'complex') return 'industrial';
  if (pattern === 'floral') return 'bohemian';
  if (pattern === 'striped') return 'classic';
  if (pattern === 'abstract' && complexity.level === 'very complex') return 'artistic';
  if (texture === 'rough') return 'rustic';
  if (texture === 'glossy') return 'modern';
  
  return 'contemporary';
};

export default {
  analyzePattern,
  comparePatterns,
  getPatternTags,
  suggestStyle,
  detectPattern,
  detectTexture,
};
