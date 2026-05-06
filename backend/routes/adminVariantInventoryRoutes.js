const express = require('express');

const createAdminVariantInventoryRouter = ({
  requireAuth,
  requireAdmin,
  ProductVariant,
  Inventory,
  ADMIN_LINE_MODELS,
  normalizeLineType,
  findLineItemById,
  syncInventoryFromVariants,
  buildDefaultVariantSku
}) => {
  const router = express.Router();

  // ProductVariant APIs
  router.get('/products/:productId/variants', requireAuth, requireAdmin, async (req, res) => {
    try {
      const variants = await ProductVariant.find({
        productId: req.params.productId,
        ...(req.query?.lineType ? { lineType: normalizeLineType(req.query.lineType) } : {})
      }).sort({ createdAt: -1 });
      return res.json({ variants });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  });

  router.post('/products/:productId/variants', requireAuth, requireAdmin, async (req, res) => {
    try {
      const lineItem = await findLineItemById(req.params.productId, req.body?.lineType);
      if (!lineItem) {
        return res.status(404).json({ message: 'Line item not found' });
      }

      const payload = {
        productId: req.params.productId,
        lineType: lineItem.lineType,
        lineName: lineItem.lineName,
        sku: String(req.body?.sku || '').trim(),
        shaft: String(req.body?.shaft || '').trim(),
        joint: String(req.body?.joint || req.body?.collar || '').trim(),
        weight: String(req.body?.weight || '').trim(),
        wrap: String(req.body?.wrap || '').trim(),
        priceAdjustment: Number(req.body?.priceAdjustment || 0)
      };

      if (!payload.sku || !payload.shaft || !payload.joint || !payload.weight || !payload.wrap) {
        return res.status(400).json({ message: 'SKU, shaft, joint, weight and wrap are required' });
      }

      const existingSku = await ProductVariant.findOne({ sku: payload.sku });
      if (existingSku) {
        return res.status(409).json({ message: 'SKU already exists' });
      }

      const variant = await ProductVariant.create(payload);
      await Inventory.create({
        variantId: variant._id,
        productId: req.params.productId,
        lineType: lineItem.lineType,
        lineName: lineItem.lineName,
        quantity: Number(req.body?.quantity || 0),
        reorderLevel: Number(req.body?.reorderLevel || 5)
      });

      return res.status(201).json({ variant });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  });

  router.put('/variants/:variantId', requireAuth, requireAdmin, async (req, res) => {
    try {
      const updates = {};
      const allowedFields = ['sku', 'shaft', 'joint', 'weight', 'wrap', 'priceAdjustment', 'status'];

      allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });

      if (updates.sku) {
        const existingSku = await ProductVariant.findOne({ sku: updates.sku, _id: { $ne: req.params.variantId } });
        if (existingSku) {
          return res.status(409).json({ message: 'SKU already exists' });
        }
      }

      if (updates.joint === undefined && req.body?.collar !== undefined) {
        updates.joint = String(req.body.collar || '').trim();
      }

      const variant = await ProductVariant.findByIdAndUpdate(req.params.variantId, updates, { new: true, runValidators: true });
      if (!variant) {
        return res.status(404).json({ message: 'Variant not found' });
      }

      return res.json({ variant });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  });

  router.delete('/variants/:variantId', requireAuth, requireAdmin, async (req, res) => {
    try {
      const variant = await ProductVariant.findByIdAndDelete(req.params.variantId);
      if (!variant) {
        return res.status(404).json({ message: 'Variant not found' });
      }

      await Inventory.deleteOne({ variantId: req.params.variantId });
      return res.json({ message: 'Variant deleted' });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  });

  // Inventory APIs
  router.get('/inventory', requireAuth, requireAdmin, async (req, res) => {
    try {
      await syncInventoryFromVariants();
      const inventory = await Inventory.find({})
        .populate('variantId', 'sku shaft joint weight wrap')
        .sort({ quantity: 1 });
      return res.json({ inventory });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  });

  router.get('/inventory/warnings', requireAuth, requireAdmin, async (req, res) => {
    try {
      const threshold = Number(req.query?.threshold || 2);
      await syncInventoryFromVariants();

      const lowStockItems = await Inventory.find({
        $expr: {
          $lt: [{ $subtract: ['$quantity', '$reserved'] }, threshold]
        }
      })
        .populate('variantId', 'sku shaft joint weight wrap priceAdjustment')
        .sort({ quantity: 1 });
      return res.json({ warnings: lowStockItems, threshold });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  });

  router.put('/inventory/:variantId', requireAuth, requireAdmin, async (req, res) => {
    try {
      const updates = {};
      if (typeof req.body?.quantity !== 'undefined') {
        updates.quantity = Math.max(0, Number(req.body.quantity || 0));
      }
      if (typeof req.body?.reorderLevel !== 'undefined') {
        updates.reorderLevel = Number(req.body.reorderLevel || 5);
      }
      if (typeof req.body?.location !== 'undefined') {
        updates.location = String(req.body.location || '').trim();
      }

      const filter = req.body?.inventoryId
        ? { _id: req.body.inventoryId }
        : { variantId: req.params.variantId };

      const inventory = await Inventory.findOneAndUpdate(
        filter,
        updates,
        { new: true }
      ).populate('variantId', 'sku shaft joint weight wrap');

      if (!inventory) {
        return res.status(404).json({ message: 'Inventory not found' });
      }

      return res.json({ inventory });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  });

  router.post('/inventory/bootstrap', requireAuth, requireAdmin, async (req, res) => {
    try {
      const defaultQuantity = Math.max(0, Number(req.body?.defaultQuantity || 0));
      const defaultReorderLevel = Math.max(0, Number(req.body?.defaultReorderLevel || 5));

      const lineTypes = Object.keys(ADMIN_LINE_MODELS);
      const lineCollections = await Promise.all(
        lineTypes.map(async (lineType) => {
          const { model } = ADMIN_LINE_MODELS[lineType];
          const items = await model.find({}, '_id name').lean();
          return items.map((item) => ({
            productId: item._id,
            lineType,
            lineName: item.name
          }));
        })
      );

      const allLineItems = lineCollections.flat();
      const existingVariants = await ProductVariant.find({}, 'productId sku').lean();
      const existingByProduct = new Map(existingVariants.map((item) => [String(item.productId), item]));
      const existingSkuSet = new Set(existingVariants.map((item) => String(item.sku || '').toUpperCase()));

      let createdVariants = 0;
      const createdVariantIds = [];

      for (const lineItem of allLineItems) {
        if (existingByProduct.has(String(lineItem.productId))) {
          continue;
        }

        const baseSku = buildDefaultVariantSku(lineItem.lineType, lineItem.lineName, lineItem.productId);
        let sku = baseSku;
        let suffix = 1;
        while (existingSkuSet.has(sku.toUpperCase())) {
          sku = `${baseSku}-${suffix}`;
          suffix += 1;
        }

        const variant = await ProductVariant.create({
          productId: lineItem.productId,
          lineType: lineItem.lineType,
          lineName: lineItem.lineName,
          sku,
          shaft: 'Standard',
          joint: 'Standard',
          weight: '19 oz',
          wrap: 'Standard',
          priceAdjustment: 0,
          status: 'active'
        });

        createdVariants += 1;
        createdVariantIds.push(variant._id);
        existingSkuSet.add(sku.toUpperCase());
      }

      await syncInventoryFromVariants();

      if (createdVariantIds.length > 0) {
        await Inventory.updateMany(
          { variantId: { $in: createdVariantIds } },
          {
            $set: {
              quantity: defaultQuantity,
              reorderLevel: defaultReorderLevel
            }
          }
        );
      }

      const inventoryCount = await Inventory.countDocuments();
      const variantCount = await ProductVariant.countDocuments();

      return res.status(201).json({
        message: 'Inventory bootstrap completed',
        createdVariants,
        variantCount,
        inventoryCount
      });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  });

  return router;
};

module.exports = createAdminVariantInventoryRouter;
