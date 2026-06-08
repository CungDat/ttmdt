const express = require('express');

const createVoucherRouter = ({ requireAuth, requireAdmin, Voucher }) => {
  const router = express.Router();

  // ─── PUBLIC: Kiểm tra & áp dụng voucher khi checkout ───
  router.post('/validate', requireAuth, async (req, res) => {
    try {
      const code = String(req.body?.code || '').toUpperCase().trim();
      const subtotal = Number(req.body?.subtotal || 0);
      const shippingFee = Number(req.body?.shippingFee || 0);

      if (!code) return res.status(400).json({ message: 'Please enter a voucher code' });
      if (subtotal <= 0) return res.status(400).json({ message: 'Invalid order value' });

      const voucher = await Voucher.findOne({ code });
      if (!voucher) {
        return res.status(404).json({ message: 'Voucher code does not exist' });
      }

      const validation = voucher.validateVoucher(req.authUser?._id, subtotal);
      if (!validation.valid) {
        return res.status(400).json({ message: validation.error });
      }

      const { discount, shippingFee: newShippingFee } = voucher.calculateDiscount(subtotal, shippingFee);

      return res.json({
        valid: true,
        code: voucher.code,
        description: voucher.description,
        type: voucher.type,
        discount,
        shippingFee: newShippingFee,
        finalTotal: Math.max(0, subtotal + newShippingFee - discount)
      });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  });

  // ─── ADMIN: Lấy danh sách vouchers ───
  router.get('/', requireAuth, requireAdmin, async (req, res) => {
    try {
      const page = Math.max(1, Number(req.query?.page) || 1);
      const limit = Math.min(50, Number(req.query?.limit) || 20);
      const search = String(req.query?.search || '').trim();
      const isActive = req.query?.isActive;

      const filter = {};
      if (search) filter.code = { $regex: search, $options: 'i' };
      if (isActive === 'true') filter.isActive = true;
      if (isActive === 'false') filter.isActive = false;

      const [vouchers, total] = await Promise.all([
        Voucher.find(filter)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
        Voucher.countDocuments(filter)
      ]);

      return res.json({ vouchers, total, page, totalPages: Math.ceil(total / limit) });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  });

  // ─── ADMIN: Tạo voucher mới ───
  router.post('/', requireAuth, requireAdmin, async (req, res) => {
    try {
      const code = String(req.body?.code || '').toUpperCase().trim();
      if (!code) return res.status(400).json({ message: 'Voucher code cannot be empty' });
      if (!['percent', 'fixed', 'freeship'].includes(req.body?.type)) {
        return res.status(400).json({ message: 'Invalid voucher type (percent/fixed/freeship)' });
      }

      const existing = await Voucher.findOne({ code });
      if (existing) return res.status(409).json({ message: 'Voucher code already exists' });

      const voucher = await Voucher.create({
        code,
        description: String(req.body?.description || '').trim(),
        type: req.body.type,
        value: Number(req.body?.value || 0),
        minOrderValue: Number(req.body?.minOrderValue || 0),
        maxDiscount: Number(req.body?.maxDiscount || 0),
        usageLimit: Number(req.body?.usageLimit || 0),
        perUserLimit: Number(req.body?.perUserLimit || 1),
        startDate: req.body?.startDate ? new Date(req.body.startDate) : null,
        endDate: req.body?.endDate ? new Date(req.body.endDate) : null,
        isActive: req.body?.isActive !== false,
        createdBy: req.authUser._id
      });

      return res.status(201).json({ voucher });
    } catch (err) {
      if (err.code === 11000) return res.status(409).json({ message: 'Voucher code already exists' });
      return res.status(500).json({ message: err.message });
    }
  });

  // ─── ADMIN: Cập nhật voucher ───
  router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
      const voucher = await Voucher.findById(req.params.id);
      if (!voucher) return res.status(404).json({ message: 'Voucher does not exist' });

      const updatableFields = [
        'description', 'type', 'value', 'minOrderValue', 'maxDiscount',
        'usageLimit', 'perUserLimit', 'startDate', 'endDate', 'isActive'
      ];

      for (const field of updatableFields) {
        if (req.body[field] !== undefined) {
          if (field === 'startDate' || field === 'endDate') {
            voucher[field] = req.body[field] ? new Date(req.body[field]) : null;
          } else {
            voucher[field] = req.body[field];
          }
        }
      }

      await voucher.save();
      return res.json({ voucher });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  });

  // ─── ADMIN: Xóa voucher ───
  router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
      const voucher = await Voucher.findByIdAndDelete(req.params.id);
      if (!voucher) return res.status(404).json({ message: 'Voucher does not exist' });
      return res.json({ message: 'Voucher deleted successfully' });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  });

  // ─── ADMIN: Reset số lần sử dụng ───
  router.post('/:id/reset-usage', requireAuth, requireAdmin, async (req, res) => {
    try {
      const voucher = await Voucher.findByIdAndUpdate(
        req.params.id,
        { usedCount: 0, usedBy: [] },
        { new: true }
      );
      if (!voucher) return res.status(404).json({ message: 'Voucher does not exist' });
      return res.json({ voucher, message: 'Usage count reset successfully' });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  });

  return router;
};

module.exports = createVoucherRouter;
