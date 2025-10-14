import express from 'express';
import multer from 'multer';
import path from 'path';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

const mockProducts = [
  {
    _id: '1',
    name: 'Stylish Cotton T-Shirt',
    description: 'Comfortable and trendy cotton t-shirt',
    price: 29.99,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
    category: '1',
    brand: 'FashionHub',
    inStock: true,
    rating: 4.5
  },
  {
    _id: '2',
    name: 'Premium Wireless Headphones',
    description: 'High-quality sound with noise cancellation',
    price: 149.99,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
    category: '2',
    brand: 'AudioTech',
    inStock: true,
    rating: 4.8
  },
  {
    _id: '3',
    name: 'Modern Wall Art',
    description: 'Beautiful abstract wall decoration',
    price: 79.99,
    image: 'https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=400',
    category: '3',
    brand: 'HomeStyle',
    inStock: true,
    rating: 4.6
  }
];

router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file uploaded'
      });
    }

    const { categoryId } = req.body;
    
    let matches = mockProducts;
    if (categoryId) {
      matches = mockProducts.filter(p => p.category === categoryId);
    }

    const results = matches.map((product, index) => ({
      product: {
        id: product._id,
        name: product.name,
        description: product.description,
        image: product.image,
        brand: product.brand,
        rating: product.rating,
        price: {
          current: product.price,
          original: product.price * 1.2,
          discount: 20
        },
        availability: {
          inStock: product.inStock,
          quantity: 50
        }
      },
      similarity: {
        score: 95 - (index * 5),
        confidence: 'high'
      },
      matchFactors: {
        color: 92,
        pattern: 88,
        texture: 85,
        style: 90
      },
      rank: index + 1
    }));

    const sessionId = 'session-' + Date.now();

    res.json({
      success: true,
      data: {
        sessionId,
        uploadedImage: `/uploads/${req.file.filename}`,
        matches: results,
        count: results.length,
        metadata: {
          processingTime: 1200,
          totalProducts: mockProducts.length,
          matchedProducts: results.length,
          timestamp: new Date().toISOString()
        },
        features: {
          colors: {
            dominant: [
              { hex: '#667eea', percentage: 45 },
              { hex: '#764ba2', percentage: 30 },
              { hex: '#f093fb', percentage: 15 }
            ],
            primary: { hex: '#667eea', name: 'purple' },
            secondary: { hex: '#764ba2', name: 'violet' },
            brightness: 75,
            contrast: 60,
            temperature: 'cool'
          },
          pattern: {
            type: 'solid',
            texture: 'smooth',
            complexity: { score: 35, level: 'simple' },
            symmetry: { overall: 85, horizontal: 90, vertical: 80 }
          },
          style: 'modern'
        }
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process image'
    });
  }
});

export default router;
