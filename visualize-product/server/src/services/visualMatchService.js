import { extractColors } from '../utils/colorExtractor.js';
import { analyzePattern, suggestStyle } from '../utils/patternMatcher.js';
import { rankProducts, calculateMatchConfidence, generateMatchExplanation, filterByPreferences } from '../utils/similarityCalculator.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import SearchHistory from '../models/SearchHistory.js';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

const UPLOAD_DIR = 'uploads';
const THUMBNAIL_DIR = 'uploads/thumbnails';

const ensureDirectories = async () => {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.mkdir(THUMBNAIL_DIR, { recursive: true });
};

const createThumbnail = async (imagePath, thumbnailPath) => {
  await sharp(imagePath)
    .resize(200, 200, { fit: 'cover' })
    .jpeg({ quality: 80 })
    .toFile(thumbnailPath);
  return thumbnailPath;
};

const extractImageFeatures = async (imagePath) => {
  const startTime = Date.now();
  
  const [colorData, patternData] = await Promise.all([
    extractColors(imagePath),
    analyzePattern(imagePath),
  ]);
  
  const style = suggestStyle(patternData);
  
  const processingTime = Date.now() - startTime;
  
  return {
    colors: colorData,
    pattern: patternData,
    style,
    processingTime,
  };
};

const findMatchingProducts = async (features, categoryId, options = {}) => {
  const {
    limit = 50,
    minScore = 30,
    sortBy = 'relevance',
    filters = {},
  } = options;
  
  const category = await Category.findById(categoryId);
  if (!category) {
    throw new Error('Category not found');
  }
  
  const query = {
    category: categoryId,
    'status.isActive': true,
  };
  
  if (filters.minPrice || filters.maxPrice) {
    query['price.current'] = {};
    if (filters.minPrice) query['price.current'].$gte = filters.minPrice;
    if (filters.maxPrice) query['price.current'].$lte = filters.maxPrice;
  }
  
  if (filters.brands && filters.brands.length > 0) {
    query['attributes.brand'] = { $in: filters.brands };
  }
  
  if (filters.inStockOnly) {
    query['inventory.inStock'] = true;
  }
  
  const products = await Product.find(query)
    .limit(500)
    .lean();
  
  const rankedProducts = rankProducts(features, products, {
    categorySlug: category.slug,
    minScore,
    maxResults: limit,
  });
  
  if (sortBy === 'price-low') {
    rankedProducts.sort((a, b) => a.product.price.current - b.product.price.current);
  } else if (sortBy === 'price-high') {
    rankedProducts.sort((a, b) => b.product.price.current - a.product.price.current);
  } else if (sortBy === 'popularity') {
    rankedProducts.sort((a, b) => b.product.metrics.views - a.product.metrics.views);
  } else if (sortBy === 'rating') {
    rankedProducts.sort((a, b) => b.product.ratings.average - a.product.ratings.average);
  }
  
  const enrichedResults = rankedProducts.map(item => {
    const confidence = calculateMatchConfidence(item.similarityScore, item.matchFactors);
    const explanation = generateMatchExplanation(item.matchFactors, item.weights);
    
    return {
      ...item,
      confidence,
      explanation,
    };
  });
  
  return enrichedResults;
};

