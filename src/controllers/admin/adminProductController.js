const Product = require('../../models/Product');
const asyncHandler = require('../../utils/asyncHandler');
const AppError = require('../../utils/AppError');
const ApiFeatures = require('../../utils/apiFeatures');
const { createAuditLog } = require('../../middleware/auditLog');
const { optimizeImage } = require('../../services/imageService');
const { processProductImport } = require('../../services/importService');
const path = require('path');
const fs = require('fs').promises;

exports.getProducts = asyncHandler(async (req, res, next) => {
  const features = new ApiFeatures(Product.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const products = await features.query;
  const total = await new ApiFeatures(Product.find(), req.query).filter().query.countDocuments();

  res.status(200).json({
    status: 'success',
    results: products.length,
    meta: { total, page: req.query.page * 1 || 1 },
    data: { products }
  });
});

exports.createProduct = asyncHandler(async (req, res, next) => {
  const newProduct = await Product.create(req.body);

  await createAuditLog('product_created', req.admin.id, { productId: newProduct._id, name: newProduct.name });

  res.status(201).json({
    status: 'success',
    data: { product: newProduct }
  });
});

exports.updateProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!product) {
    return next(new AppError('No product found with that ID', 404));
  }

  await createAuditLog('product_updated', req.admin.id, { productId: product._id, updates: req.body });

  res.status(200).json({
    status: 'success',
    data: { product }
  });
});

exports.deleteProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });

  if (!product) {
    return next(new AppError('No product found with that ID', 404));
  }

  await createAuditLog('product_deleted', req.admin.id, { productId: product._id });

  res.status(204).json({ status: 'success', data: null });
});

exports.uploadImage = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('No image uploaded', 400));
  }

  const inputPath = req.file.path;
  const filename = `product-${Date.now()}.webp`;
  const outputPath = path.join('public', 'uploads', 'products', filename);

  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  await optimizeImage(inputPath, outputPath, { format: 'webp' });
  await fs.unlink(inputPath).catch(() => {});

  const imageUrl = `/uploads/products/${filename}`;

  res.status(200).json({
    status: 'success',
    data: { imageUrl }
  });
});

exports.bulkImport = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('No file uploaded', 400));
  }

  const result = await processProductImport(req.file.path);

  await createAuditLog('product_bulk_import', req.admin.id, { successCount: result.successCount, failureCount: result.failureCount });

  res.status(200).json({
    status: 'success',
    data: result
  });
});

const xlsx = require("xlsx");

exports.importProducts = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError("No Excel file uploaded", 400));
  }
  
  try {
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    
    let imported = 0;
    let updated = 0;
    let failed = 0;
    let errors = [];
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        if (!row.name || !row.category || !row.price) {
          throw new Error("Missing required fields (name, category, price)");
        }
        
        const pricePaise = Math.round(parseFloat(row.price) * 100);
        
        const productData = {
          name: row.name,
          category: row.category,
          price: pricePaise,
          description: row.description || "",
          brand: row.brand || "",
          stock: parseInt(row.stock) || 0,
          isActive: true
        };
        
        if (row.sku) {
          productData.sku = row.sku.toString().trim().toUpperCase();
        }
        if (row.images) {
          productData.images = row.images.split(",").map(i => i.trim());
        }
        if (row.thumbnail) {
          productData.thumbnail = row.thumbnail.trim();
        }
        
        if (productData.sku) {
          const existing = await Product.findOne({ sku: productData.sku });
          if (existing) {
            await Product.findByIdAndUpdate(existing._id, productData);
            updated++;
            continue;
          }
        }
        
        await Product.create(productData);
        imported++;
      } catch (err) {
        failed++;
        errors.push(`Row ${i + 2} (${row.name || "Unknown"}): ${err.message}`);
      }
    }
    
    // Clean up temp file
    await fs.unlink(req.file.path).catch(() => {});
    
    await createAuditLog(req, "bulk_import", "Product", null, { imported, updated, failed });
    
    res.status(200).json({
      status: "success",
      data: { imported, updated, failed, errors }
    });
  } catch (error) {
    await fs.unlink(req.file.path).catch(() => {});
    return next(new AppError("Failed to parse Excel file", 400));
  }
});

