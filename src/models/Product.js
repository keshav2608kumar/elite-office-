const mongoose = require('mongoose');
const slugify = require('slugify');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name cannot exceed 200 characters']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  sku: {
    type: String,
    unique: true,
    sparse: true,
    uppercase: true,
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['IT & Office Equipment', 'Printing', 'Stationery']
  },
  subcategory: {
    type: String,
    trim: true
  },
  brand: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    maxlength: [5000, 'Description cannot exceed 5000 characters']
  },
  shortDescription: {
    type: String,
    maxlength: [500, 'Short description cannot exceed 500 characters']
  },
  specifications: {
    type: Map,
    of: String
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  compareAtPrice: {
    type: Number,
    min: [0, 'Compare at price cannot be negative']
  },
  stock: {
    type: Number,
    default: 0,
    min: [0, 'Stock cannot be negative']
  },
  images: {
    type: [String],
    validate: [v => v.length <= 10, 'Cannot exceed 10 images']
  },
  thumbnail: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  tags: [String],
  metaTitle: {
    type: String,
    maxlength: [70, 'Meta title cannot exceed 70 characters']
  },
  metaDescription: {
    type: String,
    maxlength: [160, 'Meta description cannot exceed 160 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true, transform: (doc, ret) => { delete ret.__v; return ret; } }
});

// Indexes (slug and sku already have unique: true in field definition)
productSchema.index({ category: 1, isActive: 1, price: 1 });
productSchema.index({ name: 'text', description: 'text', brand: 'text', tags: 'text' });
productSchema.index({ isFeatured: 1, isActive: 1 });
productSchema.index({ createdAt: -1 });

productSchema.pre('save', async function(next) {
  if (this.isModified('name')) {
    let newSlug = slugify(this.name, { lower: true, strict: true });
    
    // Check if slug exists
    const slugExists = await mongoose.models.Product.exists({ _id: { $ne: this._id }, slug: newSlug });
    if (slugExists) {
      newSlug = `${newSlug}-${Math.random().toString(36).substring(2, 8)}`;
    }
    
    this.slug = newSlug;
  }
  next();
});

productSchema.virtual('formattedPrice').get(function() {
  if (this.price == null) return undefined;
  const rupees = this.price / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(rupees);
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
