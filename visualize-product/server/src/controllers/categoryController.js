import { asyncHandler } from '../middleware/errorHandler.js';
import { ValidationError, NotFoundError, ConflictError } from '../middleware/errorHandler.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';

export const getAllCategories = asyncHandler(async (req, res) => {
  const { active, featured, trending, parentOnly } = req.query;
  
  const query = {};
  
  if (active === 'true') query.isActive = true;
  if (featured === 'true') query['metadata.featured'] = true;
  if (trending === 'true') query['metadata.trending'] = true;
  if (parentOnly === 'true') query.parentCategory = null;
  
  const categories = await Category.find(query)
    .populate('subcategories')
    .sort({ sortOrder: 1, 'metadata.popularity': -1 });
  
  res.status(200).json({
    success: true,
    message: 'Categories retrieved successfully',
    count: categories.length,
    data: categories,
  });
});

export const getCategoryById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const category = await Category.findById(id)
    .populate('subcategories')
    .populate('parentCategory');
  
  if (!category) {
    throw new NotFoundError('Category not found');
  }
  
  await category.incrementSearchCount();
  
  res.status(200).json({
    success: true,
    message: 'Category retrieved successfully',
    data: category,
  });
});

export const getCategoryBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  
  const category = await Category.findOne({ slug })
    .populate('subcategories')
    .populate('parentCategory');
  
  if (!category) {
    throw new NotFoundError('Category not found');
  }
  
  await category.incrementSearchCount();
  
  res.status(200).json({
    success: true,
    message: 'Category retrieved successfully',
    data: category,
  });
});

export const createCategory = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    icon,
    image,
    color,
    tags,
    parentCategory,
    filters,
    sortOrder,
  } = req.body;
  
  if (!name) {
    throw new ValidationError('Category name is required');
  }
  
  const existingCategory = await Category.findOne({ name });
  if (existingCategory) {
    throw new ConflictError('Category with this name already exists');
  }
  
  const category = await Category.create({
    name,
    description,
    icon,
    image,
    color,
    tags,
    parentCategory,
    filters,
    sortOrder,
  });
  
  if (parentCategory) {
    await Category.findByIdAndUpdate(parentCategory, {
      $push: { subcategories: category._id }
    });
  }
  
  res.status(201).json({
    success: true,
    message: 'Category created successfully',
    data: category,
  });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  const category = await Category.findById(id);
  
  if (!category) {
    throw new NotFoundError('Category not found');
  }
  
  if (updates.name && updates.name !== category.name) {
    const existingCategory = await Category.findOne({ name: updates.name });
    if (existingCategory) {
      throw new ConflictError('Category with this name already exists');
    }
  }
  
  Object.keys(updates).forEach(key => {
    if (updates[key] !== undefined) {
      category[key] = updates[key];
    }
  });
  
  await category.save();
  
  res.status(200).json({
    success: true,
    message: 'Category updated successfully',
    data: category,
  });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { force } = req.query;
  
  const category = await Category.findById(id);
  
  if (!category) {
    throw new NotFoundError('Category not found');
  }
  
  const productCount = await Product.countDocuments({ category: id });
  
  if (productCount > 0 && force !== 'true') {
    throw new ValidationError(
      `Cannot delete category with ${productCount} products. Use force=true to proceed.`
    );
  }
  
  if (category.subcategories && category.subcategories.length > 0) {
    throw new ValidationError('Cannot delete category with subcategories');
  }
  
  if (category.parentCategory) {
    await Category.findByIdAndUpdate(category.parentCategory, {
      $pull: { subcategories: id }
    });
  }
  
  await Category.findByIdAndDelete(id);
  
  res.status(200).json({
    success: true,
    message: 'Category deleted successfully',
  });
});

export const getFeaturedCategories = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 6;
  
  const categories = await Category.getFeaturedCategories(limit);
  
  res.status(200).json({
    success: true,
    message: 'Featured categories retrieved successfully',
    count: categories.length,
    data: categories,
  });
});

export const getTrendingCategories = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 6;
  
  const categories = await Category.getTrendingCategories(limit);
  
  res.status(200).json({
    success: true,
    message: 'Trending categories retrieved successfully',
    count: categories.length,
    data: categories,
  });
});

export const getPopularCategories = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  
  const categories = await Category.getPopularCategories(limit);
  
  res.status(200).json({
    success: true,
    message: 'Popular categories retrieved successfully',
    count: categories.length,
    data: categories,
  });
});

