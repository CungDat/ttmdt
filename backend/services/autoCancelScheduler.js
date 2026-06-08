const cron = require('node-cron');
const { sendOrderCancellation } = require('./emailService');

// Expiry time for each payment method
const EXPIRY_CONFIG = {
  vnpay: 15 * 60 * 1000,        // 15 minutes
  'bank-transfer': 24 * 60 * 60 * 1000, // 24 hours
  cod: 48 * 60 * 60 * 1000      // COD: 48h (admin manual confirmation required)
};

/**
 * Start Cronjob to automatically cancel expired pending orders
 * Runs every 5 minutes
 */
const startAutoCancelScheduler = (Order, Inventory) => {
  console.log('[AutoCancel] Scheduler started — runs every 5 minutes');

  // Runs at startup + every 5 minutes
  const runJob = async () => {
    try {
      const now = new Date();

      // Find all pending orders not yet cancelled
      const pendingOrders = await Order.find({ status: 'pending' })
        .populate('user', 'name email')
        .lean();

      if (pendingOrders.length === 0) return;

      const toCancel = [];

      for (const order of pendingOrders) {
        const method = order.payment?.method || 'cod';
        const expiryMs = EXPIRY_CONFIG[method] || EXPIRY_CONFIG.cod;
        const createdAt = new Date(order.createdAt);
        const expiresAt = new Date(createdAt.getTime() + expiryMs);

        if (now > expiresAt) {
          toCancel.push(order);
        }
      }

      if (toCancel.length === 0) return;

      console.log(`[AutoCancel] Found ${toCancel.length} expired pending orders to cancel`);

      for (const order of toCancel) {
        try {
          // 1. Release reserved inventory
          for (const item of order.items || []) {
            if (!item.productId) continue;
            const inventoryDocs = await Inventory.find({ productId: item.productId });
            let remaining = item.quantity;

            for (const invDoc of inventoryDocs) {
              if (remaining <= 0) break;
              const releaseQty = Math.min(Number(invDoc.reserved || 0), remaining);
              if (releaseQty > 0) {
                await Inventory.findByIdAndUpdate(invDoc._id, {
                  $inc: { reserved: -releaseQty }
                });
                remaining -= releaseQty;
              }
            }
          }

          // 2. Update order status
          const paymentLabel = {
            vnpay: 'VNPAY (over 15 minutes)',
            'bank-transfer': 'Bank Transfer (over 24 hours)',
            cod: 'COD (over 48 hours)'
          }[order.payment?.method] || 'expired';

          await Order.findByIdAndUpdate(order._id, {
            status: 'cancelled',
            $push: {
              statusHistory: {
                status: 'cancelled',
                updatedAt: new Date(),
                note: `Auto-cancel: No payment received via ${paymentLabel}`
              }
            }
          });

          // 3. Send cancellation email (if email exists)
          const customerEmail = order.user?.email;
          if (customerEmail) {
            await sendOrderCancellation(
              order,
              customerEmail,
              `No payment received via ${paymentLabel}. Inventory has been released.`
            ).catch((e) => console.error('[AutoCancel] Email error:', e.message));
          }

          console.log(`[AutoCancel] ✅ Cancelled order ${String(order._id).slice(-8).toUpperCase()} (${order.payment?.method}, created ${new Date(order.createdAt).toISOString()})`);
        } catch (orderErr) {
          console.error(`[AutoCancel] ❌ Error cancelling order ${order._id}:`, orderErr.message);
        }
      }
    } catch (err) {
      console.error('[AutoCancel] Scheduler error:', err.message);
    }
  };

  // Chạy ngay khi server khởi động
  runJob();

  // Lịch: mỗi 5 phút
  cron.schedule('*/5 * * * *', runJob);

  return runJob; // Trả về để có thể test thủ công
};

module.exports = { startAutoCancelScheduler };
