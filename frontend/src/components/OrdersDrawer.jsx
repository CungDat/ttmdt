import React, { useCallback, useEffect, useState } from 'react';
import { Box, Check, CheckCircle2, ClipboardList, Clock, Package, ShieldCheck, Truck, X, XCircle } from 'lucide-react';
import axios from 'axios';

const ORDER_STATUS_STEPS = [
  { key: 'pending', label: 'Đã đặt hàng', icon: ClipboardList, color: '#f59e0b' },
  { key: 'paid', label: 'Đã thanh toán', icon: ShieldCheck, color: '#3b82f6' },
  { key: 'packing', label: 'Đang đóng gói', icon: Box, color: '#8b5cf6' },
  { key: 'shipped', label: 'Đang giao hàng', icon: Truck, color: '#06b6d4' },
  { key: 'delivered', label: 'Giao thành công', icon: CheckCircle2, color: '#10b981' }
];

const STATUS_LABELS = {
  pending: 'Đã đặt hàng',
  paid: 'Đã thanh toán',
  processing: 'Đang xử lý',
  packing: 'Đang đóng gói',
  shipped: 'Đang giao hàng',
  'in-transit': 'Đang vận chuyển',
  delivered: 'Giao thành công',
  cancelled: 'Đã hủy',
  returned: 'Đã trả hàng'
};