export const searchCategories = asyncHandler(async (req, res) => {
  const { query, limit } = req.query;
  
  if (!query) {
    throw new ValidationError('Search query is required');
  }
  
  const categories = await Category.searchCategories(
    query,
    parseInt(limit) || 10
  );
  
  res.status(200).json({
    success: true,
    message: 'Categories search completed',
    count: categories.length,
    data: categories,
  });
});

export const getCategoryTree = asyncHandler(async (req, res) => {
  const tree = await Category.getCategoryTree();
  
  res.status(200).json({
    success: true,
    message: 'Category tree retrieved successfully',
    data: tree,
  });
});

export const getCategoryStats = asyncHandler(async (req, res) => {
  const stats = await Category.getCategoryStats();
  
  res.status(200).json({
    success: true,
    message: 'Category statistics retrieved successfully',
    data: stats,
  });
});

export const updateCategoryMetadata = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { featured, trending, popularity } = req.body;
  
  const category = await Category.findById(id);
  
  if (!category) {
    throw new NotFoundError('Category not found');
  }
  
  if (featured !== undefined) {
    category.metadata.featured = featured;
  }
  
  if (trending !== undefined) {
    category.metadata.trending = trending;
  }
  
  if (popularity !== undefined) {
    category.metadata.popularity = popularity;
  }
  
  await category.save();
  
  res.status(200).json({
    success: true,
    message: 'Category metadata updated successfully',
    data: category,
  });
});

export const refreshCategoryStats = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const category = await Category.findById(id);
  
  if (!category) {
    throw new NotFoundError('Category not found');
  }
  
  await category.updateProductCount();
  await category.updateAveragePrice();
  await category.calculatePopularity();
  
  res.status(200).json({
    success: true,
    message: 'Category statistics refreshed successfully',
    data: {
      productCount: category.metadata.productCount,
      averagePrice: category.metadata.averagePrice,
      popularity: category.metadata.popularity,
    },
  });
});

export const bulkUpdateCategories = asyncHandler(async (req, res) => {
  const { categoryIds, updates } = req.body;
  
  if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
    throw new ValidationError('Category IDs array is required');
  }
  
  if (!updates || typeof updates !== 'object') {
    throw new ValidationError('Updates object is required');
  }
  
  const result = await Category.updateMany(
    { _id: { $in: categoryIds } },
    { $set: updates }
  );
  
  res.status(200).json({
    success: true,
    message: 'Categories updated successfully',
    data: {
      matched: result.matchedCount,
      modified: result.modifiedCount,
    },
  });
});

export const toggleCategoryStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const category = await Category.findById(id);
  
  if (!category) {
    throw new NotFoundError('Category not found');
  }
  
  category.isActive = !category.isActive;
  await category.save();
  
  res.status(200).json({
    success: true,
    message: `Category ${category.isActive ? 'activated' : 'deactivated'} successfully`,
    data: category,
  });
});

export const reorderCategories = asyncHandler(async (req, res) => {
  const { orderedIds } = req.body;
  
  if (!orderedIds || !Array.isArray(orderedIds)) {
    throw new ValidationError('Ordered IDs array is required');
  }
  
  const updatePromises = orderedIds.map((id, index) => {
    return Category.findByIdAndUpdate(id, { sortOrder: index });
  });
  
  await Promise.all(updatePromises);
  
  res.status(200).json({
    success: true,
    message: 'Categories reordered successfully',
  });
});

export const getCategoryProducts = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { limit = 20, skip = 0, sort = '-createdAt' } = req.query;
  
  const category = await Category.findById(id);
  
  if (!category) {
    throw new NotFoundError('Category not found');
  }
  
  const products = await Product.findByCategory(id, {
    limit: parseInt(limit),
    skip: parseInt(skip),
    sort,
  });
  
  const total = await Product.countDocuments({
    category: id,
    'status.isActive': true,
  });
  
  res.status(200).json({
    success: true,
    message: 'Category products retrieved successfully',
    data: {
      category: {
        id: category._id,
        name: category.name,
        slug: category.slug,
      },
      products,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
        pages: Math.ceil(total / parseInt(limit)),
      },
    },
  });
});

export default {
  getAllCategories,
  getCategoryById,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
  getFeaturedCategories,
  getTrendingCategories,
  getPopularCategories,
  searchCategories,
  getCategoryTree,
  getCategoryStats,
  updateCategoryMetadata,
  refreshCategoryStats,
  bulkUpdateCategories,
  toggleCategoryStatus,
  reorderCategories,
  getCategoryProducts,
};
