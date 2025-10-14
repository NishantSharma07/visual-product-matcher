import express from 'express';

const router = express.Router();

// Mock categories data - works without database
const mockCategories = [
  {
    _id: '1',
    name: 'Fashion & Apparel',
    description: 'Clothing, accessories, and fashion items',
    icon: '👗',
    color: { gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    metadata: { productCount: 150, trending: true, popularity: 85 },
    tags: ['clothing', 'fashion', 'accessories'],
    isActive: true
  },
  {
    _id: '2',
    name: 'Electronics',
    description: 'Gadgets, devices, and tech products',
    icon: '📱',
    color: { gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
    metadata: { productCount: 200, featured: true, popularity: 92 },
    tags: ['tech', 'gadgets', 'devices'],
    isActive: true
  },
  {
    _id: '3',
    name: 'Home Decor',
    description: 'Furniture, decorations, and home items',
    icon: '🏠',
    color: { gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
    metadata: { productCount: 120, popularity: 78 },
    tags: ['furniture', 'decor', 'home'],
    isActive: true
  },
  {
    _id: '4',
    name: 'Beauty & Cosmetics',
    description: 'Makeup, skincare, and beauty products',
    icon: '💄',
    color: { gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
    metadata: { productCount: 180, trending: true, popularity: 88 },
    tags: ['makeup', 'beauty', 'skincare'],
    isActive: true
  },
  {
    _id: '5',
    name: 'Sports & Fitness',
    description: 'Athletic gear, equipment, and activewear',
    icon: '⚽',
    color: { gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)' },
    metadata: { productCount: 95, popularity: 70 },
    tags: ['sports', 'fitness', 'athletic'],
    isActive: true
  },
  {
    _id: '6',
    name: 'Jewelry & Watches',
    description: 'Accessories, jewelry, and timepieces',
    icon: '💎',
    color: { gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
    metadata: { productCount: 110, featured: true, popularity: 82 },
    tags: ['jewelry', 'watches', 'accessories'],
    isActive: true
  }
];

// GET all categories
router.get('/', async (req, res) => {
  try {
    const activeCategories = mockCategories.filter(cat => cat.isActive);
    res.json({
      success: true,
      data: activeCategories,
      count: activeCategories.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET featured categories
router.get('/featured', async (req, res) => {
  try {
    const featured = mockCategories.filter(cat => cat.metadata?.featured && cat.isActive);
    res.json({
      success: true,
      data: featured,
      count: featured.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET trending categories
router.get('/trending', async (req, res) => {
  try {
    const trending = mockCategories.filter(cat => cat.metadata?.trending && cat.isActive);
    res.json({
      success: true,
      data: trending,
      count: trending.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET popular categories
router.get('/popular', async (req, res) => {
  try {
    const popular = [...mockCategories]
      .filter(cat => cat.isActive)
      .sort((a, b) => (b.metadata?.popularity || 0) - (a.metadata?.popularity || 0))
      .slice(0, 3);
    res.json({
      success: true,
      data: popular,
      count: popular.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET category by ID
router.get('/:id', async (req, res) => {
  try {
    const category = mockCategories.find(cat => cat._id === req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Search categories
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.json({
        success: true,
        data: mockCategories.filter(cat => cat.isActive),
        count: mockCategories.length
      });
    }
    
    const searchResults = mockCategories.filter(cat => 
      cat.isActive && (
        cat.name.toLowerCase().includes(q.toLowerCase()) ||
        cat.description.toLowerCase().includes(q.toLowerCase()) ||
        cat.tags.some(tag => tag.toLowerCase().includes(q.toLowerCase()))
      )
    );
    
    res.json({
      success: true,
      data: searchResults,
      count: searchResults.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
