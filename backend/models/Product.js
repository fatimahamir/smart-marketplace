const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema(
  {
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: [true, 'Product title is required'], trim: true, maxlength: 120 },
    description: { type: String, required: [true, 'Description is required'], maxlength: 3000 },
    category: {
      type: String,
      required: true,
      enum: [
        'Electronics', 'Fashion', 'Home & Living', 'Books', 'Sports',
        'Toys', 'Vehicles', 'Beauty', 'Groceries', 'Other',
      ],
    },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, default: 1, min: 0 },
    images: [{ type: String }],
    tags: [{ type: String }],
    location: {
      city: { type: String, default: '' },
      country: { type: String, default: '' },
    },

    isApproved: { type: Boolean, default: true }, // set false if admin approval required
    isActive: { type: Boolean, default: true },

    favoritesCount: { type: Number, default: 0 },
    viewsCount: { type: Number, default: 0 },

    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
  },
  { timestamps: true }
);

ProductSchema.index({ title: 'text', description: 'text', tags: 'text' });
ProductSchema.index({ category: 1, price: 1 });

module.exports = mongoose.model('Product', ProductSchema);
