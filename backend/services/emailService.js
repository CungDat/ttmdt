const nodemailer = require('nodemailer');

// Cấu hình transporter từ .env
const createTransporter = () => {
  // If using Gmail
  if (process.env.EMAIL_SERVICE === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS // App Password (2FA Gmail)
      }
    });
  }
  // If using custom SMTP (Resend, SendGrid SMTP, etc.)
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.resend.com',
    port: Number(process.env.EMAIL_PORT) || 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER || 'resend',
      pass: process.env.EMAIL_PASS
    }
  });
};

const formatCurrency = (value) =>
  `$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// ─── EMAIL TEMPLATES ───────────────────────────────────────────────

const baseLayout = (title, content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background: #f5f5f5; font-family: 'Helvetica Neue', Arial, sans-serif; }
    .wrapper { max-width: 600px; margin: 32px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: #111111; padding: 28px 32px; text-align: center; }
    .header h1 { margin: 0; color: #ffffff; font-size: 22px; letter-spacing: 1px; }
    .header p { margin: 4px 0 0; color: rgba(255,255,255,0.6); font-size: 13px; }
    .body { padding: 32px; }
    .greeting { font-size: 16px; color: #333; margin-bottom: 20px; }
    .order-box { border: 1px solid #e5e5e5; border-radius: 8px; overflow: hidden; margin: 20px 0; }
    .order-header { background: #f9f9f9; padding: 12px 16px; display: flex; justify-content: space-between; border-bottom: 1px solid #e5e5e5; }
    .order-header span { font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
    .order-header strong { font-size: 14px; color: #111; }
    .item-row { display: flex; align-items: center; padding: 12px 16px; border-bottom: 1px solid #f0f0f0; gap: 12px; }
    .item-img { width: 52px; height: 52px; border-radius: 8px; object-fit: cover; flex-shrink: 0; border: 1px solid #eee; }
    .item-info { flex: 1; }
    .item-info strong { display: block; font-size: 14px; color: #111; }
    .item-info span { font-size: 12px; color: #888; }
    .item-price { font-size: 14px; font-weight: 700; color: #111; white-space: nowrap; }
    .totals { padding: 12px 16px; }
    .total-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; color: #555; }
    .total-row.grand { border-top: 1px solid #e5e5e5; margin-top: 8px; padding-top: 10px; font-size: 15px; font-weight: 700; color: #111; }
    .status-badge { display: inline-block; padding: 6px 14px; border-radius: 999px; font-size: 12px; font-weight: 700; }
    .address-box { background: #f9f9f9; border-radius: 8px; padding: 16px; margin: 16px 0; font-size: 14px; color: #333; line-height: 1.7; }
    .cta-btn { display: block; width: fit-content; margin: 24px auto 0; background: #111; color: #fff; text-decoration: none; padding: 13px 28px; border-radius: 8px; font-weight: 700; font-size: 14px; text-align: center; }
    .divider { height: 1px; background: #f0f0f0; margin: 24px 0; }
    .footer { background: #f9f9f9; padding: 20px 32px; text-align: center; border-top: 1px solid #eee; }
    .footer p { margin: 0; font-size: 12px; color: #aaa; line-height: 1.6; }
    .footer a { color: #666; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>LAB BILLIARD</h1>
      <p>Premium Pool Cue Store</p>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p>Thank you for choosing Lab Billiard!<br/>
      <a href="http://localhost:5173">Visit Store</a> | Support: <a href="mailto:${process.env.EMAIL_USER || 'support@labbilliard.vn'}">support@labbilliard.vn</a></p>
      <p style="margin-top:8px;color:#ccc;font-size:11px;">This is an automated email, please do not reply directly.</p>
    </div>
  </div>
</body>
</html>
`;

