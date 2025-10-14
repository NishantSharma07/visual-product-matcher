import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Sparkles, Upload, X } from 'lucide-react';
import { matchAPI, categoryAPI } from '../services/api';
import useStore from '../store/useStore';
import ImageUploader from '../components/ImageUploader';
import SearchResults from '../components/SearchResults';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const SearchPage = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const {
    selectedCategory,
    setSelectedCategory,
    uploadedImage,
    setUploadedImage,
    searchResults,
    setSearchResults,
    sessionId,
    setSessionId,
  } = useStore();

  const [loading, setLoading] = useState(false);
  const [processingStage, setProcessingStage] = useState('');
  const [category, setCategory] = useState(selectedCategory);

  useEffect(() => {
    if (!selectedCategory && categoryId) {
      fetchCategory();
    }
  }, [categoryId, selectedCategory]);

const fetchCategory = async () => {
  try {
    if (categoryId && !selectedCategory) {
      const response = await categoryAPI.getAll();
      const categoryData = response.data.data.find(cat => cat._id === categoryId);
      if (categoryData) {
        setCategory(categoryData);
        setSelectedCategory(categoryData);
      } else {
        toast.error('Category not found');
        navigate('/');
      }
    }
  } catch (error) {
    console.error('Error fetching category:', error);
  }
};

  const handleImageUpload = async (file) => {
    if (!file) return;

    setUploadedImage(URL.createObjectURL(file));
    setLoading(true);
    setProcessingStage('Uploading image...');

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('categoryId', categoryId);

      setProcessingStage('Analyzing colors and patterns...');

      const response = await matchAPI.uploadAndMatch(formData);

      setProcessingStage('Finding perfect matches...');

      if (response.data.success) {
        setSearchResults(response.data.data);
        setSessionId(response.data.data.sessionId);
        toast.success(`Found ${response.data.data.matches.length} matches!`);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to process image');
      setUploadedImage(null);
    } finally {
      setLoading(false);
      setProcessingStage('');
    }
  };

  const handleClearSearch = () => {
    setUploadedImage(null);
    setSearchResults(null);
    setSessionId(null);
  };

  const gradient = category?.color?.gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-6 group"
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            <span className="font-semibold">Back to Categories</span>
          </button>

          {category && (
            <div className="flex items-center space-x-4">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg"
                style={{ background: gradient }}
              >
                {category.icon || '🏷️'}
              </motion.div>

              <div>
                <h1 className="text-3xl md:text-4xl font-display font-bold text-gray-800">
                  {category.name}
                </h1>
                <p className="text-gray-600 mt-1">
                  Upload an image to find similar products
                </p>
              </div>
            </div>
          )}
        </motion.div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <div className="glass-card rounded-3xl p-12 max-w-md w-full text-center">
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 180, 360],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="w-24 h-24 mx-auto mb-6 bg-gradient-primary rounded-2xl flex items-center justify-center"
                >
                  <Sparkles className="w-12 h-12 text-white" />
                </motion.div>

                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  Processing Your Image
                </h3>
                <p className="text-gray-600 mb-6">{processingStage}</p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Analyzing colors</span>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 1, delay: 0 }}
                      className="w-24 h-1 bg-gradient-primary rounded-full ml-4"
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Detecting patterns</span>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className="w-24 h-1 bg-gradient-secondary rounded-full ml-4"
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Finding matches</span>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 1, delay: 1 }}
                      className="w-24 h-1 bg-gradient-gold rounded-full ml-4"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ) : searchResults ? (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    Found {searchResults.matches.length} Matches
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Similarity-ranked results based on your image
                  </p>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleClearSearch}
                  className="btn-outline flex items-center"
                >
                  <X className="w-5 h-5 mr-2" />
                  Clear Search
                </motion.button>
              </div>

              <SearchResults
                results={searchResults}
                uploadedImage={uploadedImage}
                sessionId={sessionId}
              />
            </motion.div>
          ) : (
            <motion.div
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ImageUploader onImageUpload={handleImageUpload} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SearchPage;
