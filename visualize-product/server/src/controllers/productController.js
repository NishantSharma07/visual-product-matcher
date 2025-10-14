import { asyncHandler } from '../middleware/errorHandler.js';
import { ValidationError, NotFoundError, ConflictError } from '../middleware/errorHandler.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';

export const getAllProducts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, sort = '-createdAt', active } = req.query;
  
  const query = {};
  if (active === 'true') query['status.isActive'] = true;
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const products = await Product.find(query)
    .populate('category')
    .sort(sort)
    .limit(parseInt(limit))
    .skip(skip)
    .lean();
  
  const total = await Product.countDocuments(query);
  
  res.status(200).json({
    success: true,
    message: 'Products retrieved successfully',
    data: {
      products,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    },
  });
});

export const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const product = await Product.findById(id).populate('category');
  
  if (!product) {
    throw new NotFoundError('Product not found');
  }
  
  await product.incrementView();
  
  res.status(200).json({
    success: true,
    message: 'Product retrieved successfully',
    data: product,
  });
});

export const getProductBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  
  const product = await Product.findOne({ slug }).populate('category');
  
  if (!product) {
    throw new NotFoundError('Product not found');
  }
  
  await product.incrementView();
  
  res.status(200).json({
    success: true,
    message: 'Product retrieved successfully',
    data: product,
  });
});

export const createProduct = asyncHandler(async (req, res) => {
  const { name, category, images, price } = req.body;
  
  if (!name || !category || !images?.primary || !price?.current) {
    throw new ValidationError('Name, category, primary image, and price are required');
  }
  
  const categoryExists = await Category.findById(category);
  if (!categoryExists) {
    throw new NotFoundError('Category not found');
  }
  
  const product = await Product.create(req.body);
  
  await Category.findByIdAndUpdate(category, {
    $inc: { 'metadata.productCount': 1 }
  });
  
  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: product,
  });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  const product = await Product.findById(id);
  
  if (!product) {
    throw new NotFoundError('Product not found');
  }
  
  if (updates.category && updates.category !== product.category.toString()) {
    const categoryExists = await Category.findById(updates.category);
    if (!categoryExists) {
      throw new NotFoundError('New category not found');
    }
    
    await Category.findByIdAndUpdate(product.category, {
      $inc: { 'metadata.productCount': -1 }
    });
    await Category.findByIdAndUpdate(updates.category, {
      $inc: { 'metadata.productCount': 1 }
    });
  }
  
  Object.keys(updates).forEach(key => {
    if (updates[key] !== undefined) {
      product[key] = updates[key];
    }
  });
  
  await product.save();
  
  res.status(200).json({
    success: true,
    message: 'Product updated successfully',
    data: product,
  });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const product = await Product.findById(id);
  
  if (!product) {
    throw new NotFoundError('Product not found');
  }
  
  await Category.findByIdAndUpdate(product.category, {
    $inc: { 'metadata.productCount': -1 }
  });
  
  await Product.findByIdAndDelete(id);
  
  res.status(200).json({
    success: true,
    message: 'Product deleted successfully',
  });
});

export const getFeaturedProducts = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  
  const products = await Product.findFeatured(limit);
  
  res.status(200).json({
    success: true,
    message: 'Featured products retrieved successfully',
    count: products.length,
    data: products,
  });
});

export const getTrendingProducts = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  
  const products = await Product.findTrending(limit);
  
  res.status(200).json({
    success: true,
    message: 'Trending products retrieved successfully',
    count: products.length,
    data: products,
  });
});

export const getNewProducts = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  
  const products = await Product.find({
    'status.isNew': true,
    'status.isActive': true,
  })
    .populate('category')
    .sort('-createdAt')
    .limit(limit);
  
  res.status(200).json({
    success: true,
    message: 'New products retrieved successfully',
    count: products.length,
    data: products,
  });
});

export const getBestsellerProducts = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  
  const products = await Product.find({
    'status.isBestseller': true,
    'status.isActive': true,
  })
    .populate('category')
    .sort('-metrics.purchases')
    .limit(limit);
  
  res.status(200).json({
    success: true,
    message: 'Bestseller products retrieved successfully',
    count: products.length,
    data: products,
  });
});

export const searchProducts = asyncHandler(async (req, res) => {
  const { query, limit, page, categoryId } = req.query;
  
  if (!query) {
    throw new ValidationError('Search query is required');
  }
  
  const products = await Product.searchProducts(query, {
    limit: parseInt(limit) || 20,
    skip: ((parseInt(page) || 1) - 1) * (parseInt(limit) || 20),
    categoryId,
  });
  
  res.status(200).json({
    success: true,
    message: 'Search completed successfully',
    count: products.length,
    data: products,
  });
});

export const getProductsByCategory = asyncHandler(async (req, res) => {
  const { categoryId } = req.params;
  const { limit = 20, page = 1, sort = '-createdAt' } = req.query;
  
  const category = await Category.findById(categoryId);
  if (!category) {
    throw new NotFoundError('Category not found');
  }
  
  const products = await Product.findByCategory(categoryId, {
    limit: parseInt(limit),
    skip: ((parseInt(page) - 1) * parseInt(limit)),
    sort,
  });
  
  const total = await Product.countDocuments({
    category: categoryId,
    'status.isActive': true,
  });
  
  res.status(200).json({
    success: true,
    message: 'Products retrieved successfully',
    data: {
      category: {
        id: category._id,
        name: category.name,
        slug: category.slug,
      },
      products,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    },
  });
});

export const getProductsByPriceRange = asyncHandler(async (req, res) => {
  const { min, max, categoryId } = req.query;
  
  if (!min || !max) {
    throw new ValidationError('Min and max price are required');
  }
  
  const products = await Product.findByPriceRange(
    parseFloat(min),
    parseFloat(max),
    categoryId
  );
  
  res.status(200).json({
    success: true,
    message: 'Products retrieved successfully',
    count: products.length,
    data: products,
  });
});

