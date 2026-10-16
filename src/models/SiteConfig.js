const mongoose = require('mongoose');

const siteConfigSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  type: {
    type: String,
    enum: ['string', 'number', 'boolean', 'json'],
    default: 'string'
  },
  description: {
    type: String
  },
  isPublic: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

siteConfigSchema.statics.get = async function(key) {
  const config = await this.findOne({ key });
  return config ? config.value : null;
};

siteConfigSchema.statics.set = async function(key, value, options = {}) {
  const data = { key, value, ...options };
  return await this.findOneAndUpdate(
    { key },
    { $set: data },
    { new: true, upsert: true, runValidators: true }
  );
};

siteConfigSchema.statics.getPublic = async function() {
  const configs = await this.find({ isPublic: true });
  const result = {};
  configs.forEach(config => {
    result[config.key] = config.value;
  });
  return result;
};

const SiteConfig = mongoose.model('SiteConfig', siteConfigSchema);

module.exports = SiteConfig;
