import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, TrendingUp, Package } from 'lucide-react';
import useStore from '../store/useStore';

const CategoryCard = ({ category, index }) => {
  const navigate = useNavigate();
  const { setSelectedCategory } = useStore();

  const handleCategoryClick = () => {
    setSelectedCategory(category);
    navigate(`/search/${category._id}`);
  };

  const gradient = category.color?.gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  const icon = category.icon || '🏷️';

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleCategoryClick}
      className="group relative bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer"
    >
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: gradient }}
      />

      <div className="relative p-8">
        <div className="flex items-start justify-between mb-6">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              delay: index * 0.1,
              type: 'spring',
              stiffness: 200 
            }}
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg group-hover:shadow-xl transition-all duration-300"
            style={{ background: gradient }}
          >
            {icon}
          </motion.div>

          {category.metadata?.trending && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.1 + 0.2 }}
              className="flex items-center px-3 py-1 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full shadow-lg"
            >
              <TrendingUp className="w-4 h-4 text-white mr-1" />
              <span className="text-xs font-bold text-white">Trending</span>
            </motion.div>
          )}

          {category.metadata?.featured && !category.metadata?.trending && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.1 + 0.2 }}
              className="flex items-center px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full shadow-lg"
            >
              <span className="text-xs font-bold text-white">Featured</span>
            </motion.div>
          )}
        </div>

        <h3 className="text-2xl font-display font-bold text-gray-800 group-hover:text-white transition-colors duration-300 mb-2">
          {category.name}
        </h3>

        <p className="text-gray-600 group-hover:text-white/90 transition-colors duration-300 mb-6 line-clamp-2">
          {category.description || 'Discover amazing products in this category'}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-sm">
              <Package className="w-4 h-4 text-gray-500 group-hover:text-white/80 mr-1 transition-colors" />
              <span className="text-gray-600 group-hover:text-white/90 font-semibold transition-colors">
                {category.metadata?.productCount || 0} items
              </span>
            </div>

            {category.metadata?.popularity > 0 && (
              <div className="flex items-center">
                <div className="w-32 h-2 bg-gray-200 group-hover:bg-white/30 rounded-full overflow-hidden transition-colors">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${category.metadata.popularity}%` }}
                    transition={{ delay: index * 0.1 + 0.3, duration: 0.8 }}
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 group-hover:bg-white rounded-full"
                  />
                </div>
              </div>
            )}
          </div>

          <motion.div
            whileHover={{ x: 5 }}
            className="w-10 h-10 rounded-xl bg-gray-100 group-hover:bg-white/20 flex items-center justify-center transition-all duration-300"
          >
            <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" />
          </motion.div>
        </div>

        {category.tags && category.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-6">
            {category.tags.slice(0, 3).map((tag, tagIndex) => (
              <motion.span
                key={tagIndex}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 + 0.4 + tagIndex * 0.1 }}
                className="px-3 py-1 bg-gray-100 group-hover:bg-white/20 rounded-full text-xs font-medium text-gray-600 group-hover:text-white transition-all"
              >
                {tag}
              </motion.span>
            ))}
          </div>
        )}
      </div>

      <motion.div
        className="absolute inset-0 border-2 border-transparent group-hover:border-white/30 rounded-3xl transition-all duration-300"
      />
    </motion.div>
  );
};

export default CategoryCard;
