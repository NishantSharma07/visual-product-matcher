import express from 'express';
import {
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
} from '../controllers/productController.js';

const router = express.Router();

router.get('/', getAllProducts);

router.get('/featured', getFeaturedProducts);

router.get('/trending', getTrendingProducts);

router.get('/new', getNewProducts);

router.get('/bestsellers', getBestsellerProducts);

router.get('/search', searchProducts);

router.get('/filter', filterProducts);

router.get('/stats', getProductStats);

router.get('/category/:categoryId', getProductsByCategory);

router.get('/price-range', getProductsByPriceRange);

router.get('/color/:color', getProductsByColor);

router.get('/:id', getProductById);

router.get('/slug/:slug', getProductBySlug);

router.post('/', createProduct);

router.put('/:id', updateProduct);

router.delete('/:id', deleteProduct);

router.patch('/bulk-update', bulkUpdateProducts);

router.patch('/:id/status', updateProductStatus);

router.patch('/:id/inventory', updateProductInventory);

router.post('/:id/rate', rateProduct);

export default router;

