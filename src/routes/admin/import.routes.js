const express = require('express');
const router = express.Router();
const adminProductController = require('../../controllers/admin/adminProductController');
const { protect, authorize } = require('../../middleware/auth');
const multer = require('multer');
const upload = multer({ dest: 'public/uploads/temp/' });

router.use(protect);
router.use(authorize('superadmin', 'admin'));

router.post('/', upload.single('file'), adminProductController.bulkImport);

module.exports = router;
