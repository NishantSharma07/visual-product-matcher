import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';  // ✅ ADD THIS
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Info, ArrowRight } from 'lucide-react';  // ✅ CHANGED Zap to Info
import { categoryAPI } from '../services/api';
import useStore from '../store/useStore';
import CategoryCard from '../components/CategoryCard';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const HomePage = () => {
  const navigate = useNavigate();  // ✅ ADD THIS
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const { setCategories: setStoreCategories } = useStore();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await categoryAPI.getAll();
      const categoriesData = response.data.data;
      setCategories(categoriesData);
      setStoreCategories(categoriesData);
    } catch (error) {
      toast.error('Failed to load categories');
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50">
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
          <div className="absolute top-40 right-10 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
          <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg mb-8"
          >
            <Sparkles className="w-5 h-5 text-primary-500 mr-2" />
            <span className="text-sm font-semibold text-gray-700">
              AI-Powered Visual Discovery
            </span>
          </motion.div>

          <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 leading-tight">
            <span className="gradient-text">Find Products</span>
            <br />
            <span className="text-gray-800">With Just An Image</span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            Upload a photo and discover similar products instantly. Our advanced AI matches colors, patterns, and styles with jaw-dropping accuracy.
          </p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-primary text-lg px-8 py-4 flex items-center cursor-pointer"
              onClick={() => {
                document.getElementById('categories-section')?.scrollIntoView({ 
                  behavior: 'smooth' 
                });
              }}
            >
              Get Started
              <ArrowRight className="w-5 h-5 ml-2" />
            </motion.div>

            {/* ✅ UPDATED BUTTON */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-white text-gray-800 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all flex items-center cursor-pointer"
              onClick={() => navigate('/about')}  // ✅ CHANGED
            >
              <Info className="w-5 h-5 mr-2" />  {/* ✅ CHANGED */}
              Get Info  {/* ✅ CHANGED */}
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      <section id="categories-section" className="relative py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center px-4 py-2 bg-gradient-primary text-white rounded-full shadow-lg mb-6">
              <TrendingUp className="w-5 h-5 mr-2" />
              <span className="text-sm font-semibold">Popular Categories</span>
            </div>

            <h2 className="text-4xl md:text-5xl font-display font-bold text-gray-800 mb-4">
              Choose Your Category
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Select a category to start your visual search journey
            </p>
          </motion.div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <LoadingSpinner size="large" />
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {categories.map((category, index) => (
                <motion.div key={category._id} variants={itemVariants}>
                  <CategoryCard category={category} index={index} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      <section className="relative py-20 bg-gradient-to-br from-primary-500 to-secondary-500 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-mesh" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        >
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
            Ready to Find Your Perfect Match?
          </h2>
          <p className="text-xl mb-10 opacity-90 max-w-2xl mx-auto">
            Join thousands of users discovering products through the power of visual AI
          </p>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-10 py-4 bg-white text-primary-600 rounded-xl font-bold text-lg shadow-2xl hover:shadow-3xl transition-all"
            onClick={() => {
              document.getElementById('categories-section')?.scrollIntoView({ 
                behavior: 'smooth' 
              });
            }}
          >
            Start Searching Now
          </motion.button>
        </motion.div>
      </section>
    </div>
  );
};

export default HomePage;
