import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      minlength: [2, 'Product name must be at least 2 characters'],
      maxlength: [200, 'Product name cannot exceed 200 characters'],
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
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    shortDescription: {
      type: String,
      trim: true,
      maxlength: [300, 'Short description cannot exceed 300 characters'],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Product category is required'],
      index: true,
    },
    subcategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
    },
    images: {
      primary: {
        type: String,
        required: [true, 'Primary image is required'],
        validate: {
          validator: function(v) {
            return /^https?:\/\/.+/i.test(v);
          },
          message: 'Please provide a valid image URL',
        },
      },
      gallery: [
        {
          url: String,
          alt: String,
          order: Number,
        },
      ],
      thumbnail: String,
    },
    price: {
      current: {
        type: Number,
        required: [true, 'Current price is required'],
        min: [0, 'Price cannot be negative'],
      },
      original: {
        type: Number,
        min: [0, 'Original price cannot be negative'],
      },
      discount: {
        percentage: {
          type: Number,
          min: 0,
          max: 100,
          default: 0,
        },
        amount: {
          type: Number,
          min: 0,
          default: 0,
        },
      },
      currency: {
        type: String,
        default: 'INR',
        enum: ['INR', 'USD', 'EUR', 'GBP'],
      },
    },
    inventory: {
      quantity: {
        type: Number,
        default: 0,
        min: 0,
      },
      inStock: {
        type: Boolean,
        default: true,
      },
      lowStockThreshold: {
        type: Number,
        default: 5,
      },
      sku: {
        type: String,
        unique: true,
        sparse: true,
      },
    },
    visual: {
      dominantColors: [
        {
          hex: String,
          rgb: {
            r: Number,
            g: Number,
            b: Number,
          },
          percentage: Number,
        },
      ],
      colorPalette: [String],
      primaryColor: String,
      secondaryColor: String,
      brightness: {
        type: Number,
        min: 0,
        max: 100,
      },
      contrast: {
        type: Number,
        min: 0,
        max: 100,
      },
      patterns: [
        {
          type: String,
          enum: ['solid', 'striped', 'checked', 'floral', 'geometric', 'abstract', 'textured', 'plain'],
        },
      ],
      texture: {
        type: String,
        enum: ['smooth', 'rough', 'glossy', 'matte', 'fabric', 'leather', 'metal', 'wood', 'plastic'],
      },
      style: {
        type: String,
        enum: ['modern', 'classic', 'vintage', 'minimalist', 'bohemian', 'industrial', 'rustic', 'contemporary'],
      },
    },
    attributes: {
      brand: {
        type: String,
        trim: true,
        maxlength: 100,
      },
      material: {
        type: String,
        trim: true,
        maxlength: 200,
      },
      color: {
        name: String,
        hex: String,
        variants: [String],
      },
      size: {
        value: String,
        unit: String,
        variants: [String],
      },
      weight: {
        value: Number,
        unit: {
          type: String,
          enum: ['kg', 'g', 'lb', 'oz'],
        },
      },
      dimensions: {
        length: Number,
        width: Number,
        height: Number,
        unit: {
          type: String,
          enum: ['cm', 'in', 'mm', 'm'],
        },
      },
      gender: {
        type: String,
        enum: ['male', 'female', 'unisex', 'kids'],
      },
      ageGroup: {
        type: String,
        enum: ['infant', 'toddler', 'kids', 'teens', 'adults', 'seniors', 'all'],
      },
      season: {
        type: String,
        enum: ['spring', 'summer', 'autumn', 'winter', 'all-season'],
      },
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    ratings: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      count: {
        type: Number,
        default: 0,
        min: 0,
      },
      distribution: {
        five: { type: Number, default: 0 },
        four: { type: Number, default: 0 },
        three: { type: Number, default: 0 },
        two: { type: Number, default: 0 },
        one: { type: Number, default: 0 },
      },
    },
    metrics: {
      views: {
        type: Number,
        default: 0,
      },
      searches: {
        type: Number,
        default: 0,
      },
      clicks: {
        type: Number,
        default: 0,
      },
      purchases: {
        type: Number,
        default: 0,
      },
      favorites: {
        type: Number,
        default: 0,
      },
      shares: {
        type: Number,
        default: 0,
      },
    },
    status: {
      isActive: {
        type: Boolean,
        default: true,
      },
      isFeatured: {
        type: Boolean,
        default: false,
      },
      isNew: {
        type: Boolean,
        default: false,
      },
      isBestseller: {
        type: Boolean,
        default: false,
      },
      isTrending: {
        type: Boolean,
        default: false,
      },
    },
    seo: {
      title: String,
      description: String,
      keywords: [String],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

productSchema.index({ name: 1 });
productSchema.index({ slug: 1 });
productSchema.index({ category: 1, 'status.isActive': 1 });
productSchema.index({ 'price.current': 1 });
productSchema.index({ 'ratings.average': -1 });
productSchema.index({ 'metrics.views': -1 });
productSchema.index({ 'status.isFeatured': 1, 'status.isActive': 1 });
productSchema.index({ 'visual.primaryColor': 1 });
productSchema.index({ tags: 1 });
productSchema.index({ createdAt: -1 });

productSchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

productSchema.pre('save', function(next) {
  if (!this.inventory.sku) {
    this.inventory.sku = `SKU-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  }
  next();
});

productSchema.pre('save', function(next) {
  this.inventory.inStock = this.inventory.quantity > 0;
  next();
});

productSchema.pre('save', function(next) {
  if (this.price.original && this.price.current) {
    const discount = this.price.original - this.price.current;
    this.price.discount.amount = discount;
    this.price.discount.percentage = Math.round((discount / this.price.original) * 100);
  }
  next();
});

productSchema.pre('save', function(next) {
  if (!this.seo.title) {
    this.seo.title = this.name;
  }
  if (!this.seo.description) {
    this.seo.description = this.shortDescription || this.description?.substring(0, 160);
  }
  next();
});

productSchema.virtual('url').get(function() {
  return `/products/${this.slug}`;
});

productSchema.virtual('isOnSale').get(function() {
  return this.price.discount.percentage > 0;
});

productSchema.virtual('isLowStock').get(function() {
  return this.inventory.inStock && this.inventory.quantity <= this.inventory.lowStockThreshold;
});

productSchema.virtual('popularityScore').get(function() {
  const viewWeight = 0.2;
  const searchWeight = 0.3;
  const purchaseWeight = 0.5;
  
  const maxViews = 10000;
  const maxSearches = 1000;
  const maxPurchases = 500;
  
  const viewScore = Math.min(this.metrics.views / maxViews, 1) * viewWeight;
  const searchScore = Math.min(this.metrics.searches / maxSearches, 1) * searchWeight;
  const purchaseScore = Math.min(this.metrics.purchases / maxPurchases, 1) * purchaseWeight;
  
  return Math.round((viewScore + searchScore + purchaseScore) * 100);
});

productSchema.methods.incrementView = async function() {
  this.metrics.views += 1;
  await this.save();
};

productSchema.methods.incrementSearch = async function() {
  this.metrics.searches += 1;
  await this.save();
};

productSchema.methods.incrementClick = async function() {
  this.metrics.clicks += 1;
  await this.save();
};

productSchema.methods.updateRating = async function(newRating) {
  const totalRatings = this.ratings.count;
  const currentAverage = this.ratings.average;
  
  this.ratings.average = ((currentAverage * totalRatings) + newRating) / (totalRatings + 1);
  this.ratings.count += 1;
  
  if (newRating === 5) this.ratings.distribution.five += 1;
  else if (newRating === 4) this.ratings.distribution.four += 1;
  else if (newRating === 3) this.ratings.distribution.three += 1;
  else if (newRating === 2) this.ratings.distribution.two += 1;
  else if (newRating === 1) this.ratings.distribution.one += 1;
  
  await this.save();
};

productSchema.statics.findByCategory = function(categoryId, options = {}) {
  const { limit = 20, skip = 0, sort = '-createdAt' } = options;
  return this.find({ category: categoryId, 'status.isActive': true })
    .sort(sort)
    .limit(limit)
    .skip(skip)
    .populate('category');
};

productSchema.statics.findFeatured = function(limit = 10) {
  return this.find({ 'status.isFeatured': true, 'status.isActive': true })
    .sort('-metrics.views')
    .limit(limit)
    .populate('category');
};

productSchema.statics.findTrending = function(limit = 10) {
  return this.find({ 'status.isTrending': true, 'status.isActive': true })
    .sort('-metrics.purchases -metrics.views')
    .limit(limit)
    .populate('category');
};

productSchema.statics.findByPriceRange = function(min, max, categoryId = null) {
  const query = {
    'price.current': { $gte: min, $lte: max },
    'status.isActive': true,
  };
  if (categoryId) query.category = categoryId;
  return this.find(query).populate('category');
};

productSchema.statics.findByColor = function(color, categoryId = null) {
  const query = {
    $or: [
      { 'visual.primaryColor': { $regex: color, $options: 'i' } },
      { 'visual.colorPalette': { $in: [new RegExp(color, 'i')] } },
      { 'attributes.color.name': { $regex: color, $options: 'i' } },
    ],
    'status.isActive': true,
  };
  if (categoryId) query.category = categoryId;
  return this.find(query).populate('category');
};

productSchema.statics.searchProducts = function(searchTerm, options = {}) {
  const { limit = 20, skip = 0, categoryId = null } = options;
  const query = {
    $or: [
      { name: { $regex: searchTerm, $options: 'i' } },
      { description: { $regex: searchTerm, $options: 'i' } },
      { tags: { $in: [new RegExp(searchTerm, 'i')] } },
      { 'attributes.brand': { $regex: searchTerm, $options: 'i' } },
    ],
    'status.isActive': true,
  };
  if (categoryId) query.category = categoryId;
  return this.find(query).limit(limit).skip(skip).populate('category');
};

const Product = mongoose.model('Product', productSchema);

export default Product;
