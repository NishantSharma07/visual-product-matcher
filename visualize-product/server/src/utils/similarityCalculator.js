import { compareColors } from './colorExtractor.js';
import { comparePatterns } from './patternMatcher.js';

const WEIGHTS = {
  color: 0.40,
  pattern: 0.25,
  brightness: 0.10,
  contrast: 0.10,
  texture: 0.10,
  style: 0.05,
};

const CATEGORY_WEIGHTS = {
  shoes: {
    color: 0.45,
    pattern: 0.20,
    texture: 0.20,
    brightness: 0.10,
    contrast: 0.05,
  },
  clothing: {
    color: 0.40,
    pattern: 0.30,
    texture: 0.15,
    brightness: 0.10,
    contrast: 0.05,
  },
  accessories: {
    color: 0.50,
    pattern: 0.20,
    brightness: 0.15,
    contrast: 0.10,
    texture: 0.05,
  },
  furniture: {
    texture: 0.30,
    color: 0.30,
    style: 0.25,
    pattern: 0.10,
    brightness: 0.05,
  },
  electronics: {
    color: 0.35,
    brightness: 0.25,
    texture: 0.20,
    contrast: 0.15,
    pattern: 0.05,
  },
};

const calculateColorSimilarity = (uploadedColors, productColors) => {
  if (!uploadedColors || !productColors) return 0;
  
  const colorScore = compareColors(
    uploadedColors.dominantColors || [],
    productColors.dominantColors || []
  );
  
  let paletteScore = 0;
  if (uploadedColors.colorPalette && productColors.colorPalette) {
    const commonColors = uploadedColors.colorPalette.filter(color =>
      productColors.colorPalette.includes(color)
    );
    paletteScore = (commonColors.length / Math.max(uploadedColors.colorPalette.length, 1)) * 100;
  }
  
  let primaryScore = 0;
  if (uploadedColors.primaryColor && productColors.primaryColor) {
    const distance = Math.abs(
      uploadedColors.primaryColor.hsl?.h - productColors.primaryColor.hsl?.h || 0
    );
    primaryScore = Math.max(0, 100 - (distance / 360 * 100));
  }
  
  let temperatureScore = 0;
  if (uploadedColors.temperature === productColors.temperature) {
    temperatureScore = 100;
  } else if (
    (uploadedColors.temperature === 'neutral') ||
    (productColors.temperature === 'neutral')
  ) {
    temperatureScore = 50;
  }
  
  return (colorScore * 0.5) + (paletteScore * 0.25) + (primaryScore * 0.15) + (temperatureScore * 0.10);
};

const calculatePatternSimilarity = (uploadedPattern, productPattern) => {
  if (!uploadedPattern || !productPattern) return 0;
  
  return comparePatterns(uploadedPattern, productPattern);
};

const calculateBrightnessSimilarity = (brightness1, brightness2) => {
  if (brightness1 === undefined || brightness2 === undefined) return 50;
  
  const diff = Math.abs(brightness1 - brightness2);
  return Math.max(0, 100 - diff);
};

const calculateContrastSimilarity = (contrast1, contrast2) => {
  if (contrast1 === undefined || contrast2 === undefined) return 50;
  
  const diff = Math.abs(contrast1 - contrast2);
  return Math.max(0, 100 - diff);
};

const calculateTextureSimilarity = (texture1, texture2) => {
  if (!texture1 || !texture2) return 50;
  
  if (texture1 === texture2) return 100;
  
  const textureGroups = {
    smooth: ['smooth', 'matte', 'glossy'],
    rough: ['rough', 'textured'],
    fabric: ['fabric'],
    material: ['leather', 'metal', 'wood', 'plastic'],
  };
  
  for (const group of Object.values(textureGroups)) {
    if (group.includes(texture1) && group.includes(texture2)) {
      return 70;
    }
  }
  
  return 30;
};

const calculateStyleSimilarity = (style1, style2) => {
  if (!style1 || !style2) return 50;
  
  if (style1 === style2) return 100;
  
  const styleGroups = {
    modern: ['modern', 'contemporary', 'minimalist'],
    traditional: ['classic', 'vintage', 'rustic'],
    artistic: ['bohemian', 'industrial', 'abstract'],
  };
  
  for (const group of Object.values(styleGroups)) {
    if (group.includes(style1) && group.includes(style2)) {
      return 75;
    }
  }
  
  return 25;
};

export const calculateSimilarity = (uploadedFeatures, product, categorySlug = 'default') => {
  const weights = CATEGORY_WEIGHTS[categorySlug] || WEIGHTS;
  
  const scores = {
    color: 0,
    pattern: 0,
    brightness: 0,
    contrast: 0,
    texture: 0,
    style: 0,
  };
  
  if (weights.color) {
    scores.color = calculateColorSimilarity(
      uploadedFeatures.colors,
      {
        dominantColors: product.visual?.dominantColors,
        colorPalette: product.visual?.colorPalette,
        primaryColor: {
          hsl: product.visual?.primaryColor ? { h: 0 } : null
        },
        temperature: product.visual?.temperature,
      }
    );
  }
  
  if (weights.pattern && uploadedFeatures.pattern) {
    scores.pattern = calculatePatternSimilarity(
      uploadedFeatures.pattern,
      {
        pattern: product.visual?.patterns?.[0],
        texture: product.visual?.texture,
        complexity: { score: 50 },
        symmetry: { overall: 50 },
      }
    );
  }
  
  if (weights.brightness) {
    scores.brightness = calculateBrightnessSimilarity(
      uploadedFeatures.colors?.brightness,
      product.visual?.brightness
    );
  }
  
  if (weights.contrast) {
    scores.contrast = calculateContrastSimilarity(
      uploadedFeatures.colors?.contrast,
      product.visual?.contrast
    );
  }
  
  if (weights.texture) {
    scores.texture = calculateTextureSimilarity(
      uploadedFeatures.pattern?.texture,
      product.visual?.texture
    );
  }
  
  if (weights.style) {
    scores.style = calculateStyleSimilarity(
      uploadedFeatures.pattern?.style || uploadedFeatures.style,
      product.visual?.style
    );
  }
  
  const totalScore = Object.keys(weights).reduce((sum, key) => {
    return sum + (scores[key] * weights[key]);
  }, 0);
  
  return {
    overallScore: Math.round(totalScore),
    breakdown: {
      color: Math.round(scores.color),
      pattern: Math.round(scores.pattern),
      brightness: Math.round(scores.brightness),
      contrast: Math.round(scores.contrast),
      texture: Math.round(scores.texture),
      style: Math.round(scores.style),
    },
    weights,
  };
};

