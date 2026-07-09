const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema(
  {
    reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    targetType: { type: String, enum: ['product', 'service'], required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
    targetOwner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, maxlength: 1000, default: '' },

    isReported: { type: Boolean, default: false },
    reportReason: { type: String, default: '' },
  },
  { timestamps: true }
);

// Prevent same user reviewing same target twice
ReviewSchema.index({ reviewer: 1, product: 1 }, { unique: true, partialFilterExpression: { product: { $exists: true } } });
ReviewSchema.index({ reviewer: 1, service: 1 }, { unique: true, partialFilterExpression: { service: { $exists: true } } });

module.exports = mongoose.model('Review', ReviewSchema);
