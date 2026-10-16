const mongoose = require('mongoose');
const slugify = require('slugify');

const brandSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Brand name is required'],
    unique: true,
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  logo: {
    type: String
  },
  website: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  displayOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

brandSchema.pre('save', async function(next) {
  if (this.isModified('name')) {
    let newSlug = slugify(this.name, { lower: true, strict: true });
    
    const slugExists = await mongoose.models.Brand.exists({ _id: { $ne: this._id }, slug: newSlug });
    if (slugExists) {
      newSlug = `${newSlug}-${Math.random().toString(36).substring(2, 8)}`;
    }
    
    this.slug = newSlug;
  }
  next();
});

const Brand = mongoose.model('Brand', brandSchema);

module.exports = Brand;
