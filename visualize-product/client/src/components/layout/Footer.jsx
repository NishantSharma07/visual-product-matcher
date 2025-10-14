import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Github, Linkedin, Mail, Heart, Sparkles, ExternalLink } from 'lucide-react';  // ✅ REMOVED Twitter

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const techStack = [
    { name: 'React', color: 'text-cyan-500' },
    { name: 'Node.js', color: 'text-green-500' },
    { name: 'MongoDB', color: 'text-emerald-500' },
    { name: 'Framer Motion', color: 'text-purple-500' },
    { name: 'Tailwind CSS', color: 'text-blue-500' },
  ];

  const quickLinks = [
    { label: 'Home', path: '/' },
    { label: 'About', path: '/about' },
    { label: 'Search', path: '/' },
  ];

  // ✅ UPDATED: Your actual links, Twitter removed
  const socialLinks = [
    {
      icon: Github,
      href: 'https://github.com/NishantSharma07',
      label: 'GitHub',
      color: 'hover:text-gray-400',
    },
    {
      icon: Linkedin,
      href: 'https://www.linkedin.com/in/-nishant-sharma-/',
      label: 'LinkedIn',
      color: 'hover:text-blue-400',
    },
    {
      icon: Mail,
      href: 'mailto:nishantsharma232004@gmail.com',
      label: 'Email',
      color: 'hover:text-red-400',
    },
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
    <footer className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-mesh" />
      </div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
        className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <motion.div variants={itemVariants} className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-neon">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-display font-bold">StyleForge</h3>
                <p className="text-sm text-gray-400">Visual Discovery</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Revolutionary visual product discovery powered by advanced AI matching algorithms.
              Find products instantly by uploading images.
            </p>
          </motion.div>

          <motion.div variants={itemVariants}>
            <h4 className="text-lg font-semibold mb-4 flex items-center">
              <span className="w-1 h-6 bg-gradient-primary rounded-full mr-3" />
              Quick Links
            </h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.path}
                    className="text-gray-400 hover:text-white transition-colors duration-300 text-sm flex items-center group"
                  >
                    <ExternalLink className="w-3 h-3 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div variants={itemVariants}>
            <h4 className="text-lg font-semibold mb-4 flex items-center">
              <span className="w-1 h-6 bg-gradient-secondary rounded-full mr-3" />
              Tech Stack
            </h4>
            <div className="flex flex-wrap gap-2">
              {techStack.map((tech) => (
                <motion.span
                  key={tech.name}
                  whileHover={{ scale: 1.1 }}
                  className={`px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-xs font-medium ${tech.color}`}
                >
                  {tech.name}
                </motion.span>
              ))}
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <h4 className="text-lg font-semibold mb-4 flex items-center">
              <span className="w-1 h-6 bg-gradient-gold rounded-full mr-3" />
              Connect
            </h4>
            <div className="flex space-x-3">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <motion.a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.2, rotate: 5 }}
                    whileTap={{ scale: 0.9 }}
                    className={`w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center text-gray-400 ${social.color} transition-all duration-300`}
                  >
                    <Icon className="w-5 h-5" />
                  </motion.a>
                );
              })}
            </div>
          </motion.div>
        </div>

        <motion.div
          variants={itemVariants}
          className="mt-12 pt-8 border-t border-white/10"
        >
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <p className="text-sm text-gray-400 flex items-center">
              Made with
              <motion.span
                animate={{
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  repeatType: 'reverse',
                }}
                className="mx-1"
              >
                <Heart className="w-4 h-4 text-red-500 fill-red-500" />
              </motion.span>
              by Nishant Sharma
            </p>

            <p className="text-sm text-gray-400">
              © {currentYear} StyleForge. All rights reserved.
            </p>
          </div>
        </motion.div>
      </motion.div>

      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-pink" />
    </footer>
  );
};

export default Footer;