// Template: Xác nhận đặt hàng
const orderConfirmationTemplate = (order) => {
  const itemsHtml = (order.items || []).map((item) => `
    <div class="item-row">
      <img class="item-img" src="${item.image || 'https://placehold.co/52x52?text=Cue'}" alt="${item.name}" />
      <div class="item-info">
        <strong>${item.name}</strong>
        <span>x${item.quantity}</span>
      </div>
      <span class="item-price">${formatCurrency(item.price * item.quantity)}</span>
    </div>
  `).join('');

  const content = `
    <p class="greeting">Hi <strong>${order.shippingAddress?.fullName || 'Customer'}</strong>,</p>
    <p style="color:#555;font-size:14px;">We have received your order and it's being processed. Thank you for shopping with Lab Billiard!</p>

    <div class="order-box">
      <div class="order-header">
        <div><span>Order ID</span><br/><strong>#${String(order._id).slice(-8).toUpperCase()}</strong></div>
        <div style="text-align:right"><span>Status</span><br/>
          <span class="status-badge" style="background:#fef3c7;color:#92400e;">Awaiting confirmation</span>
        </div>
      </div>
      ${itemsHtml}
      <div class="totals">
        <div class="total-row"><span>Subtotal</span><span>${formatCurrency(order.subtotal)}</span></div>
        ${order.shippingFee ? `<div class="total-row"><span>Shipping Fee</span><span>${formatCurrency(order.shippingFee)}</span></div>` : ''}
        ${order.discount ? `<div class="total-row" style="color:#16a34a"><span>Discount ${order.voucherCode ? `(${order.voucherCode})` : ''}</span><span>-${formatCurrency(order.discount)}</span></div>` : ''}
        <div class="total-row grand"><span>Total</span><span>${formatCurrency(order.total)}</span></div>
      </div>
    </div>

    <p style="font-size:14px;font-weight:700;color:#111;">Shipping Address</p>
    <div class="address-box">
      <strong>${order.shippingAddress?.fullName}</strong><br/>
      ${order.shippingAddress?.phone}<br/>
      ${[order.shippingAddress?.addressLine1, order.shippingAddress?.ward, order.shippingAddress?.district, order.shippingAddress?.city].filter(Boolean).join(', ')}
    </div>

    <div class="divider"></div>
    <p style="font-size:13px;color:#888;">Payment Method: <strong>${
      { cod: 'Cash on Delivery (COD)', 'bank-transfer': 'Bank Transfer', vnpay: 'VNPAY' }[order.payment?.method] || order.payment?.method
    }</strong></p>
    <a class="cta-btn" href="http://localhost:5173">Continue Shopping →</a>
  `;
  return baseLayout('Order Confirmation - Lab Billiard', content);
};

// Template: Payment confirmed
const paymentConfirmedTemplate = (order) => {
  const content = `
    <p class="greeting">Hi <strong>${order.shippingAddress?.fullName || 'Customer'}</strong>,</p>
    <p style="color:#555;font-size:14px;">✅ Your payment has been confirmed! Your order will be packed and shipped to you as soon as possible.</p>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:20px 0;text-align:center;">
      <p style="margin:0;font-size:13px;color:#166534;">Order ID</p>
      <p style="margin:4px 0 0;font-size:22px;font-weight:700;color:#111;">#${String(order._id).slice(-8).toUpperCase()}</p>
      <span class="status-badge" style="background:#dcfce7;color:#166534;margin-top:8px;">Paid</span>
    </div>
    <p style="font-size:13px;color:#888;text-align:center;">Total Amount Paid: <strong style="font-size:16px;color:#111;">${formatCurrency(order.total)}</strong></p>
    <a class="cta-btn" href="http://localhost:5173">Back to Homepage →</a>
  `;
  return baseLayout('Payment Confirmation - Lab Billiard', content);
};

