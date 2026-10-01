const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const adminOnly = require('../middleware/adminMiddleware');
const upload = require('../middleware/uploadMiddleware');

// POST /api/uploads  (multipart/form-data, field name "image")
// Generic image upload — used for brand logos and anywhere else that needs a
// standalone image URL rather than one attached directly to a product save.
router.post('/', protect, adminOnly, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No image file provided' });
  res.status(201).json({ url: `/uploads/${req.file.filename}` });
});

module.exports = router;
