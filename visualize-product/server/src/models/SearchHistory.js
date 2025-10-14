import mongoose from 'mongoose';
import dayjs from 'dayjs';

const searchHistorySchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      default: 'anonymous',
      index: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true,
    },
    uploadedImage: {
      url: String,
      thumbnail: String,
      size: Number,
      mimeType: String,
    },
    extractedFeatures: {
      dominantColors: [
        {
          hex: String,
          rgb: { r: Number, g: Number, b: Number },
          percentage: Number,
        },
      ],
      colorPalette: [String],
      brightness: Number,
      contrast: Number,
      detectedPatterns: [String],
      detectedTexture: String,
      detectedStyle: String,
    },
    matchResults: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
        },
        similarityScore: {
          type: Number,
          min: 0,
          max: 100,
        },
        matchFactors: {
          colorMatch: Number,
          patternMatch: Number,
          styleMatch: Number,
          priceMatch: Number,
        },
        rank: Number,
      },
    ],
    resultsCount: {
      type: Number,
      default: 0,
    },
    filters: {
      priceRange: {
        min: Number,
        max: Number,
      },
      colors: [String],
      brands: [String],
      sizes: [String],
      sortBy: {
        type: String,
        enum: ['relevance', 'price-low', 'price-high', 'popularity', 'newest'],
        default: 'relevance',
      },
    },
    userInteraction: {
      clickedProducts: [
        {
          product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
          },
          timestamp: Date,
          rank: Number,
        },
      ],
      viewDuration: Number,
      scrollDepth: Number,
      refinedSearch: Boolean,
      abandonedSearch: Boolean,
    },
    performance: {
      imageUploadTime: Number,
      featureExtractionTime: Number,
      matchingTime: Number,
      totalResponseTime: Number,
    },
    metadata: {
      userAgent: String,
      ipAddress: String,
      deviceType: {
        type: String,
        enum: ['mobile', 'tablet', 'desktop', 'unknown'],
        default: 'unknown',
      },
      browser: String,
      os: String,
      screenResolution: String,
      referrer: String,
    },
    searchQuality: {
      userSatisfaction: {
        type: Number,
        min: 0,
        max: 5,
      },
      feedback: String,
      wasHelpful: Boolean,
      reportedIssue: Boolean,
    },
    status: {
      type: String,
      enum: ['initiated', 'processing', 'completed', 'failed', 'abandoned'],
      default: 'initiated',
    },
    errorDetails: {
      message: String,
      code: String,
      timestamp: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

searchHistorySchema.index({ sessionId: 1, createdAt: -1 });
searchHistorySchema.index({ category: 1, createdAt: -1 });
searchHistorySchema.index({ status: 1, createdAt: -1 });
searchHistorySchema.index({ 'metadata.deviceType': 1 });
searchHistorySchema.index({ createdAt: -1 });
searchHistorySchema.index({ 'searchQuality.userSatisfaction': -1 });

searchHistorySchema.virtual('successRate').get(function() {
  if (this.resultsCount === 0) return 0;
  const clickCount = this.userInteraction.clickedProducts.length;
  return Math.round((clickCount / Math.min(this.resultsCount, 10)) * 100);
});

searchHistorySchema.virtual('averageRank').get(function() {
  if (this.userInteraction.clickedProducts.length === 0) return null;
  const totalRank = this.userInteraction.clickedProducts.reduce((sum, item) => sum + item.rank, 0);
  return (totalRank / this.userInteraction.clickedProducts.length).toFixed(2);
});

searchHistorySchema.virtual('wasSuccessful').get(function() {
  return this.status === 'completed' && this.resultsCount > 0 && this.userInteraction.clickedProducts.length > 0;
});

searchHistorySchema.methods.addClickedProduct = async function(productId, rank) {
  this.userInteraction.clickedProducts.push({
    product: productId,
    timestamp: new Date(),
    rank: rank,
  });
  await this.save();
};

searchHistorySchema.methods.updateViewDuration = async function(duration) {
  this.userInteraction.viewDuration = duration;
  await this.save();
};

searchHistorySchema.methods.setUserSatisfaction = async function(rating, feedback = '') {
  this.searchQuality.userSatisfaction = rating;
  this.searchQuality.feedback = feedback;
  this.searchQuality.wasHelpful = rating >= 3;
  await this.save();
};

searchHistorySchema.methods.markAsAbandoned = async function() {
  this.status = 'abandoned';
  this.userInteraction.abandonedSearch = true;
  await this.save();
};

searchHistorySchema.methods.recordError = async function(errorMessage, errorCode) {
  this.status = 'failed';
  this.errorDetails = {
    message: errorMessage,
    code: errorCode,
    timestamp: new Date(),
  };
  await this.save();
};

searchHistorySchema.statics.getSearchStats = async function(dateRange = {}) {
  const { startDate, endDate } = dateRange;
  const match = {};
  
  if (startDate) match.createdAt = { $gte: new Date(startDate) };
  if (endDate) match.createdAt = { ...match.createdAt, $lte: new Date(endDate) };

  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalSearches: { $sum: 1 },
        completedSearches: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        failedSearches: {
          $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
        },
        abandonedSearches: {
          $sum: { $cond: [{ $eq: ['$status', 'abandoned'] }, 1, 0] }
        },
        avgResultsCount: { $avg: '$resultsCount' },
        avgResponseTime: { $avg: '$performance.totalResponseTime' },
        avgSatisfaction: { $avg: '$searchQuality.userSatisfaction' },
      }
    }
  ]);

  return stats[0] || {};
};