export const getProductsByColor = asyncHandler(async (req, res) => {
  const { color } = req.params;
  const { categoryId, limit = 20 } = req.query;
  
  const products = await Product.findByColor(color, categoryId);
  
  res.status(200).json({
    success: true,
    message: 'Products retrieved successfully',
    count: products.length,
    data: products.slice(0, parseInt(limit)),
  });
});

export const filterProducts = asyncHandler(async (req, res) => {
  const {
    categoryId,
    minPrice,
    maxPrice,
    colors,
    brands,
    sizes,
    inStockOnly,
    minRating,
    page = 1,
    limit = 20,
    sort = '-createdAt',
  } = req.query;
  
  const query = { 'status.isActive': true };
  
  if (categoryId) query.category = categoryId;
  
  if (minPrice || maxPrice) {
    query['price.current'] = {};
    if (minPrice) query['price.current'].$gte = parseFloat(minPrice);
    if (maxPrice) query['price.current'].$lte = parseFloat(maxPrice);
  }
  
  if (colors) {
    const colorArray = colors.split(',');
    query['visual.primaryColor'] = { $in: colorArray };
  }
  
  if (brands) {
    const brandArray = brands.split(',');
    query['attributes.brand'] = { $in: brandArray };
  }
  
  if (sizes) {
    const sizeArray = sizes.split(',');
    query['attributes.size.value'] = { $in: sizeArray };
  }
  
  if (inStockOnly === 'true') {
    query['inventory.inStock'] = true;
  }
  
  if (minRating) {
    query['ratings.average'] = { $gte: parseFloat(minRating) };
  }
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const products = await Product.find(query)
    .populate('category')
    .sort(sort)
    .limit(parseInt(limit))
    .skip(skip);
  
  const total = await Product.countDocuments(query);
  
  res.status(200).json({
    success: true,
    message: 'Filtered products retrieved successfully',
    data: {
      products,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    },
  });
});

export const bulkUpdateProducts = asyncHandler(async (req, res) => {
  const { productIds, updates } = req.body;
  
  if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
    throw new ValidationError('Product IDs array is required');
  }
  
  if (!updates || typeof updates !== 'object') {
    throw new ValidationError('Updates object is required');
  }
  
  const result = await Product.updateMany(
    { _id: { $in: productIds } },
    { $set: updates }
  );
  
  res.status(200).json({
    success: true,
    message: 'Products updated successfully',
    data: {
      matched: result.matchedCount,
      modified: result.modifiedCount,
    },
  });
});

export const updateProductStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isActive, isFeatured, isNew, isBestseller, isTrending } = req.body;
  
  const product = await Product.findById(id);
  
  if (!product) {
    throw new NotFoundError('Product not found');
  }
  
  if (isActive !== undefined) product.status.isActive = isActive;
  if (isFeatured !== undefined) product.status.isFeatured = isFeatured;
  if (isNew !== undefined) product.status.isNew = isNew;
  if (isBestseller !== undefined) product.status.isBestseller = isBestseller;
  if (isTrending !== undefined) product.status.isTrending = isTrending;
  
  await product.save();
  
  res.status(200).json({
    success: true,
    message: 'Product status updated successfully',
    data: product,
  });
});

export const updateProductInventory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { quantity, inStock, lowStockThreshold } = req.body;
  
  const product = await Product.findById(id);
  
  if (!product) {
    throw new NotFoundError('Product not found');
  }
  
  if (quantity !== undefined) product.inventory.quantity = quantity;
  if (inStock !== undefined) product.inventory.inStock = inStock;
  if (lowStockThreshold !== undefined) product.inventory.lowStockThreshold = lowStockThreshold;
  
  await product.save();
  
  res.status(200).json({
    success: true,
    message: 'Product inventory updated successfully',
    data: product,
  });
});

export const rateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rating } = req.body;
  
  if (!rating || rating < 1 || rating > 5) {
    throw new ValidationError('Rating must be between 1 and 5');
  }
  
  const product = await Product.findById(id);
  
  if (!product) {
    throw new NotFoundError('Product not found');
  }
  
  await product.updateRating(rating);
  
  res.status(200).json({
    success: true,
    message: 'Product rated successfully',
    data: {
      averageRating: product.ratings.average,
      totalRatings: product.ratings.count,
    },
  });
});

export const getProductStats = asyncHandler(async (req, res) => {
  const { categoryId } = req.query;
  
  const match = { 'status.isActive': true };
  if (categoryId) match.category = categoryId;
  
  const stats = await Product.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalProducts: { $sum: 1 },
        avgPrice: { $avg: '$price.current' },
        minPrice: { $min: '$price.current' },
        maxPrice: { $max: '$price.current' },
        avgRating: { $avg: '$ratings.average' },
        totalViews: { $sum: '$metrics.views' },
        totalPurchases: { $sum: '$metrics.purchases' },
        inStockCount: {
          $sum: { $cond: ['$inventory.inStock', 1, 0] }
        },
      }
    }
  ]);
  
  res.status(200).json({
    success: true,
    message: 'Product statistics retrieved successfully',
    data: stats[0] || {},
  });
});

export default {
  getAllProducts,
  getProductById,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  getFeaturedProducts,
  getTrendingProducts,
  getNewProducts,
  getBestsellerProducts,
  searchProducts,
  getProductsByCategory,
  getProductsByPriceRange,
  getProductsByColor,
  filterProducts,
  bulkUpdateProducts,
  updateProductStatus,
  updateProductInventory,
  rateProduct,
  getProductStats,
};
