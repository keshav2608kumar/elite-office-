const mongoose = require('mongoose');
const slugify = require('slugify');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  description: {
    type: String
  },
  image: {
    type: String
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
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
  timestamps: true
});

// Indexes (slug already has unique: true in field definition)
categorySchema.index({ parent: 1 });
categorySchema.index({ isActive: 1, displayOrder: 1 });

categorySchema.pre('save', async function(next) {
  if (this.isModified('name')) {
    let newSlug = slugify(this.name, { lower: true, strict: true });
    
    const slugExists = await mongoose.models.Category.exists({ _id: { $ne: this._id }, slug: newSlug });
    if (slugExists) {
      newSlug = `${newSlug}-${Math.random().toString(36).substring(2, 8)}`;
    }
    
    this.slug = newSlug;
  }
  next();
});

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