searchHistorySchema.statics.getPopularCategories = async function(limit = 10) {
  return this.aggregate([
    { $match: { status: 'completed' } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'categories',
        localField: '_id',
        foreignField: '_id',
        as: 'categoryDetails'
      }
    },
    { $unwind: '$categoryDetails' },
    {
      $project: {
        category: '$categoryDetails',
        searchCount: '$count'
      }
    }
  ]);
};

searchHistorySchema.statics.getTrendingColors = async function(categoryId = null, limit = 10) {
  const match = { status: 'completed' };
  if (categoryId) match.category = mongoose.Types.ObjectId(categoryId);

  return this.aggregate([
    { $match: match },
    { $unwind: '$extractedFeatures.colorPalette' },
    { $group: { _id: '$extractedFeatures.colorPalette', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit },
    { $project: { color: '$_id', searches: '$count', _id: 0 } }
  ]);
};

searchHistorySchema.statics.getDeviceStats = async function() {
  return this.aggregate([
    {
      $group: {
        _id: '$metadata.deviceType',
        count: { $sum: 1 },
        avgResponseTime: { $avg: '$performance.totalResponseTime' },
        successRate: {
          $avg: {
            $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
          }
        }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

searchHistorySchema.statics.getHourlyStats = async function(date) {
  const startOfDay = dayjs(date).startOf('day').toDate();
  const endOfDay = dayjs(date).endOf('day').toDate();

  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      }
    },
    {
      $group: {
        _id: { $hour: '$createdAt' },
        searches: { $sum: 1 },
        avgResponseTime: { $avg: '$performance.totalResponseTime' }
      }
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        hour: '$_id',
        searches: 1,
        avgResponseTime: { $round: ['$avgResponseTime', 2] },
        _id: 0
      }
    }
  ]);
};

searchHistorySchema.statics.getUserJourney = async function(sessionId) {
  return this.find({ sessionId })
    .sort({ createdAt: 1 })
    .populate('category')
    .populate('matchResults.product');
};

searchHistorySchema.statics.getConversionFunnel = async function() {
  const total = await this.countDocuments();
  const completed = await this.countDocuments({ status: 'completed' });
  const withClicks = await this.countDocuments({
    'userInteraction.clickedProducts.0': { $exists: true }
  });
  const satisfied = await this.countDocuments({
    'searchQuality.userSatisfaction': { $gte: 3 }
  });

  return {
    totalSearches: total,
    completedSearches: completed,
    searchesWithClicks: withClicks,
    satisfiedUsers: satisfied,
    completionRate: total > 0 ? ((completed / total) * 100).toFixed(2) : 0,
    clickRate: completed > 0 ? ((withClicks / completed) * 100).toFixed(2) : 0,
    satisfactionRate: withClicks > 0 ? ((satisfied / withClicks) * 100).toFixed(2) : 0,
  };
};

searchHistorySchema.statics.cleanupOldRecords = async function(daysOld = 90) {
  const cutoffDate = dayjs().subtract(daysOld, 'days').toDate();
  const result = await this.deleteMany({ createdAt: { $lt: cutoffDate } });
  return result.deletedCount;
};

const SearchHistory = mongoose.model('SearchHistory', searchHistorySchema);

export default SearchHistory;
