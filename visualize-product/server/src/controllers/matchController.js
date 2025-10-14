import { asyncHandler } from '../middleware/errorHandler.js';
import { ValidationError, NotFoundError } from '../middleware/errorHandler.js';
import { processImageSearch, refineSearch, recordProductClick, getSimilarProducts } from '../services/visualMatchService.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import SearchHistory from '../models/SearchHistory.js';

export const uploadAndMatch = asyncHandler(async (req, res) => {
  const { categoryId } = req.body;
  
  if (!categoryId) {
    throw new ValidationError('Category ID is required');
  }
  
  if (!req.file) {
    throw new ValidationError('Image file is required');
  }
  
  const category = await Category.findById(categoryId);
  if (!category) {
    throw new NotFoundError('Category not found');
  }
  
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedMimeTypes.includes(req.file.mimetype)) {
    throw new ValidationError('Invalid image format. Allowed: JPEG, PNG, WebP');
  }
  
  if (req.file.size > 10 * 1024 * 1024) {
    throw new ValidationError('Image size must be less than 10MB');
  }
  
  const options = {
    limit: parseInt(req.body.limit) || 20,
    minScore: parseInt(req.body.minScore) || 30,
    sortBy: req.body.sortBy || 'relevance',
    filters: {
      minPrice: req.body.minPrice ? parseFloat(req.body.minPrice) : undefined,
      maxPrice: req.body.maxPrice ? parseFloat(req.body.maxPrice) : undefined,
      brands: req.body.brands ? JSON.parse(req.body.brands) : undefined,
      inStockOnly: req.body.inStockOnly === 'true',
    },
  };
  
  const result = await processImageSearch(req.file, categoryId, options);
  
  res.status(200).json({
    success: true,
    message: 'Image processed successfully',
    data: result,
  });
});

export const refineSearchResults = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const { filters, sortBy, limit } = req.body;
  
  if (!sessionId) {
    throw new ValidationError('Session ID is required');
  }
  
  const refinements = {
    limit: limit || 20,
    sortBy: sortBy || 'relevance',
    filters: filters || {},
  };
  
  const results = await refineSearch(sessionId, refinements);
  
  res.status(200).json({
    success: true,
    message: 'Search refined successfully',
    data: {
      sessionId,
      matches: results.map(match => ({
        product: {
          id: match.product._id,
          name: match.product.name,
          slug: match.product.slug,
          image: match.product.images.primary,
          price: match.product.price,
          rating: match.product.ratings.average,
          inStock: match.product.inventory.inStock,
        },
        similarity: {
          score: match.similarityScore,
          factors: match.matchFactors,
          confidence: match.confidence,
        },
        rank: match.rank,
      })),
      totalResults: results.length,
    },
  });
});

export const trackProductClick = asyncHandler(async (req, res) => {
  const { sessionId, productId, rank } = req.body;
  
  if (!sessionId || !productId) {
    throw new ValidationError('Session ID and Product ID are required');
  }
  
  await recordProductClick(sessionId, productId, rank || 0);
  
  res.status(200).json({
    success: true,
    message: 'Click tracked successfully',
  });
});

export const getSimilar = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const limit = parseInt(req.query.limit) || 10;
  
  if (!productId) {
    throw new ValidationError('Product ID is required');
  }
  
  const product = await Product.findById(productId);
  if (!product) {
    throw new NotFoundError('Product not found');
  }
  
  const similarProducts = await getSimilarProducts(productId, limit);
  
  res.status(200).json({
    success: true,
    message: 'Similar products retrieved successfully',
    data: {
      product: {
        id: product._id,
        name: product.name,
        image: product.images.primary,
      },
      similar: similarProducts.map(match => ({
        product: {
          id: match.product._id,
          name: match.product.name,
          slug: match.product.slug,
          image: match.product.images.primary,
          price: match.product.price,
          rating: match.product.ratings.average,
        },
        similarity: {
          score: match.similarityScore,
          factors: match.matchFactors,
        },
      })),
      totalResults: similarProducts.length,
    },
  });
});

export const getSearchHistory = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  
  const searchRecord = await SearchHistory.findOne({ sessionId })
    .populate('category')
    .populate('matchResults.product');
  
  if (!searchRecord) {
    throw new NotFoundError('Search session not found');
  }
  
  res.status(200).json({
    success: true,
    message: 'Search history retrieved successfully',
    data: searchRecord,
  });
});

export const updateSearchFeedback = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const { rating, feedback, wasHelpful } = req.body;
  
  const searchRecord = await SearchHistory.findOne({ sessionId });
  
  if (!searchRecord) {
    throw new NotFoundError('Search session not found');
  }
  
  if (rating !== undefined) {
    await searchRecord.setUserSatisfaction(rating, feedback);
  }
  
  if (wasHelpful !== undefined) {
    searchRecord.searchQuality.wasHelpful = wasHelpful;
    await searchRecord.save();
  }
  
  res.status(200).json({
    success: true,
    message: 'Feedback recorded successfully',
  });
});

