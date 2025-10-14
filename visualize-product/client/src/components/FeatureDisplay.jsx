import { motion } from 'framer-motion';
import { Palette, Layers, Sun, Contrast as ContrastIcon } from 'lucide-react';

const FeatureDisplay = ({ features }) => {
  if (!features) return null;

  const { colors, pattern, style } = features;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-card rounded-2xl p-6 space-y-6"
    >
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
          <Palette className="w-5 h-5 text-primary-500 mr-2" />
          Detected Features
        </h3>

        <div className="space-y-4">
          {colors.dominant && colors.dominant.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Dominant Colors</p>
              <div className="flex flex-wrap gap-2">
                {colors.dominant.slice(0, 5).map((color, index) => (
                  <motion.div
                    key={index}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="group relative"
                  >
                    <div
                      className="w-12 h-12 rounded-xl shadow-md ring-2 ring-white hover:ring-primary-300 transition-all cursor-pointer"
                      style={{ backgroundColor: color.hex }}
                    />
                    <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      {color.hex}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {colors.primary && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Primary Color</p>
              <div className="flex items-center space-x-3">
                <div
                  className="w-10 h-10 rounded-xl shadow-md ring-2 ring-white"
                  style={{ backgroundColor: colors.primary.hex }}
                />
                <div>
                  <p className="text-sm font-medium text-gray-800">{colors.primary.hex}</p>
                  {colors.primary.name && (
                    <p className="text-xs text-gray-500 capitalize">{colors.primary.name}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {colors.secondary && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Secondary Color</p>
              <div className="flex items-center space-x-3">
                <div
                  className="w-10 h-10 rounded-xl shadow-md ring-2 ring-white"
                  style={{ backgroundColor: colors.secondary.hex }}
                />
                <div>
                  <p className="text-sm font-medium text-gray-800">{colors.secondary.hex}</p>
                  {colors.secondary.name && (
                    <p className="text-xs text-gray-500 capitalize">{colors.secondary.name}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {colors.brightness !== undefined && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-gray-700 flex items-center">
                  <Sun className="w-4 h-4 mr-1 text-yellow-500" />
                  Brightness
                </p>
                <span className="text-sm font-bold text-gray-800">{colors.brightness}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${colors.brightness}%` }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className="h-full bg-gradient-to-r from-gray-800 via-yellow-400 to-white rounded-full"
                />
              </div>
            </div>
          )}

          {colors.contrast !== undefined && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-gray-700 flex items-center">
                  <ContrastIcon className="w-4 h-4 mr-1 text-purple-500" />
                  Contrast
                </p>
                <span className="text-sm font-bold text-gray-800">{colors.contrast}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${colors.contrast}%` }}
                  transition={{ delay: 0.6, duration: 0.8 }}
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                />
              </div>
            </div>
          )}

          {colors.temperature && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Color Temperature</p>
              <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                colors.temperature === 'warm' 
                  ? 'bg-orange-100 text-orange-700'
                  : colors.temperature === 'cool'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  colors.temperature === 'warm' 
                    ? 'bg-orange-500'
                    : colors.temperature === 'cool'
                    ? 'bg-blue-500'
                    : 'bg-gray-500'
                }`} />
                {colors.temperature.charAt(0).toUpperCase() + colors.temperature.slice(1)}
              </div>
            </div>
          )}

          {pattern && (
            <>
              {pattern.type && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <Layers className="w-4 h-4 mr-1 text-pink-500" />
                    Pattern Type
                  </p>
                  <div className="inline-flex items-center px-3 py-1.5 bg-pink-100 text-pink-700 rounded-full text-sm font-medium capitalize">
                    {pattern.type}
                  </div>
                </div>
              )}

              {pattern.texture && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Texture</p>
                  <div className="inline-flex items-center px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-medium capitalize">
                    {pattern.texture}
                  </div>
                </div>
              )}

              {pattern.complexity && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Complexity</p>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pattern.complexity.score}%` }}
                        transition={{ delay: 0.7, duration: 0.8 }}
                        className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {pattern.complexity.level}
                    </span>
                  </div>
                </div>
              )}

              {pattern.symmetry && pattern.symmetry.overall !== undefined && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Symmetry</p>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pattern.symmetry.overall}%` }}
                        transition={{ delay: 0.8, duration: 0.8 }}
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                      />
                    </div>
                    <span className="text-sm font-bold text-gray-800">
                      {pattern.symmetry.overall}%
                    </span>
                  </div>
                </div>
              )}
            </>
          )}

          {style && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Detected Style</p>
              <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-sm font-bold capitalize shadow-lg">
                {style}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default FeatureDisplay;
