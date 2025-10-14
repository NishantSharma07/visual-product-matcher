import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Home, Search, ArrowLeft } from 'lucide-react';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50 flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative mb-12"
        >
          <motion.div
            animate={{
              y: [0, -20, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="text-9xl md:text-[12rem] font-display font-bold gradient-text"
          >
            404
          </motion.div>

          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute inset-0 blur-3xl bg-gradient-primary opacity-30"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-4xl md:text-5xl font-display font-bold text-gray-800 mb-4">
            Page Not Found
          </h1>
          <p className="text-xl text-gray-600 mb-12">
            Oops! The page you're looking for seems to have wandered off. Let's get you back on track.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/')}
              className="btn-primary flex items-center"
            >
              <Home className="w-5 h-5 mr-2" />
              Go Home
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(-1)}
              className="btn-outline flex items-center"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Go Back
            </motion.button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-16 grid grid-cols-3 gap-8"
        >
          {[
            { icon: '🏠', text: 'Home' },
            { icon: '🔍', text: 'Search' },
            { icon: '💡', text: 'About' },
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              className="glass-card rounded-2xl p-6 cursor-pointer"
              onClick={() => navigate(index === 0 ? '/' : index === 1 ? '/' : '/about')}
            >
              <div className="text-4xl mb-2">{item.icon}</div>
              <p className="text-sm font-semibold text-gray-700">{item.text}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default NotFoundPage;