export const getMatchStats = asyncHandler(async (req, res) => {
  const { categoryId } = req.query;
  const { startDate, endDate } = req.query;
  
  const dateFilter = {};
  if (startDate) dateFilter.$gte = new Date(startDate);
  if (endDate) dateFilter.$lte = new Date(endDate);
  
  const match = { status: 'completed' };
  if (categoryId) match.category = categoryId;
  if (Object.keys(dateFilter).length > 0) match.createdAt = dateFilter;
  
  const stats = await SearchHistory.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalSearches: { $sum: 1 },
        avgResultsCount: { $avg: '$resultsCount' },
        avgProcessingTime: { $avg: '$performance.totalResponseTime' },
        avgSatisfaction: { $avg: '$searchQuality.userSatisfaction' },
        totalClicks: {
          $sum: { $size: '$userInteraction.clickedProducts' }
        },
      }
    },
    {
      $project: {
        _id: 0,
        totalSearches: 1,
        avgResultsCount: { $round: ['$avgResultsCount', 2] },
        avgProcessingTime: { $round: ['$avgProcessingTime', 2] },
        avgSatisfaction: { $round: ['$avgSatisfaction', 2] },
        totalClicks: 1,
        clickThroughRate: {
          $multiply: [
            { $divide: ['$totalClicks', '$totalSearches'] },
            100
          ]
        }
      }
    }
  ]);
  
  const topMatchedProducts = await SearchHistory.aggregate([
    { $match: match },
    { $unwind: '$matchResults' },
    {
      $group: {
        _id: '$matchResults.product',
        appearances: { $sum: 1 },
        avgScore: { $avg: '$matchResults.similarityScore' },
        avgRank: { $avg: '$matchResults.rank' },
      }
    },
    { $sort: { appearances: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product'
      }
    },
    { $unwind: '$product' },
    {
      $project: {
        productId: '$_id',
        productName: '$product.name',
        productImage: '$product.images.primary',
        appearances: 1,
        avgScore: { $round: ['$avgScore', 2] },
        avgRank: { $round: ['$avgRank', 2] },
      }
    }
  ]);
  
  res.status(200).json({
    success: true,
    message: 'Match statistics retrieved successfully',
    data: {
      overview: stats[0] || {},
      topMatchedProducts,
    },
  });
});

export const compareProducts = asyncHandler(async (req, res) => {
  const { productIds } = req.body;
  
  if (!productIds || !Array.isArray(productIds) || productIds.length < 2) {
    throw new ValidationError('At least 2 product IDs are required for comparison');
  }
  
  if (productIds.length > 5) {
    throw new ValidationError('Maximum 5 products can be compared at once');
  }
  
  const products = await Product.find({
    _id: { $in: productIds }
  }).lean();
  
  if (products.length !== productIds.length) {
    throw new NotFoundError('One or more products not found');
  }
  
  const comparison = products.map(product => ({
    id: product._id,
    name: product.name,
    image: product.images.primary,
    price: product.price,
    rating: product.ratings,
    visual: {
      colors: product.visual.dominantColors,
      pattern: product.visual.patterns,
      texture: product.visual.texture,
      style: product.visual.style,
    },
    attributes: product.attributes,
    inStock: product.inventory.inStock,
  }));
  
  res.status(200).json({
    success: true,
    message: 'Products compared successfully',
    data: {
      products: comparison,
      comparisonCount: products.length,
    },
  });
});

export const getBulkSimilar = asyncHandler(async (req, res) => {
  const { productIds } = req.body;
  const limit = parseInt(req.query.limit) || 5;
  
  if (!productIds || !Array.isArray(productIds)) {
    throw new ValidationError('Product IDs array is required');
  }
  
  if (productIds.length > 10) {
    throw new ValidationError('Maximum 10 products can be processed at once');
  }
  
  const results = await Promise.all(
    productIds.map(async (productId) => {
      try {
        const similar = await getSimilarProducts(productId, limit);
        return {
          productId,
          similar: similar.map(match => ({
            id: match.product._id,
            name: match.product.name,
            image: match.product.images.primary,
            price: match.product.price,
            similarityScore: match.similarityScore,
          })),
        };
      } catch (error) {
        return {
          productId,
          error: error.message,
          similar: [],
        };
      }
    })
  );
  
  res.status(200).json({
    success: true,
    message: 'Bulk similar products retrieved successfully',
    data: results,
  });
});

export default {
  uploadAndMatch,
  refineSearchResults,
  trackProductClick,
  getSimilar,
  getSearchHistory,
  updateSearchFeedback,
  getMatchStats,
  compareProducts,
  getBulkSimilar,
};
