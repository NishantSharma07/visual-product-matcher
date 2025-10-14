import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Image as ImageIcon, X, Check, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const ImageUploader = ({ onImageUpload }) => {
  const [preview, setPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      const error = rejectedFiles[0].errors[0];
      if (error.code === 'file-too-large') {
        toast.error('File size must be less than 10MB');
      } else if (error.code === 'file-invalid-type') {
        toast.error('Please upload a valid image file (JPEG, PNG, WebP)');
      } else {
        toast.error('Invalid file');
      }
      return;
    }

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const reader = new FileReader();

      reader.onload = () => {
        setPreview(reader.result);
      };

      reader.readAsDataURL(file);
      onImageUpload(file);
    }
  }, [onImageUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
  });

  const clearPreview = (e) => {
    e.stopPropagation();
    setPreview(null);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-3xl p-8 md:p-12"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="w-20 h-20 mx-auto mb-6 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-neon"
          >
            <Upload className="w-10 h-10 text-white" />
          </motion.div>

          <h2 className="text-3xl font-bold text-gray-800 mb-3">
            Upload Your Image
          </h2>
          <p className="text-gray-600 text-lg">
            Drag and drop or click to browse
          </p>
        </div>

        <AnimatePresence mode="wait">
          {!preview ? (
            <motion.div
              key="upload-area"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              {...getRootProps()}
              className={`relative border-3 border-dashed rounded-2xl p-12 transition-all duration-300 cursor-pointer ${
                isDragActive || isDragging
                  ? 'border-primary-500 bg-primary-50 scale-102'
                  : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
              }`}
            >
              <input {...getInputProps()} />

              <div className="text-center">
                <motion.div
                  animate={{
                    y: isDragActive ? -10 : 0,
                    scale: isDragActive ? 1.1 : 1,
                  }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <ImageIcon className={`w-24 h-24 mx-auto mb-6 transition-colors ${
                    isDragActive ? 'text-primary-500' : 'text-gray-400'
                  }`} />
                </motion.div>

                <p className="text-xl font-semibold text-gray-700 mb-2">
                  {isDragActive ? 'Drop your image here' : 'Click or drag to upload'}
                </p>
                <p className="text-gray-500">
                  Supports: JPEG, PNG, WebP (Max 10MB)
                </p>

                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  <div className="flex items-center px-4 py-2 bg-white rounded-full shadow-sm">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    <span className="text-sm text-gray-600">High Quality</span>
                  </div>
                  <div className="flex items-center px-4 py-2 bg-white rounded-full shadow-sm">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    <span className="text-sm text-gray-600">Fast Processing</span>
                  </div>
                  <div className="flex items-center px-4 py-2 bg-white rounded-full shadow-sm">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    <span className="text-sm text-gray-600">AI Powered</span>
                  </div>
                </div>
              </div>

              {isDragActive && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-primary-500/10 rounded-2xl pointer-events-none"
                />
              )}
            </motion.div>
          ) : (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-auto max-h-96 object-contain bg-gray-100"
                />

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={clearPreview}
                  className="absolute top-4 right-4 w-10 h-10 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </motion.button>

                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
                  <div className="flex items-center text-white">
                    <Check className="w-5 h-5 mr-2" />
                    <span className="font-semibold">Image uploaded successfully</span>
                  </div>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start"
              >
                <AlertCircle className="w-5 h-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-700">
                  <p className="font-semibold mb-1">Processing your image...</p>
                  <p>Our AI is analyzing colors, patterns, and visual features to find the best matches.</p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center"
          >
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">🎨</span>
            </div>
            <h4 className="font-semibold text-gray-800 mb-1">Color Analysis</h4>
            <p className="text-sm text-gray-600">Detects dominant colors and palettes</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">🔍</span>
            </div>
            <h4 className="font-semibold text-gray-800 mb-1">Pattern Detection</h4>
            <p className="text-sm text-gray-600">Identifies textures and patterns</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">⚡</span>
            </div>
            <h4 className="font-semibold text-gray-800 mb-1">Smart Matching</h4>
            <p className="text-sm text-gray-600">Finds visually similar products</p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default ImageUploader;
