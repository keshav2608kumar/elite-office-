const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  name: String,
  sku: String,
  price: {
    type: Number,
    min: 0
  },
  quantity: {
    type: Number,
    min: 1
  },
  total: {
    type: Number,
    min: 0
  }
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  customer: {
    name: { type: String, required: true },
    company: { type: String, default: '' },
    email: { type: String, required: true, lowercase: true },
    phone: { type: String, required: true },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      pincode: { type: String, default: '' },
      country: { type: String, default: 'India' }
    }
  },
  items: [orderItemSchema],
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  taxRate: {
    type: Number,
    default: 18
  },
  taxAmount: {
    type: Number,
    required: true,
    min: 0
  },
  shippingCost: {
    type: Number,
    default: 0,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['enquiry', 'quotation', 'cod', 'razorpay', 'bank_transfer', 'none'],
    default: 'enquiry'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'quote_sent', 'paid', 'failed', 'refunded', 'not_applicable'],
    default: 'pending'
  },
  paymentDetails: {
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String
  },
  orderStatus: {
    type: String,
    enum: ['enquiry', 'pending', 'quote_prepared', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'enquiry'
  },
  shippingDetails: {
    trackingNumber: String,
    carrier: String,
    estimatedDelivery: Date,
    shippedAt: Date,
    deliveredAt: Date
  },
  statusHistory: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    note: String,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
  }],
  notes: String,
  adminNotes: String,
  cancelReason: String
}, {
  timestamps: true
});

// Indexes (orderNumber already has unique: true in field definition)
orderSchema.index({ 'customer.email': 1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdAt: -1 });

const validTransitions = {
  'enquiry': ['quote_prepared', 'confirmed', 'processing', 'cancelled'],
  'pending': ['quote_prepared', 'confirmed', 'processing', 'cancelled'],
  'quote_prepared': ['confirmed', 'processing', 'cancelled'],
  'confirmed': ['processing', 'shipped', 'cancelled'],
  'processing': ['shipped', 'cancelled'],
  'shipped': ['delivered', 'cancelled'],
  'delivered': ['refunded'],
  'cancelled': ['enquiry', 'pending'],
  'refunded': []
};

orderSchema.pre('save', function(next) {
  if (this.isModified('orderStatus')) {
    // If it's a new document, the transition is from undefined to 'pending' (default)
    // We only validate changes on existing documents
    if (!this.isNew) {
      // Find the previous status. Mongoose doesn't easily expose the *old* value in pre('save') 
      // if it wasn't fetched explicitly. We can use this.$locals or assume we need to check against db, 
      // but standard approach requires fetch or passing old status.
      // However, a simple state machine validation in pre-save without knowing old state exactly
      // can be tricky if we don't have it. We will assume standard update flows.
      // A safer approach is to use validate hook if we have old value, but let's implement basic check.
      // Since `this.orderStatus` is the NEW status, we can't fully validate transition without old status.
      // We will skip strict old-new validation here unless we hook into pre('findOneAndUpdate') etc.,
      // but user asked for: Add a pre-save middleware that validates order status transitions.
      // Let's assume `this._original` might be populated, or we can fetch it.
      
      const oldStatus = this._original ? this._original.orderStatus : 'pending'; // This is a simplification
      // A better way is to do it in the service layer. We'll do a basic check if possible, or just let it pass
      // if we can't confidently determine old status. 
      // Wait, Mongoose `this.isModified` is true, but `this` has the new values. 
      // We can fetch the document from DB to check old status if not new.
    }
  }
  next();
});

// Implementing proper state machine transition check by fetching the old document if needed
orderSchema.pre('save', async function(next) {
  if (!this.isNew && this.isModified('orderStatus')) {
    const oldDoc = await this.constructor.findById(this._id);
    if (oldDoc) {
      const oldStatus = oldDoc.orderStatus;
      const newStatus = this.orderStatus;
      
      const allowed = validTransitions[oldStatus] || [];
      if (!allowed.includes(newStatus) && oldStatus !== newStatus) {
        return next(new Error(`Invalid status transition from ${oldStatus} to ${newStatus}`));
      }
    }
  }
  next();
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
