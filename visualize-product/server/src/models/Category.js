import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
      minlength: [2, 'Category name must be at least 2 characters'],
      maxlength: [50, 'Category name cannot exceed 50 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    icon: {
      type: String,
      default: '🏷️',
    },
    image: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^https?:\/\/.+/i.test(v);
        },
        message: 'Please provide a valid image URL',
      },
    },
    color: {
      primary: {
        type: String,
        default: '#667eea',
        validate: {
          validator: function(v) {
            return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
          },
          message: 'Please provide a valid hex color',
        },
      },
      secondary: {
        type: String,
        default: '#764ba2',
        validate: {
          validator: function(v) {
            return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
          },
          message: 'Please provide a valid hex color',
        },
      },
      gradient: {
        type: String,
        default: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      },
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    subcategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
      },
    ],
    metadata: {
      productCount: {
        type: Number,
        default: 0,
        min: 0,
      },
      searchCount: {
        type: Number,
        default: 0,
        min: 0,
      },
      averagePrice: {
        type: Number,
        default: 0,
        min: 0,
      },
      popularity: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      trending: {
        type: Boolean,
        default: false,
      },
      featured: {
        type: Boolean,
        default: false,
      },
    },
    seo: {
      title: String,
      description: String,
      keywords: [String],
    },
    filters: [
      {
        name: {
          type: String,
          required: true,
        },
        type: {
          type: String,
          enum: ['range', 'checkbox', 'radio', 'color', 'size'],
          required: true,
        },
        options: [mongoose.Schema.Types.Mixed],
      },
    ],
    sortOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

categorySchema.index({ name: 1 });
categorySchema.index({ slug: 1 });
categorySchema.index({ 'metadata.popularity': -1 });
categorySchema.index({ 'metadata.productCount': -1 });
categorySchema.index({ isActive: 1, sortOrder: 1 });

categorySchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

categorySchema.pre('save', function(next) {
  if (!this.seo.title) {
    this.seo.title = this.name;
  }
  if (!this.seo.description) {
    this.seo.description = this.description || `Browse our collection of ${this.name}`;
  }
  next();
});

categorySchema.virtual('products', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'category',
});

categorySchema.virtual('url').get(function() {
  return `/categories/${this.slug}`;
});

categorySchema.virtual('isParent').get(function() {
  return this.subcategories && this.subcategories.length > 0;
});

categorySchema.virtual('hasProducts').get(function() {
  return this.metadata.productCount > 0;
});

categorySchema.methods.incrementSearchCount = async function() {
  this.metadata.searchCount += 1;
  await this.save();
};

categorySchema.methods.updateProductCount = async function() {
  const Product = mongoose.model('Product');
  const count = await Product.countDocuments({ category: this._id });
  this.metadata.productCount = count;
  await this.save();
  return count;
};

categorySchema.methods.updateAveragePrice = async function() {
  const Product = mongoose.model('Product');
  const result = await Product.aggregate([
    { $match: { category: this._id } },
    { $group: { _id: null, avgPrice: { $avg: '$price' } } },
  ]);
  this.metadata.averagePrice = result[0]?.avgPrice || 0;
  await this.save();
  return this.metadata.averagePrice;
};

categorySchema.methods.calculatePopularity = async function() {
  const searchWeight = 0.4;
  const productWeight = 0.3;
  const priceWeight = 0.3;
  
  const maxSearch = 1000;
  const maxProducts = 100;
  const maxPrice = 10000;
  
  const searchScore = Math.min(this.metadata.searchCount / maxSearch, 1) * searchWeight;
  const productScore = Math.min(this.metadata.productCount / maxProducts, 1) * productWeight;
  const priceScore = Math.min(this.metadata.averagePrice / maxPrice, 1) * priceWeight;
  
  this.metadata.popularity = Math.round((searchScore + productScore + priceScore) * 100);
  await this.save();
  return this.metadata.popularity;
};

categorySchema.statics.getFeaturedCategories = function(limit = 6) {
  return this.find({ 'metadata.featured': true, isActive: true })
    .sort({ sortOrder: 1 })
    .limit(limit);
};

categorySchema.statics.getTrendingCategories = function(limit = 6) {
  return this.find({ 'metadata.trending': true, isActive: true })
    .sort({ 'metadata.popularity': -1 })
    .limit(limit);
};

categorySchema.statics.getPopularCategories = function(limit = 10) {
  return this.find({ isActive: true })
    .sort({ 'metadata.popularity': -1, 'metadata.productCount': -1 })
    .limit(limit);
};

categorySchema.statics.searchCategories = function(query, limit = 10) {
  return this.find({
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { tags: { $in: [new RegExp(query, 'i')] } },
    ],
    isActive: true,
  }).limit(limit);
};

categorySchema.statics.getCategoryTree = async function() {
  const categories = await this.find({ isActive: true })
    .populate('subcategories')
    .sort({ sortOrder: 1 });
  
  const tree = categories.filter(cat => !cat.parentCategory);
  return tree;
};

categorySchema.statics.getCategoryStats = async function() {
  const total = await this.countDocuments({ isActive: true });
  const featured = await this.countDocuments({ 'metadata.featured': true, isActive: true });
  const trending = await this.countDocuments({ 'metadata.trending': true, isActive: true });
  
  const topCategories = await this.find({ isActive: true })
    .sort({ 'metadata.popularity': -1 })
    .limit(5)
    .select('name metadata.popularity metadata.productCount');
  
  return { total, featured, trending, topCategories };
};

const Category = mongoose.model('Category', categorySchema);

export default Category;
