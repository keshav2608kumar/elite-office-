const formatPrice = (paise) => {
  return (paise / 100).toFixed(2);
};

const generateOrderSummary = (order) => {
  const businessName = process.env.BUSINESS_NAME || 'Elite Office Technologies';
  const businessGstin = process.env.BUSINESS_GSTIN || '';
  const businessAddress = process.env.BUSINESS_ADDRESS || '';

  const items = order.items.map((item) => {
    return {
      name: item.name,
      quantity: item.quantity,
      unitPrice: formatPrice(item.price), // assuming price is in paise
      totalPrice: formatPrice(item.price * item.quantity),
    };
  });

  const subtotalPaise = order.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const taxRate = parseInt(process.env.DEFAULT_TAX_RATE || '18', 10);
  const isInterState = order.shippingAddress?.state !== process.env.BUSINESS_STATE;

  let taxCalculations = {};
  const taxAmountPaise = Math.round(subtotalPaise * (taxRate / 100));

  if (isInterState) {
    taxCalculations = {
      igst: { rate: taxRate, amount: formatPrice(taxAmountPaise) },
    };
  } else {
    const halfRate = taxRate / 2;
    const halfTaxAmount = Math.round(taxAmountPaise / 2);
    taxCalculations = {
      cgst: { rate: halfRate, amount: formatPrice(halfTaxAmount) },
      sgst: { rate: halfRate, amount: formatPrice(taxAmountPaise - halfTaxAmount) },
    };
  }

  const totalPaise = subtotalPaise + taxAmountPaise; // Shipping handled separately if needed

  return {
    invoiceNumber: order.orderNumber,
    date: order.createdAt || new Date(),
    businessInfo: {
      name: businessName,
      gstin: businessGstin,
      address: businessAddress,
    },
    customerInfo: order.customerInfo,
    shippingAddress: order.shippingAddress,
    items,
    summary: {
      subtotal: formatPrice(subtotalPaise),
      taxes: taxCalculations,
      total: formatPrice(totalPaise),
    },
  };
};

module.exports = {
  generateOrderSummary,
};
