const mongoose = require('mongoose');

const ServiceSchema = new mongoose.Schema(
  {
    provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: [true, 'Service title is required'], trim: true, maxlength: 120 },
    description: { type: String, required: [true, 'Description is required'], maxlength: 3000 },
    category: {
      type: String,
      required: true,
      enum: [
        'Graphic Designing', 'Web Development', 'Photography', 'Home Services',
        'Tutoring', 'Content Writing', 'Digital Marketing', 'Video Editing', 'Other',
      ],
    },
    pricing: {
      amount: { type: Number, required: true, min: 0 },
      type: { type: String, enum: ['fixed', 'hourly'], default: 'fixed' },
    },
    deliveryTime: { type: String, required: true }, // e.g. "3 days"
    availability: { type: Boolean, default: true },
    portfolioImages: [{ type: String }],
    location: {
      city: { type: String, default: '' },
      country: { type: String, default: '' },
    },

    isApproved: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },

    favoritesCount: { type: Number, default: 0 },
    viewsCount: { type: Number, default: 0 },

    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
  },
  { timestamps: true }
);

ServiceSchema.index({ title: 'text', description: 'text' });
ServiceSchema.index({ category: 1, 'pricing.amount': 1 });

module.exports = mongoose.model('Service', ServiceSchema);
