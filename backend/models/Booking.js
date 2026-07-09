const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema(
  {
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    preferredDate: { type: Date, required: true },
    preferredTime: { type: String, required: true },

    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
      default: 'pending',
    },

    price: { type: Number, required: true },
    notes: { type: String, maxlength: 1000, default: '' },
    cancelReason: { type: String, default: '' },
  },
  { timestamps: true }
);

BookingSchema.index({ buyer: 1, status: 1 });
BookingSchema.index({ provider: 1, status: 1 });

module.exports = mongoose.model('Booking', BookingSchema);
