const express = require('express');
const router = express.Router();
const adminProductController = require('../../controllers/admin/adminProductController');
const { protect, authorize } = require('../../middleware/auth');
const multer = require('multer');
const upload = multer({ dest: 'public/uploads/temp/' });

router.use(protect);
router.use(authorize('superadmin', 'admin'));

router.route('/')
  .get(adminProductController.getProducts)
  .post(adminProductController.createProduct);

router.post('/upload-image', upload.single('image'), adminProductController.uploadImage);

router.post('/import', upload.single('file'), adminProductController.importProducts);

router.route('/:id')
  .put(adminProductController.updateProduct)
  .delete(authorize('superadmin'), adminProductController.deleteProduct);

module.exports = router;
