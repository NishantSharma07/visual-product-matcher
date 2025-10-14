import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, Menu, X, Home, Info } from 'lucide-react';
import useStore from '../../store/useStore';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { resetStore } = useStore();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const navLinks = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/about', label: 'About', icon: Info },
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-white/80 backdrop-blur-xl shadow-lg'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link
              to="/"
              onClick={resetStore}
              className="flex items-center space-x-3 group"
            >
              <motion.div
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.6 }}
                className="relative"
              >
                <div className="w-12 h-12 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-neon">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0.8, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="absolute inset-0 bg-primary-400 rounded-2xl blur-md"
                />
              </motion.div>

              <div>
                <h1 className="text-2xl font-display font-bold gradient-text">
                  StyleForge
                </h1>
                <p className="text-xs text-gray-500 font-medium">
                  Visual Discovery
                </p>
              </div>
            </Link>

            <div className="hidden md:flex items-center space-x-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;

                return (
                  <Link key={link.path} to={link.path}>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`relative px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                        isActive
                          ? 'text-white'
                          : 'text-gray-700 hover:text-primary-600'
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="navBackground"
                          className="absolute inset-0 bg-gradient-primary rounded-xl shadow-lg"
                          transition={{
                            type: 'spring',
                            stiffness: 500,
                            damping: 30,
                          }}
                        />
                      )}
                      <span className="relative flex items-center space-x-2">
                        <Icon className="w-4 h-4" />
                        <span>{link.label}</span>
                      </span>
                    </motion.div>
                  </Link>
                );
              })}

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-primary ml-4"
                onClick={() => {
                  resetStore();
                  window.location.href = '/';
                }}
              >
                <Search className="w-5 h-5 mr-2" />
                Start Searching
              </motion.button>
            </div>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-700" />
              ) : (
                <Menu className="w-6 h-6 text-gray-700" />
              )}
            </motion.button>
          </div>
        </div>
      </motion.nav>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="fixed top-20 left-0 right-0 z-40 md:hidden bg-white/95 backdrop-blur-xl shadow-2xl border-t border-gray-200"
          >
            <div className="px-4 py-6 space-y-3">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;

                return (
                  <Link key={link.path} to={link.path}>
                    <motion.div
                      whileTap={{ scale: 0.95 }}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-semibold transition-all ${
                        isActive
                          ? 'bg-gradient-primary text-white shadow-lg'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{link.label}</span>
                    </motion.div>
                  </Link>
                );
              })}

              <motion.button
                whileTap={{ scale: 0.95 }}
                className="w-full btn-primary mt-4"
                onClick={() => {
                  resetStore();
                  window.location.href = '/';
                }}
              >
                <Search className="w-5 h-5 mr-2" />
                Start Searching
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="h-20" />
    </>
  );
};

export default Navbar;