function OrderTimeline({ order, authToken }) {
  const [statusHistory, setStatusHistory] = useState(order.statusHistory || []);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!order._id || !authToken) return;
    if (order.statusHistory && order.statusHistory.length > 0) {
      setStatusHistory(order.statusHistory);
      setLoaded(true);
      return;
    }
    axios.get(`http://localhost:5000/api/orders/${order._id}/history`, {
      headers: { Authorization: `Bearer ${authToken}` }
    })
      .then((res) => {
        setStatusHistory(res.data?.statusHistory || []);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [order._id, authToken]);

  const isCancelled = order.status === 'cancelled' || order.status === 'returned';
  const currentStatusIndex = ORDER_STATUS_STEPS.findIndex((s) => s.key === order.status);
  const completedStatuses = new Set((statusHistory || []).map((h) => h.status));

  return (
    <div className="order-timeline">
      {isCancelled ? (
        <div className="order-timeline-cancelled">
          <XCircle size={20} className="order-timeline-cancelled-icon" />
          <span>{STATUS_LABELS[order.status] || order.status}</span>
        </div>
      ) : (
        <div className="order-timeline-steps">
          {ORDER_STATUS_STEPS.map((step, index) => {
            const isCompleted = completedStatuses.has(step.key) || index <= currentStatusIndex;
            const isCurrent = step.key === order.status;
            const historyEntry = (statusHistory || []).find((h) => h.status === step.key);
            const StepIcon = step.icon;

            return (
              <div key={step.key} className={`order-timeline-step ${isCompleted ? 'order-timeline-step-done' : ''} ${isCurrent ? 'order-timeline-step-current' : ''}`}>
                <div className="order-timeline-connector">
                  {index > 0 ? (
                    <div className={`order-timeline-line ${isCompleted ? 'order-timeline-line-done' : ''}`} />
                  ) : null}
                  <div className={`order-timeline-dot ${isCompleted ? 'order-timeline-dot-done' : ''} ${isCurrent ? 'order-timeline-dot-current' : ''}`}
                    style={isCompleted ? { borderColor: step.color, background: step.color } : {}}>
                    {isCompleted ? <Check size={12} color="#fff" /> : <StepIcon size={12} />}
                  </div>
                  {index < ORDER_STATUS_STEPS.length - 1 ? (
                    <div className={`order-timeline-line ${(index < currentStatusIndex || completedStatuses.has(ORDER_STATUS_STEPS[index + 1]?.key)) ? 'order-timeline-line-done' : ''}`} />
                  ) : null}
                </div>
                <div className="order-timeline-info">
                  <p className={`order-timeline-label ${isCurrent ? 'order-timeline-label-current' : ''}`}>
                    {step.label}
                  </p>
                  {historyEntry?.updatedAt ? (
                    <p className="order-timeline-date">
                      {new Date(historyEntry.updatedAt).toLocaleString('vi-VN', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  ) : null}
                  {historyEntry?.note ? (
                    <p className="order-timeline-note">{historyEntry.note}</p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function OrdersDrawer({ isOpen, onClose, orders, isLoading, authToken }) {
  const [expandedOrder, setExpandedOrder] = useState(null);

  const toggleExpand = (orderId) => setExpandedOrder((prev) => (prev === orderId ? null : orderId));

  return (
    <>
      <div
        className={`cart-backdrop ${isOpen ? 'cart-backdrop-open' : 'cart-backdrop-closed'}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className={`orders-drawer ${isOpen ? 'orders-drawer-open' : 'orders-drawer-closed'}`} aria-label="Order history">
        <div className="orders-drawer-head">
          <h2 className="orders-drawer-title">Đơn hàng của tôi</h2>
          <button type="button" className="cart-icon-button" onClick={onClose} aria-label="Close orders">
            <X className="cart-icon" />
          </button>
        </div>

        {isLoading ? <p className="orders-loading">Đang tải đơn hàng...</p> : null}

        {!isLoading && orders.length === 0 ? (
          <div className="orders-empty">
            <ClipboardList className="orders-empty-icon" />
            <p className="orders-empty-title">Chưa có đơn hàng</p>
            <p className="orders-empty-text">Hoàn tất thanh toán để xem đơn hàng tại đây.</p>
          </div>
        ) : null}

        {!isLoading && orders.length > 0 ? (
          <ul className="orders-list" aria-label="Order history list">
            {orders.map((order) => {
              const isExpanded = expandedOrder === order._id;
              return (
                <li key={order._id} className="order-card">
                  <button type="button" className="order-card-head" onClick={() => toggleExpand(order._id)}>
                    <div>
                      <p className="order-id">Đơn #{String(order._id).slice(-8).toUpperCase()}</p>
                      <p className="order-date">{new Date(order.createdAt).toLocaleString('vi-VN')}</p>
                    </div>
                    <span className={`order-status order-status-${order.status || 'pending'}`}>
                      {STATUS_LABELS[order.status] || order.status || 'pending'}
                    </span>
                  </button>

                  {isExpanded ? (
                    <div className="order-card-expanded">
                      {/* Timeline */}
                      <OrderTimeline order={order} authToken={authToken} />

                      {order.shippingAddress ? (
                        <div className="order-shipping">
                          <p className="order-shipping-title">Giao đến</p>
                          <p className="order-shipping-name">{order.shippingAddress.fullName}</p>
                          <p className="order-shipping-text">{order.shippingAddress.phone}</p>
                          <p className="order-shipping-text">
                            {order.shippingAddress.addressLine1}
                            {order.shippingAddress.ward ? `, ${order.shippingAddress.ward}` : ''}
                            {order.shippingAddress.district ? `, ${order.shippingAddress.district}` : ''}
                            {order.shippingAddress.city ? `, ${order.shippingAddress.city}` : ''}
                          </p>
                        </div>
                      ) : null}

                      {order.payment ? (
                        <div className="order-payment">
                          <p className="order-shipping-title">Thanh toán</p>
                          {order.payment.method === 'cod' ? (
                            <p className="order-shipping-name">Thanh toán khi nhận hàng (COD)</p>
                          ) : (
                            <>
                              <p className="order-shipping-name">Chuyển khoản ngân hàng</p>
                              <p className="order-shipping-text">{order.payment.bankName} • {order.payment.accountNumber}</p>
                              <p className="order-shipping-text">{order.payment.accountHolder}</p>
                              {order.payment.reference ? <p className="order-shipping-text">Nội dung: {order.payment.reference}</p> : null}
                            </>
                          )}
                        </div>
                      ) : null}

                      <ul className="order-items">
                        {(order.items || []).map((item) => (
                          <li key={`${order._id}-${item.itemId}`} className="order-item-row">
                            <span className="order-item-name">{item.name}</span>
                            <span className="order-item-qty">x{item.quantity}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="order-total-block">
                        <div className="order-total-row">
                          <span>Tạm tính</span>
                          <span>{order.currencySymbol || '$'}{Number(order.subtotal || 0).toFixed(2)}</span>
                        </div>
                        {order.shippingFee > 0 ? (
                          <div className="order-total-row">
                            <span>Phí vận chuyển</span>
                            <span>{Number(order.shippingFee).toLocaleString()}₫</span>
                          </div>
                        ) : null}
                        {order.discount > 0 ? (
                          <div className="order-total-row order-discount-row">
                            <span>Giảm giá {order.voucherCode ? `(${order.voucherCode})` : ''}</span>
                            <span>-${Number(order.discount).toLocaleString()}</span>
                          </div>
                        ) : null}
                        <div className="order-total-row order-grand-total">
                          <strong>Tổng cộng</strong>
                          <strong>{order.currencySymbol || '$'}{Number(order.total || order.subtotal || 0).toFixed(2)}</strong>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : null}
      </aside>
    </>
  );
}

export default OrdersDrawer;
