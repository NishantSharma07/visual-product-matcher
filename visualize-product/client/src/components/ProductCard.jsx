import { motion } from 'framer-motion';
import { Star, ShoppingCart, ExternalLink, Sparkles, TrendingUp } from 'lucide-react';
import { matchAPI } from '../services/api';

const ProductCard = ({ product, similarity, rank, sessionId, matchFactors }) => {
  const handleClick = async () => {
    if (sessionId) {
      try {
        await matchAPI.trackClick({
          sessionId,
          productId: product.id,
          rank,
        });
      } catch (error) {
        console.error('Failed to track click:', error);
      }
    }
  };

  const getSimilarityColor = (score) => {
    if (score >= 85) return 'text-green-500 bg-green-50';
    if (score >= 70) return 'text-blue-500 bg-blue-50';
    if (score >= 50) return 'text-yellow-500 bg-yellow-50';
    return 'text-gray-500 bg-gray-50';
  };

  const getConfidenceLabel = (level) => {
    const labels = {
      'very high': { text: 'Excellent Match', color: 'bg-green-500' },
      'high': { text: 'Great Match', color: 'bg-blue-500' },
      'medium': { text: 'Good Match', color: 'bg-yellow-500' },
      'low': { text: 'Fair Match', color: 'bg-gray-500' },
    };
    return labels[level] || labels.high;
  };

  // Fix: Get confidence from similarity object
  const confidenceLevel = typeof similarity.confidence === 'string' 
    ? similarity.confidence 
    : similarity.confidence?.level || 'high';
  const confidenceBadge = getConfidenceLabel(confidenceLevel);

  // Fix: Get match factors from prop
  const factors = matchFactors || { color: 90, pattern: 85 };

  return (
    <motion.div
      whileHover={{ y: -8 }}
      onClick={handleClick}
      className="group bg-white rounded-2xl overflow-hidden shadow-soft hover:shadow-soft-lg transition-all duration-300 cursor-pointer"
    >
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          loading="lazy"
        />

        <div className="absolute top-4 left-4 flex items-center space-x-2">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className={`flex items-center px-3 py-1.5 rounded-full font-bold text-sm shadow-lg ${getSimilarityColor(similarity.score)}`}
          >
            <Sparkles className="w-4 h-4 mr-1" />
            {similarity.score}%
          </motion.div>

          {rank <= 3 && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
              className="w-8 h-8 bg-gradient-gold rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg"
            >
              {rank}
            </motion.div>
          )}
        </div>

        <div className="absolute top-4 right-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.25 }}
            className={`px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-lg ${confidenceBadge.color}`}
          >
            {confidenceBadge.text}
          </motion.div>
        </div>

        {product.availability?.inStock ? (
          <div className="absolute bottom-4 left-4">
            <div className="px-3 py-1.5 bg-green-500 text-white rounded-full text-xs font-bold shadow-lg">
              In Stock
            </div>
          </div>
        ) : (
          <div className="absolute bottom-4 left-4">
            <div className="px-3 py-1.5 bg-red-500 text-white rounded-full text-xs font-bold shadow-lg">
              Out of Stock
            </div>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-800 line-clamp-2 group-hover:text-primary-600 transition-colors">
              {product.name}
            </h3>
            {product.brand && (
              <p className="text-sm text-gray-500 mt-1">{product.brand}</p>
            )}
          </div>
        </div>

        {product.description && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-4">
            {product.description}
          </p>
        )}

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-1">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span className="text-sm font-semibold text-gray-700">
              {product.rating?.toFixed(1) || '0.0'}
            </span>
            <span className="text-xs text-gray-500">
              ({product.reviews || 0})
            </span>
          </div>

          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              ₹{product.price.current.toLocaleString()}
            </div>
            {product.price.original && product.price.original > product.price.current && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-400 line-through">
                  ₹{product.price.original.toLocaleString()}
                </span>
                <span className="text-xs font-bold text-green-500">
                  {Math.round(((product.price.original - product.price.current) / product.price.original) * 100)}% OFF
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">Color Match</span>
            <div className="flex items-center space-x-2">
              <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${factors.color}%` }}
                  transition={{ delay: 0.4, duration: 0.8 }}
                  className="h-full bg-gradient-primary rounded-full"
                />
              </div>
              <span className="font-semibold text-gray-700 w-8 text-right">
                {factors.color}%
              </span>
            </div>
          </div>

          {factors.pattern > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">Pattern Match</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${factors.pattern}%` }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="h-full bg-gradient-secondary rounded-full"
                  />
                </div>
                <span className="font-semibold text-gray-700 w-8 text-right">
                  {factors.pattern}%
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex-1 btn-primary py-2.5 text-sm"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Add to Cart
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
          >
            <ExternalLink className="w-4 h-4 text-gray-600" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
