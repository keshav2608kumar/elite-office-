const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Banner title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  subtitle: {
    type: String,
    trim: true,
    maxlength: [200, 'Subtitle cannot exceed 200 characters']
  },
  image: {
    type: String,
    required: [true, 'Banner image URL is required']
  },
  ctaText: {
    type: String,
    default: 'Shop Now'
  },
  ctaLink: {
    type: String,
    default: '/products.html'
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { transform: (doc, ret) => { delete ret.__v; return ret; } }
});

bannerSchema.index({ isActive: 1, displayOrder: 1 });

const Banner = mongoose.model('Banner', bannerSchema);

module.exports = Banner;
