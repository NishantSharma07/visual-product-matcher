/**
 * @author Nishant Sharma
 * @version 2.0.0
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import { connectDB, disconnectDB } from './src/config/database.js';

// Import Routes
import categoryRoutes from './src/routes/categories.js';
import productRoutes from './src/routes/products.js';
import matchRoutes from './src/routes/match.js';
import analyticsRoutes from './src/routes/analytics.js';

// Import Middleware
import { errorHandler, notFound } from './src/middleware/errorHandler.js';
import { requestLogger } from './src/middleware/logger.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

/**
 * CORS Configuration
 * Allow cross-origin requests from specified origins
 */
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.CLIENT_URL || 'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:5174'
    ];
    
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));


app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));


app.use(mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`⚠️  Sanitized input: ${key} from ${req.ip}`);
  },
}));

app.use(compression());


if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

app.use(requestLogger);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Rate limit exceeded. Please try again in 15 minutes.',
      retryAfter: req.rateLimit.resetTime,
    });
  },
});

// Apply rate limiting to all routes
app.use('/api/', limiter);

const matchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: {
    success: false,
    message: 'Too many match requests. Please wait before trying again.',
  },
});

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'StyleForge server is running smoothly! 🚀',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV,
    version: '2.0.0',
  });
});


app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to StyleForge Visual Product Discovery API! 🎨✨',
    version: '2.0.0',
    endpoints: {
      health: '/health',
      categories: '/api/v1/categories',
      products: '/api/v1/products',
      match: '/api/v1/match',
      analytics: '/api/v1/analytics',
    },
    documentation: 'https://github.com/your-username/styleforge',
  });
});


app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/match', matchLimiter, matchRoutes);
// app.use('/api/v1/analytics', analyticsRoutes);


app.use(notFound);

app.use(errorHandler);


const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log('\n✨ ═══════════════════════════════════════════════════════ ✨');
      console.log('   🚀 StyleForge Visual Product Discovery Server');
      console.log('✨ ═══════════════════════════════════════════════════════ ✨\n');
      console.log(`   📡 Server running in ${NODE_ENV.toUpperCase()} mode`);
      console.log(`   🌐 Listening on http://localhost:${PORT}`);
      console.log(`   📊 Health check: http://localhost:${PORT}/health`);
      console.log(`   🎨 API Base: http://localhost:${PORT}/api/v1`);
      console.log(`   ⏰ Started at: ${new Date().toLocaleString()}`);
      console.log('\n✨ ═══════════════════════════════════════════════════════ ✨\n');
    });

    const gracefulShutdown = async (signal) => {
      console.log(`\n\n⚠️  Received ${signal}. Starting graceful shutdown...`);
      
      // Close server
      server.close(async () => {
        console.log('✅ HTTP server closed');
        
        await disconnectDB();
        console.log('✅ Database connection closed');
        
        console.log('✅ Graceful shutdown completed\n');
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error('⚠️  Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('💥 UNCAUGHT EXCEPTION! Shutting down...');
      console.error(error.name, error.message);
      console.error(error.stack);
      process.exit(1);
    });

    process.on('unhandledRejection', (error) => {
      console.error('💥 UNHANDLED REJECTION! Shutting down...');
      console.error(error.name, error.message);
      gracefulShutdown('UNHANDLED_REJECTION');
    });

  } catch (error) {
    console.error('💥 Failed to start server:');
    console.error(error);
    process.exit(1);
  }
};

startServer();

export default app;