// Template: Shipping in progress
const shippingTemplate = (order) => {
  const trackingNumber = order.tracking?.number || '';
  const carrier = order.tracking?.carrier || '';
  const content = `
    <p class="greeting">Hi <strong>${order.shippingAddress?.fullName || 'Customer'}</strong>,</p>
    <p style="color:#555;font-size:14px;">🚚 Your order has been handed over to the carrier and is on its way to you!</p>
    
    ${trackingNumber ? `
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px;margin:20px 0;">
      <p style="margin:0;font-size:12px;color:#1e40af;text-transform:uppercase;letter-spacing:0.5px;">Tracking Number</p>
      <p style="margin:6px 0 0;font-size:20px;font-weight:700;color:#111;font-family:monospace;">${trackingNumber}</p>
      ${carrier ? `<p style="margin:4px 0 0;font-size:13px;color:#555;">Carrier: <strong>${carrier}</strong></p>` : ''}
    </div>
    ` : ''}

    <div class="address-box">
      <strong>Shipping to:</strong><br/>
      ${order.shippingAddress?.fullName} — ${order.shippingAddress?.phone}<br/>
      ${[order.shippingAddress?.addressLine1, order.shippingAddress?.district, order.shippingAddress?.city].filter(Boolean).join(', ')}
    </div>
    <a class="cta-btn" href="http://localhost:5173">Track Order →</a>
  `;
  return baseLayout('Order Shipping in Progress - Lab Billiard', content);
};

// Template: Order cancelled
const orderCancelledTemplate = (order, reason = '') => {
  const content = `
    <p class="greeting">Hi <strong>${order.shippingAddress?.fullName || 'Customer'}</strong>,</p>
    <p style="color:#555;font-size:14px;">Your order <strong>#${String(order._id).slice(-8).toUpperCase()}</strong> has been cancelled.</p>
    ${reason ? `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:14px;margin:16px 0;font-size:13px;color:#991b1b;">Reason: ${reason}</div>` : ''}
    <p style="font-size:13px;color:#555;">If you have already paid, the amount will be refunded within 3–5 business days.</p>
    <p style="font-size:13px;color:#555;">If you need support, please contact us via email or hotline.</p>
    <a class="cta-btn" href="http://localhost:5173">Continue Shopping →</a>
  `;
  return baseLayout('Order Cancelled - Lab Billiard', content);
};

// ─── SEND FUNCTIONS ────────────────────────────────────────────────

const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(`[Email] Skipped (EMAIL_USER/PASS not configured): ${subject} → ${to}`);
    return { skipped: true };
  }
  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: `"Lab Billiard" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });
    console.log(`[Email] Sent: ${subject} → ${to} (${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[Email] Error sending "${subject}" to ${to}:`, err.message);
    return { success: false, error: err.message };
  }
};

// Send order confirmation email
const sendOrderConfirmation = (order, customerEmail) =>
  sendEmail({
    to: customerEmail,
    subject: `✅ Order Confirmation #${String(order._id).slice(-8).toUpperCase()} - Lab Billiard`,
    html: orderConfirmationTemplate(order)
  });

// Send payment confirmation email
const sendPaymentConfirmation = (order, customerEmail) =>
  sendEmail({
    to: customerEmail,
    subject: `💳 Payment Successful - Order #${String(order._id).slice(-8).toUpperCase()}`,
    html: paymentConfirmedTemplate(order)
  });

// Send shipping notification email
const sendShippingNotification = (order, customerEmail) =>
  sendEmail({
    to: customerEmail,
    subject: `🚚 Your order is on its way - #${String(order._id).slice(-8).toUpperCase()}`,
    html: shippingTemplate(order)
  });

// Send order cancellation email
const sendOrderCancellation = (order, customerEmail, reason = '') =>
  sendEmail({
    to: customerEmail,
    subject: `❌ Order #${String(order._id).slice(-8).toUpperCase()} has been cancelled`,
    html: orderCancelledTemplate(order, reason)
  });

module.exports = {
  sendOrderConfirmation,
  sendPaymentConfirmation,
  sendShippingNotification,
  sendOrderCancellation,
  sendEmail
};
