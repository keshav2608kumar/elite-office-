const xlsx = require('xlsx');
const fs = require('fs').promises;
const Product = require('../models/Product'); // Assuming Product model exists
const logger = require('../utils/logger'); // Assuming logger exists

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const processProductImport = async (filePath) => {
  try {
    const stats = await fs.stat(filePath);
    if (stats.size > MAX_FILE_SIZE) {
      throw new Error('File size exceeds the 5MB limit.');
    }

    const workbook = xlsx.readFile(filePath, { cellFormula: false, cellHTML: false, cellNF: false });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    const successful = [];
    const failed = [];
    const bulkOps = [];

    // valid category enum (ideally from model or config)
    const validCategories = ['IT & Office Equipment', 'Printing', 'Stationery'];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2; // Assuming 1 header row
      const errors = [];

      // Validation
      if (!row.name || typeof row.name !== 'string' || row.name.trim() === '') {
        errors.push('Name is required and cannot be empty.');
      }
      if (!row.category || !validCategories.includes(row.category)) {
        errors.push(`Invalid or missing category. Allowed: ${validCategories.join(', ')}`);
      }
      if (typeof row.price !== 'number' || row.price <= 0) {
        errors.push('Price must be a positive number.');
      }
      if (row.stock === undefined || typeof row.stock !== 'number' || row.stock < 0 || !Number.isInteger(row.stock)) {
        errors.push('Stock must be a non-negative integer.');
      }
      if (!row.sku) {
        errors.push('SKU is required.');
      }

      if (errors.length > 0) {
        failed.push({ row: rowNumber, errors });
      } else {
        const slug = row.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

        bulkOps.push({
          updateOne: {
            filter: { sku: row.sku },
            update: {
              $set: {
                name: row.name,
                slug: slug,
                category: row.category,
                price: Math.round(row.price * 100), // converting to paise if xlsx has rupees, or assume it's rupees in xlsx. Wait, user instruction says price in PAISE. Let's assume input is in INR and we store in paise.
                stock: row.stock,
                description: row.description || '',
                isActive: row.isActive !== undefined ? row.isActive : true,
              }
            },
            upsert: true
          }
        });
        successful.push(row.sku);
      }
    }

    if (bulkOps.length > 0) {
      await Product.bulkWrite(bulkOps);
    }

    // Cleanup
    await fs.unlink(filePath).catch(err => logger.error(`Failed to delete file ${filePath}:`, err));

    return {
      successful,
      failed,
      totalRows: data.length,
      successCount: successful.length,
      failureCount: failed.length
    };
  } catch (error) {
    await fs.unlink(filePath).catch(() => {}); // Attempt cleanup on error
    throw error;
  }
};

module.exports = {
  processProductImport,
};
