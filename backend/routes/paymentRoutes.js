/**
 * VNPAY Payment Gateway Integration (Sandbox Mode)
 * Tích hợp cổng thanh toán VNPAY cho Lab Billiard
 */
const express = require('express');
const crypto = require('crypto');

const createPaymentRouter = ({
  requireAuth,
  Order,
  Inventory,
  ADMIN_LINE_MODELS,
  buildLineItemLookup,
  resolveOrderItemProduct,
  syncInventoryFromVariants,
  calculateShippingFee,
  applyVoucher,
  VOUCHER_CODES,
  SELLER_BANK_INFO
}) => {
  const router = express.Router();

  // VNPAY Sandbox Config
  const VNPAY_CONFIG = {
    tmnCode: process.env.VNPAY_TMN_CODE || 'LABTEST1',
    hashSecret: process.env.VNPAY_HASH_SECRET || 'VNPAYSANDBOX2024LABTEST',
    vnpUrl: process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
    returnUrl: process.env.VNPAY_RETURN_URL || 'http://localhost:5173/payment/vnpay-return',
    apiUrl: process.env.VNPAY_API_URL || 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction'
  };

  // Helper: Sort object keys and build query string
  const sortObject = (obj) => {
    const sorted = {};
    const keys = Object.keys(obj).sort();
    keys.forEach((key) => {
      sorted[key] = encodeURIComponent(obj[key]).replace(/%20/g, '+');
    });
    return sorted;
  };

  // Helper: Create HMAC SHA512 hash
  const createHmacSha512 = (secret, data) => {
    return crypto.createHmac('sha512', secret).update(Buffer.from(data, 'utf-8')).digest('hex');
  };

  // ─── CREATE VNPAY PAYMENT URL ───
  router.post('/vnpay/create', requireAuth, async (req, res) => {
    try {
      const rawItems = Array.isArray(req.body?.items) ? req.body.items : [];
      const shippingAddress = {
        fullName: String(req.body?.shippingAddress?.fullName || '').trim(),
        phone: String(req.body?.shippingAddress?.phone || '').trim(),
        addressLine1: String(req.body?.shippingAddress?.addressLine1 || '').trim(),
        ward: String(req.body?.shippingAddress?.ward || '').trim(),
        district: String(req.body?.shippingAddress?.district || '').trim(),
        city: String(req.body?.shippingAddress?.city || '').trim(),
        province: String(req.body?.shippingAddress?.province || '').trim(),
        country: String(req.body?.shippingAddress?.country || 'Vietnam').trim(),
        postalCode: String(req.body?.shippingAddress?.postalCode || '700000').trim()
      };

      if (rawItems.length === 0) {
        return res.status(400).json({ message: 'Order items are required' });
      }

      const requiredFields = ['fullName', 'phone', 'addressLine1', 'city'];
      for (const field of requiredFields) {
        if (!shippingAddress[field]) {
          return res.status(400).json({ message: `Shipping field "${field}" is required` });
        }
      }

      // Resolve items and check inventory
      await syncInventoryFromVariants();
      const lookup = await buildLineItemLookup();
      const resolvedItems = [];
      const requiredByProductId = new Map();

      for (const item of rawItems) {
        const parsedItem = {
          itemId: String(item?.id || item?.itemId || '').trim(),
          name: String(item?.name || '').trim(),
          seriesTitle: String(item?.seriesTitle || '').trim(),
          image: String(item?.image || '').trim(),
          price: Number(item?.price || 0),
          quantity: Number(item?.quantity || 0)
        };

        const resolved = resolveOrderItemProduct(parsedItem, lookup);
        if (!resolved) {
          return res.status(400).json({ message: `Cannot resolve inventory item: ${parsedItem.name}` });
        }

        const productIdKey = String(resolved.productId);
        requiredByProductId.set(
          productIdKey,
          Number(requiredByProductId.get(productIdKey) || 0) + Number(parsedItem.quantity || 0)
        );

        resolvedItems.push({
          ...parsedItem,
          productId: resolved.productId,
          lineType: resolved.lineType,
          lineName: resolved.lineName
        });
      }

      // Check stock availability
      const inventoryDocs = await Inventory.find({
        productId: { $in: Array.from(requiredByProductId.keys()) }
      }).sort({ quantity: -1, createdAt: 1 });

      const inventoryByProductId = new Map();
      inventoryDocs.forEach((doc) => {
        const key = String(doc.productId);
        if (!inventoryByProductId.has(key)) {
          inventoryByProductId.set(key, []);
        }
        inventoryByProductId.get(key).push(doc);
      });

      for (const [productIdKey, requiredQty] of requiredByProductId.entries()) {
        const docs = inventoryByProductId.get(productIdKey) || [];
        const totalAvailable = docs.reduce(
          (sum, doc) => sum + Math.max(0, Number(doc.quantity || 0) - Number(doc.reserved || 0)),
          0
        );
        if (totalAvailable < requiredQty) {
          const fallbackName =
            resolvedItems.find((item) => String(item.productId) === productIdKey)?.name || productIdKey;
          return res.status(400).json({
            message: `Không đủ tồn kho cho ${fallbackName}. Còn: ${totalAvailable}, cần: ${requiredQty}`
          });
        }
      }

      // Calculate amounts
      const subtotal = resolvedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      let shippingFee = calculateShippingFee(shippingAddress.city || shippingAddress.province);
      let discount = 0;
      const voucherCode = String(req.body?.voucherCode || '').trim();

      if (voucherCode) {
        const voucherResult = applyVoucher(voucherCode, subtotal, shippingFee);
        if (!voucherResult.error) {
          discount = voucherResult.discount;
          shippingFee = voucherResult.shippingFee;
        }
      }

      const total = Math.max(0, subtotal + shippingFee - discount);

      // Reserve stock
      const stockDeductions = [];
      for (const [productIdKey, requiredQty] of requiredByProductId.entries()) {
        const docs = inventoryByProductId.get(productIdKey) || [];
        let remaining = requiredQty;
        for (const doc of docs) {
          if (remaining <= 0) break;
          const available = Math.max(0, Number(doc.quantity || 0) - Number(doc.reserved || 0));
          if (available <= 0) continue;
          const deductQty = Math.min(available, remaining);
          stockDeductions.push({ inventoryId: doc._id, quantity: deductQty });
          remaining -= deductQty;
        }
      }

      if (stockDeductions.length > 0) {
        await Inventory.bulkWrite(
          stockDeductions.map((entry) => ({
            updateOne: {
              filter: { _id: entry.inventoryId },
              update: { $inc: { reserved: entry.quantity } }
            }
          })),
          { ordered: true }
        );
      }

      // Create order with status 'pending'
      const order = await Order.create({
        user: req.authUser._id,
        items: resolvedItems,
        subtotal,
        shippingFee,
        discount,
        voucherCode,
        total,
        shippingAddress,
        payment: {
          method: 'vnpay',
          bankName: '',
          accountNumber: '',
          accountHolder: '',
          reference: ''
        },
        currencySymbol: req.body?.currencySymbol || '$',
        status: 'pending',
        statusHistory: [{ status: 'pending', updatedAt: new Date(), note: 'Đơn hàng đã được tạo - Chờ thanh toán VNPAY' }]
      });

      // Build VNPAY payment URL
      const date = new Date();
      const createDate = date.toISOString().replace(/[-:T]/g, '').slice(0, 14);
      const orderId = String(order._id).slice(-8) + createDate.slice(-6);

      // Amount in VND (multiply by 100 for VNPAY)
      // If using USD, convert to VND (approximate rate for sandbox)
      const amountInVND = Math.round(total * 25000); // Approximate USD to VND
      const vnpAmount = amountInVND * 100;

      let vnpParams = {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: VNPAY_CONFIG.tmnCode,
        vnp_Locale: 'vn',
        vnp_CurrCode: 'VND',
        vnp_TxnRef: orderId,
        vnp_OrderInfo: `Thanh toan don hang Lab Billiard #${String(order._id).slice(-8).toUpperCase()}`,
        vnp_OrderType: 'billpayment',
        vnp_Amount: vnpAmount,
        vnp_ReturnUrl: VNPAY_CONFIG.returnUrl,
        vnp_IpAddr: req.headers['x-forwarded-for'] || req.connection?.remoteAddress || '127.0.0.1',
        vnp_CreateDate: createDate
      };

      // Store orderId mapping for return callback
      order.payment.reference = orderId;
      await order.save();

      vnpParams = sortObject(vnpParams);
      const signData = Object.keys(vnpParams)
        .map((key) => `${key}=${vnpParams[key]}`)
        .join('&');
      const hmac = createHmacSha512(VNPAY_CONFIG.hashSecret, signData);

      vnpParams['vnp_SecureHash'] = hmac;

      const paymentUrl =
        VNPAY_CONFIG.vnpUrl +
        '?' +
        Object.keys(vnpParams)
          .map((key) => `${key}=${vnpParams[key]}`)
          .join('&');

      return res.json({
        paymentUrl,
        orderId: order._id,
        vnpTxnRef: orderId,
        amount: total,
        amountVND: amountInVND
      });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  });

  // ─── VNPAY RETURN CALLBACK ───
  router.get('/vnpay/return', async (req, res) => {
    try {
      let vnpParams = { ...req.query };
      const secureHash = vnpParams['vnp_SecureHash'];

      delete vnpParams['vnp_SecureHash'];
      delete vnpParams['vnp_SecureHashType'];

      vnpParams = sortObject(vnpParams);
      const signData = Object.keys(vnpParams)
        .map((key) => `${key}=${vnpParams[key]}`)
        .join('&');
      const checkSum = createHmacSha512(VNPAY_CONFIG.hashSecret, signData);

      const vnpTxnRef = req.query['vnp_TxnRef'];
      const responseCode = req.query['vnp_ResponseCode'];

      // Find order by VNPAY reference
      const order = await Order.findOne({ 'payment.reference': vnpTxnRef });

      if (!order) {
        return res.json({
          success: false,
          message: 'Không tìm thấy đơn hàng',
          code: 'ORDER_NOT_FOUND'
        });
      }

      if (secureHash === checkSum) {
        if (responseCode === '00') {
          // Payment successful
          order.status = 'paid';
          order.payment.method = 'vnpay';
          order.statusHistory.push({
            status: 'paid',
            updatedAt: new Date(),
            note: `Thanh toán VNPAY thành công. Mã GD: ${vnpTxnRef}`
          });
          await order.save();

          return res.json({
            success: true,
            message: 'Thanh toán thành công',
            orderId: order._id,
            code: '00'
          });
        } else {
          // Payment failed - release reserved stock
          const itemProductIds = order.items
            .map((item) => item.productId)
            .filter(Boolean);

          if (itemProductIds.length > 0) {
            for (const item of order.items) {
              const inventoryDocs = await Inventory.find({ productId: item.productId });
              let remaining = item.quantity;
              for (const invDoc of inventoryDocs) {
                if (remaining <= 0) break;
                const releaseQty = Math.min(invDoc.reserved, remaining);
                if (releaseQty > 0) {
                  await Inventory.findByIdAndUpdate(invDoc._id, {
                    $inc: { reserved: -releaseQty }
                  });
                  remaining -= releaseQty;
                }
              }
            }
          }

          order.status = 'cancelled';
          order.statusHistory.push({
            status: 'cancelled',
            updatedAt: new Date(),
            note: `Thanh toán VNPAY thất bại. Mã lỗi: ${responseCode}`
          });
          await order.save();

          return res.json({
            success: false,
            message: 'Thanh toán thất bại',
            orderId: order._id,
            code: responseCode
          });
        }
      } else {
        return res.json({
          success: false,
          message: 'Chữ ký không hợp lệ',
          code: 'INVALID_SIGNATURE'
        });
      }
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  });

  // ─── VNPAY IPN (Instant Payment Notification) ───
  router.get('/vnpay/ipn', async (req, res) => {
    try {
      let vnpParams = { ...req.query };
      const secureHash = vnpParams['vnp_SecureHash'];

      delete vnpParams['vnp_SecureHash'];
      delete vnpParams['vnp_SecureHashType'];

      vnpParams = sortObject(vnpParams);
      const signData = Object.keys(vnpParams)
        .map((key) => `${key}=${vnpParams[key]}`)
        .join('&');
      const checkSum = createHmacSha512(VNPAY_CONFIG.hashSecret, signData);

      if (secureHash !== checkSum) {
        return res.json({ RspCode: '97', Message: 'Invalid Checksum' });
      }

      const vnpTxnRef = req.query['vnp_TxnRef'];
      const responseCode = req.query['vnp_ResponseCode'];
      const order = await Order.findOne({ 'payment.reference': vnpTxnRef });

      if (!order) {
        return res.json({ RspCode: '01', Message: 'Order Not Found' });
      }

      if (order.status === 'paid') {
        return res.json({ RspCode: '02', Message: 'Order already confirmed' });
      }

      if (responseCode === '00') {
        order.status = 'paid';
        order.statusHistory.push({
          status: 'paid',
          updatedAt: new Date(),
          note: `IPN: Thanh toán VNPAY thành công. Mã GD: ${vnpTxnRef}`
        });
        await order.save();
        return res.json({ RspCode: '00', Message: 'Confirm Success' });
      }

      return res.json({ RspCode: '00', Message: 'Confirm Success' });
    } catch (err) {
      return res.json({ RspCode: '99', Message: 'Unknown error' });
    }
  });

  // ─── CHECK PAYMENT STATUS ───
  router.get('/status/:orderId', requireAuth, async (req, res) => {
    try {
      const order = await Order.findOne({
        _id: req.params.orderId,
        user: req.authUser._id
      }).select('status payment total subtotal shippingFee discount');

      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      return res.json({
        orderId: order._id,
        status: order.status,
        paymentMethod: order.payment?.method,
        total: order.total,
        isPaid: order.status === 'paid' || order.status === 'packing' || order.status === 'shipped' || order.status === 'delivered'
      });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  });

  return router;
};

module.exports = createPaymentRouter;
