const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Assuming validators exist, if not they can be added later
// const validate = require('../middleware/validate');
// const { getProductsValidator } = require('../validators/productValidator');

router.get('/', productController.getProducts);
router.get('/featured', productController.getFeaturedProducts);
router.get('/:slug', productController.getProductBySlug);
router.get('/:slug/related', productController.getRelatedProducts);

module.exports = router;
