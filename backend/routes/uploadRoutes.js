/**
 * Cloudinary Upload Routes
 * Upload hình ảnh sản phẩm lên Cloudinary thay vì lưu cục bộ
 */
const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const createUploadRouter = ({ requireAuth, requireAdmin }) => {
  const router = express.Router();

  // Configure Cloudinary
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'demo',
    api_key: process.env.CLOUDINARY_API_KEY || '',
    api_secret: process.env.CLOUDINARY_API_SECRET || ''
  });

  // Configure Multer with Cloudinary Storage
  const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'lab-billiard',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
      transformation: [
        { width: 1200, height: 1200, crop: 'limit', quality: 'auto:best', format: 'webp' }
      ]
    }
  });

  const upload = multer({
    storage: storage,
    limits: {
      fileSize: 10 * 1024 * 1024 // 10MB limit
    }
  });

  // ─── UPLOAD SINGLE IMAGE ───
  router.post('/image', requireAuth, requireAdmin, upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No image file provided' });
      }

      return res.json({
        url: req.file.path,
        publicId: req.file.filename,
        format: req.file.format || 'webp',
        width: req.file.width,
        height: req.file.height,
        size: req.file.size
      });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  });

  // ─── UPLOAD MULTIPLE IMAGES ───
  router.post('/images', requireAuth, requireAdmin, upload.array('images', 10), async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'No image files provided' });
      }

      const uploadedImages = req.files.map((file) => ({
        url: file.path,
        publicId: file.filename,
        format: file.format || 'webp',
        size: file.size
      }));

      return res.json({ images: uploadedImages });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  });

  // ─── DELETE IMAGE FROM CLOUDINARY ───
  router.delete('/image/:publicId', requireAuth, requireAdmin, async (req, res) => {
    try {
      const publicId = decodeURIComponent(req.params.publicId);

      if (!publicId) {
        return res.status(400).json({ message: 'Public ID is required' });
      }

      const result = await cloudinary.uploader.destroy(publicId);

      return res.json({
        message: 'Image deleted successfully',
        result: result.result
      });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  });

  // ─── GET CLOUDINARY CONFIG STATUS ───
  router.get('/config-status', requireAuth, requireAdmin, async (req, res) => {
    try {
      const isConfigured =
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET;

      if (!isConfigured) {
        return res.json({
          configured: false,
          message: 'Cloudinary chưa được cấu hình. Vui lòng thêm CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET vào file .env'
        });
      }

      // Test connection
      try {
        await cloudinary.api.ping();
        return res.json({
          configured: true,
          cloudName: process.env.CLOUDINARY_CLOUD_NAME,
          message: 'Cloudinary đã sẵn sàng'
        });
      } catch (pingError) {
        return res.json({
          configured: false,
          message: 'Không thể kết nối tới Cloudinary. Vui lòng kiểm tra lại thông tin xác thực.'
        });
      }
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  });

  return router;
};

module.exports = createUploadRouter;