export const rankProducts = (uploadedFeatures, products, options = {}) => {
  const {
    categorySlug = 'default',
    minScore = 0,
    maxResults = 50,
    priceWeight = 0,
    popularityWeight = 0,
  } = options;
  
  const rankedProducts = products.map(product => {
    const similarity = calculateSimilarity(uploadedFeatures, product, categorySlug);
    
    let finalScore = similarity.overallScore;
    
    if (priceWeight > 0 && product.price?.current) {
      const priceScore = Math.max(0, 100 - (product.price.current / 100));
      finalScore = (finalScore * (1 - priceWeight)) + (priceScore * priceWeight);
    }
    
    if (popularityWeight > 0 && product.metrics) {
      const popularityScore = Math.min(
        (product.metrics.views / 1000 * 50) + (product.metrics.purchases / 100 * 50),
        100
      );
      finalScore = (finalScore * (1 - popularityWeight)) + (popularityScore * popularityWeight);
    }
    
    return {
      product,
      similarityScore: Math.round(finalScore),
      matchFactors: similarity.breakdown,
      weights: similarity.weights,
    };
  });
  
  return rankedProducts
    .filter(item => item.similarityScore >= minScore)
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, maxResults)
    .map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
};

export const findBestMatches = (uploadedFeatures, products, count = 10) => {
  const ranked = rankProducts(uploadedFeatures, products, {
    maxResults: count,
    minScore: 50,
  });
  
  return ranked;
};

export const groupByMatchQuality = (rankedProducts) => {
  const groups = {
    excellent: [],
    good: [],
    fair: [],
    poor: [],
  };
  
  rankedProducts.forEach(item => {
    if (item.similarityScore >= 85) groups.excellent.push(item);
    else if (item.similarityScore >= 70) groups.good.push(item);
    else if (item.similarityScore >= 50) groups.fair.push(item);
    else groups.poor.push(item);
  });
  
  return groups;
};

export const calculateMatchConfidence = (similarityScore, matchFactors) => {
  const factorVariance = Object.values(matchFactors).reduce((sum, score) => {
    return sum + Math.abs(score - similarityScore);
  }, 0) / Object.keys(matchFactors).length;
  
  const consistencyScore = Math.max(0, 100 - factorVariance);
  const confidence = (similarityScore * 0.7) + (consistencyScore * 0.3);
  
  if (confidence >= 85) return { level: 'very high', score: Math.round(confidence) };
  if (confidence >= 70) return { level: 'high', score: Math.round(confidence) };
  if (confidence >= 50) return { level: 'medium', score: Math.round(confidence) };
  return { level: 'low', score: Math.round(confidence) };
};

export const generateMatchExplanation = (matchFactors, weights) => {
  const explanations = [];
  
  const sortedFactors = Object.entries(matchFactors)
    .sort(([, a], [, b]) => b - a)
    .filter(([key]) => weights[key] > 0);
  
  sortedFactors.forEach(([factor, score]) => {
    if (score >= 80) {
      explanations.push(`Excellent ${factor} match (${score}%)`);
    } else if (score >= 60) {
      explanations.push(`Good ${factor} similarity (${score}%)`);
    } else if (score >= 40) {
      explanations.push(`Moderate ${factor} match (${score}%)`);
    }
  });
  
  if (explanations.length === 0) {
    explanations.push('Limited visual similarity detected');
  }
  
  return explanations;
};

export const filterByPreferences = (rankedProducts, preferences = {}) => {
  let filtered = [...rankedProducts];
  
  if (preferences.minPrice !== undefined) {
    filtered = filtered.filter(item => 
      item.product.price?.current >= preferences.minPrice
    );
  }
  
  if (preferences.maxPrice !== undefined) {
    filtered = filtered.filter(item => 
      item.product.price?.current <= preferences.maxPrice
    );
  }
  
  if (preferences.brands && preferences.brands.length > 0) {
    filtered = filtered.filter(item =>
      preferences.brands.includes(item.product.attributes?.brand)
    );
  }
  
  if (preferences.minRating !== undefined) {
    filtered = filtered.filter(item =>
      item.product.ratings?.average >= preferences.minRating
    );
  }
  
  if (preferences.inStockOnly) {
    filtered = filtered.filter(item => item.product.inventory?.inStock);
  }
  
  return filtered;
};

export default {
  calculateSimilarity,
  rankProducts,
  findBestMatches,
  groupByMatchQuality,
  calculateMatchConfidence,
  generateMatchExplanation,
  filterByPreferences,
};
