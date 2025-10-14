import { motion } from 'framer-motion';
import { Sparkles, Code, Database, Zap, Palette, TrendingUp, CheckCircle } from 'lucide-react';

const AboutPage = () => {
  const features = [
    {
      icon: Palette,
      title: 'Advanced Color Analysis',
      description: 'Extracts dominant colors, palettes, brightness, contrast, and temperature using sophisticated algorithms.',
      color: 'text-purple-500',
      bg: 'bg-purple-50',
    },
    {
      icon: Zap,
      title: 'Pattern Recognition',
      description: 'Detects textures, patterns, symmetry, and complexity through edge detection and visual analysis.',
      color: 'text-blue-500',
      bg: 'bg-blue-50',
    },
    {
      icon: TrendingUp,
      title: 'Smart Similarity Scoring',
      description: 'Multi-factor weighted scoring with category-specific adjustments for precise matching.',
      color: 'text-pink-500',
      bg: 'bg-pink-50',
    },
    {
      icon: Database,
      title: 'MongoDB Integration',
      description: 'Efficient data storage with optimized indexing for lightning-fast queries and retrieval.',
      color: 'text-green-500',
      bg: 'bg-green-50',
    },
  ];

  const techStack = [
    { name: 'React 18', category: 'Frontend' },
    { name: 'Framer Motion', category: 'Animations' },
    { name: 'Tailwind CSS', category: 'Styling' },
    { name: 'Zustand', category: 'State Management' },
    { name: 'Node.js', category: 'Backend' },
    { name: 'Express', category: 'Server' },
    { name: 'MongoDB', category: 'Database' },
    { name: 'Sharp', category: 'Image Processing' },
  ];

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
      <section className="relative py-20 overflow-hidden">
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
            className="w-20 h-20 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-neon"
          >
            <Sparkles className="w-10 h-10 text-white" />
          </motion.div>

          <h1 className="text-5xl md:text-6xl font-display font-bold mb-6 leading-tight">
            <span className="gradient-text">Visual Product Discovery</span>
            <br />
            <span className="text-gray-800">Powered by AI</span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            StyleForge revolutionizes e-commerce with advanced visual search technology. 
            Upload any image and find similar products instantly using sophisticated AI algorithms.
          </p>
        </motion.div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-display font-bold text-gray-800 mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-600">
              Built with cutting-edge technology for exceptional performance
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="glass-card rounded-2xl p-8 hover:shadow-soft-lg transition-all duration-300"
                >
                  <div className={`w-16 h-16 ${feature.bg} rounded-2xl flex items-center justify-center mb-6`}>
                    <Icon className={`w-8 h-8 ${feature.color}`} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-display font-bold text-gray-800 mb-4">
              Technology Stack
            </h2>
            <p className="text-xl text-gray-600">
              Modern technologies powering the platform
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {techStack.map((tech, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ scale: 1.05 }}
                className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 text-center shadow-soft hover:shadow-soft-lg transition-all"
              >
                <Code className="w-8 h-8 text-primary-500 mx-auto mb-3" />
                <h4 className="font-bold text-gray-800 mb-1">{tech.name}</h4>
                <p className="text-sm text-gray-500">{tech.category}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card rounded-3xl p-12"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div>
                <h2 className="text-3xl font-display font-bold text-gray-800 mb-6">
                  How It Works
                </h2>
                <div className="space-y-6">
                  {[
                    {
                      step: '1',
                      title: 'Upload Image',
                      description: 'Select a category and upload an image of the product you want to find.',
                    },
                    {
                      step: '2',
                      title: 'AI Analysis',
                      description: 'Our AI extracts colors, patterns, textures, and visual features from your image.',
                    },
                    {
                      step: '3',
                      title: 'Smart Matching',
                      description: 'Advanced algorithms compare your image with thousands of products in real-time.',
                    },
                    {
                      step: '4',
                      title: 'Get Results',
                      description: 'Receive ranked results based on visual similarity with detailed match scores.',
                    },
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start space-x-4"
                    >
                      <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                        <span className="text-white font-bold">{item.step}</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800 mb-1">{item.title}</h4>
                        <p className="text-gray-600 text-sm">{item.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-3xl font-display font-bold text-gray-800 mb-6">
                  Key Highlights
                </h2>
                <div className="space-y-4">
                  {[
                    'Lightning-fast image processing (<500ms)',
                    'Advanced color extraction with palette analysis',
                    'Pattern and texture detection',
                    'Multi-factor similarity scoring',
                    'Category-specific matching algorithms',
                    'Real-time search analytics',
                    'Mobile-responsive design',
                    'Seamless user experience',
                  ].map((highlight, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center space-x-3"
                    >
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">{highlight}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-br from-primary-500 to-secondary-500 text-white">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        >
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
            Ready to Experience the Future of Shopping?
          </h2>
          <p className="text-xl mb-10 opacity-90">
            Start discovering products with just an image
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.location.href = '/'}
            className="px-10 py-4 bg-white text-primary-600 rounded-xl font-bold text-lg shadow-2xl hover:shadow-3xl transition-all"
          >
            Get Started Now
          </motion.button>
        </motion.div>
      </section>
    </div>
  );
};

export default AboutPage;
