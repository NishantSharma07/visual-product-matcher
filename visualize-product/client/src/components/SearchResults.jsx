import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Info } from 'lucide-react';
import ProductCard from './ProductCard';
import FeatureDisplay from './FeatureDisplay';

const SearchResults = ({ results, uploadedImage, sessionId }) => {
  const [selectedSort, setSelectedSort] = useState('relevance');

  const sortOptions = [
    { value: 'relevance', label: 'Most Relevant' },
    { value: 'similarity', label: 'Highest Similarity' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
  ];

  const sortedMatches = [...results.matches].sort((a, b) => {
    switch (selectedSort) {
      case 'similarity':
        return b.similarity.score - a.similarity.score;
      case 'price-low':
        return a.product.price.current - b.product.price.current;
      case 'price-high':
        return b.product.price.current - a.product.price.current;
      default:
        return a.rank - b.rank;
    }
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1"
        >
          <div className="sticky top-24 space-y-6">
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <Sparkles className="w-5 h-5 text-primary-500 mr-2" />
                Your Image
              </h3>
              <div className="relative rounded-xl overflow-hidden shadow-lg">
                <img
                  src={uploadedImage}
                  alt="Uploaded"
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>

            {results.features && (
              <FeatureDisplay features={results.features} />
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card rounded-2xl p-6"
            >
              <div className="flex items-start space-x-3">
                <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-gray-600">
                  <p className="font-semibold text-gray-800 mb-2">How it works</p>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <span className="text-primary-500 mr-2">•</span>
                      <span>Products are ranked by visual similarity</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary-500 mr-2">•</span>
                      <span>Color matching is weighted heavily</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary-500 mr-2">•</span>
                      <span>Pattern and texture analysis included</span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 space-y-4 sm:space-y-0"
          >
            <div>
              <h3 className="text-2xl font-bold text-gray-800">
                {results.matches.length} Matches Found
              </h3>
              <p className="text-gray-600 text-sm mt-1">
                Processed in {results.metadata.processingTime}ms
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Sort by:</label>
              <select
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:border-primary-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all outline-none"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {sortedMatches.map((match, index) => (
              <motion.div key={match.product.id} variants={itemVariants}>
                <ProductCard
                  product={match.product}
                  similarity={match.similarity}
                  rank={match.rank}
                  sessionId={sessionId}
                />
              </motion.div>
            ))}
          </motion.div>

          {sortedMatches.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                No matches found
              </h3>
              <p className="text-gray-600">
                Try uploading a different image or selecting another category
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchResults;