export const processImageSearch = async (imageFile, categoryId, options = {}) => {
  const startTime = Date.now();
  const sessionId = `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  let searchRecord;
  let imagePath;
  let thumbnailPath;
  
  try {
    await ensureDirectories();
    
    const filename = `${Date.now()}_${imageFile.originalname}`;
    imagePath = path.join(UPLOAD_DIR, filename);
    thumbnailPath = path.join(THUMBNAIL_DIR, `thumb_${filename}`);
    
    await fs.writeFile(imagePath, imageFile.buffer);
    await createThumbnail(imagePath, thumbnailPath);
    
    const imageStats = await fs.stat(imagePath);
    
    searchRecord = new SearchHistory({
      sessionId,
      category: categoryId,
      uploadedImage: {
        url: imagePath,
        thumbnail: thumbnailPath,
        size: imageStats.size,
        mimeType: imageFile.mimetype,
      },
      status: 'processing',
    });
    await searchRecord.save();
    
    const featureExtractionStart = Date.now();
    const features = await extractImageFeatures(imagePath);
    const featureExtractionTime = Date.now() - featureExtractionStart;
    
    searchRecord.extractedFeatures = {
      dominantColors: features.colors.dominantColors,
      colorPalette: features.colors.colorPalette,
      brightness: features.colors.brightness,
      contrast: features.colors.contrast,
      detectedPatterns: [features.pattern.pattern],
      detectedTexture: features.pattern.texture,
      detectedStyle: features.style,
    };
    searchRecord.performance.featureExtractionTime = featureExtractionTime;
    await searchRecord.save();
    
    const matchingStart = Date.now();
    const matches = await findMatchingProducts(features, categoryId, options);
    const matchingTime = Date.now() - matchingStart;
    
    searchRecord.matchResults = matches.map((match, index) => ({
      product: match.product._id,
      similarityScore: match.similarityScore,
      matchFactors: match.matchFactors,
      rank: index + 1,
    }));
    searchRecord.resultsCount = matches.length;
    searchRecord.performance.matchingTime = matchingTime;
    searchRecord.performance.totalResponseTime = Date.now() - startTime;
    searchRecord.status = 'completed';
    await searchRecord.save();
    
    await Category.findByIdAndUpdate(categoryId, {
      $inc: { 'metadata.searchCount': 1 }
    });
    
    matches.forEach(async (match) => {
      await Product.findByIdAndUpdate(match.product._id, {
        $inc: { 'metrics.searches': 1 }
      });
    });
    
    return {
      sessionId,
      features: {
        colors: {
          dominant: features.colors.dominantColors,
          palette: features.colors.colorPalette,
          primary: features.colors.primaryColor,
          secondary: features.colors.secondaryColor,
          brightness: features.colors.brightness,
          contrast: features.colors.contrast,
          temperature: features.colors.temperature,
        },
        pattern: {
          type: features.pattern.pattern,
          texture: features.pattern.texture,
          complexity: features.pattern.complexity,
          symmetry: features.pattern.symmetry,
        },
        style: features.style,
      },
      matches: matches.map(match => ({
        product: {
          id: match.product._id,
          name: match.product.name,
          slug: match.product.slug,
          description: match.product.shortDescription || match.product.description,
          image: match.product.images.primary,
          price: match.product.price,
          rating: match.product.ratings.average,
          inStock: match.product.inventory.inStock,
          brand: match.product.attributes?.brand,
        },
        similarity: {
          score: match.similarityScore,
          factors: match.matchFactors,
          confidence: match.confidence,
          explanation: match.explanation,
        },
        rank: match.rank,
      })),
      metadata: {
        totalResults: matches.length,
        processingTime: Date.now() - startTime,
        category: categoryId,
      },
    };
    
  } catch (error) {
    if (searchRecord) {
      await searchRecord.recordError(error.message, 'PROCESSING_ERROR');
    }
    
    if (imagePath) {
      try {
        await fs.unlink(imagePath);
        if (thumbnailPath) await fs.unlink(thumbnailPath);
      } catch (unlinkError) {
        console.error('Error cleaning up files:', unlinkError);
      }
    }
    
    throw error;
  }
};

export const refineSearch = async (sessionId, refinements = {}) => {
  const searchRecord = await SearchHistory.findOne({ sessionId });
  
  if (!searchRecord) {
    throw new Error('Search session not found');
  }
  
  const features = {
    colors: {
      dominantColors: searchRecord.extractedFeatures.dominantColors,
      colorPalette: searchRecord.extractedFeatures.colorPalette,
      brightness: searchRecord.extractedFeatures.brightness,
      contrast: searchRecord.extractedFeatures.contrast,
    },
    pattern: {
      pattern: searchRecord.extractedFeatures.detectedPatterns[0],
      texture: searchRecord.extractedFeatures.detectedTexture,
    },
    style: searchRecord.extractedFeatures.detectedStyle,
  };
  
  const matches = await findMatchingProducts(
    features,
    searchRecord.category,
    refinements
  );
  
  searchRecord.userInteraction.refinedSearch = true;
  searchRecord.filters = refinements;
  await searchRecord.save();
  
  return matches;
};

export const recordProductClick = async (sessionId, productId, rank) => {
  const searchRecord = await SearchHistory.findOne({ sessionId });
  
  if (searchRecord) {
    await searchRecord.addClickedProduct(productId, rank);
    await Product.findByIdAndUpdate(productId, {
      $inc: { 'metrics.clicks': 1 }
    });
  }
};

export const getSimilarProducts = async (productId, limit = 10) => {
  const product = await Product.findById(productId).lean();
  
  if (!product) {
    throw new Error('Product not found');
  }
  
  const features = {
    colors: {
      dominantColors: product.visual.dominantColors,
      colorPalette: product.visual.colorPalette,
      brightness: product.visual.brightness,
      contrast: product.visual.contrast,
    },
    pattern: {
      pattern: product.visual.patterns?.[0],
      texture: product.visual.texture,
    },
    style: product.visual.style,
  };
  
  const matches = await findMatchingProducts(
    features,
    product.category,
    { limit, minScore: 50 }
  );
  
  return matches.filter(match => match.product._id.toString() !== productId.toString());
};

export const cleanupOldFiles = async (daysOld = 7) => {
  const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
  
  try {
    const files = await fs.readdir(UPLOAD_DIR);
    let deletedCount = 0;
    
    for (const file of files) {
      const filePath = path.join(UPLOAD_DIR, file);
      const stats = await fs.stat(filePath);
      
      if (stats.mtimeMs < cutoffTime) {
        await fs.unlink(filePath);
        deletedCount++;
        
        const thumbnailFile = path.join(THUMBNAIL_DIR, `thumb_${file}`);
        try {
          await fs.unlink(thumbnailFile);
        } catch (err) {
          // Thumbnail might not exist
        }
      }
    }
    
    console.log(`🗑️  Cleaned up ${deletedCount} old files`);
    return deletedCount;
  } catch (error) {
    console.error('Error during cleanup:', error);
    return 0;
  }
};

export default {
  processImageSearch,
  refineSearch,
  recordProductClick,
  getSimilarProducts,
  cleanupOldFiles,
};
