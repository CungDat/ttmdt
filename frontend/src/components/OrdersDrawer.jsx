import React from 'react';
import { ClipboardList, X } from 'lucide-react';

function OrdersDrawer({ isOpen, onClose, orders, isLoading }) {
  return (
    <>
      <div
        className={`cart-backdrop ${isOpen ? 'cart-backdrop-open' : 'cart-backdrop-closed'}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className={`orders-drawer ${isOpen ? 'orders-drawer-open' : 'orders-drawer-closed'}`} aria-label="Order history">
        <div className="orders-drawer-head">
          <h2 className="orders-drawer-title">My Orders</h2>
          <button type="button" className="cart-icon-button" onClick={onClose} aria-label="Close orders">
            <X className="cart-icon" />
          </button>
        </div>

        {isLoading ? <p className="orders-loading">Loading orders...</p> : null}

        {!isLoading && orders.length === 0 ? (
          <div className="orders-empty">
            <ClipboardList className="orders-empty-icon" />
            <p className="orders-empty-title">No orders yet</p>
            <p className="orders-empty-text">Complete checkout to see your orders here.</p>
          </div>
        ) : null}

        {!isLoading && orders.length > 0 ? (
          <ul className="orders-list" aria-label="Order history list">
            {orders.map((order) => (
              <li key={order._id} className="order-card">
                <div className="order-card-head">
                  <p className="order-id">Order #{String(order._id).slice(-8).toUpperCase()}</p>
                  <span className={`order-status order-status-${order.status || 'pending'}`}>
                    {order.status || 'pending'}
                  </span>
                </div>

                <p className="order-date">{new Date(order.createdAt).toLocaleString()}</p>

                {order.shippingAddress ? (
                  <div className="order-shipping">
                    <p className="order-shipping-title">Shipping to</p>
                    <p className="order-shipping-name">{order.shippingAddress.fullName}</p>
                    <p className="order-shipping-text">{order.shippingAddress.phone}</p>
                    <p className="order-shipping-text">
                      {order.shippingAddress.addressLine1}, {order.shippingAddress.city}, {order.shippingAddress.country} {order.shippingAddress.postalCode}
                    </p>
                  </div>
                ) : null}

                {order.payment ? (
                  <div className="order-payment">
                    <p className="order-shipping-title">Payment</p>
                    {order.payment.method === 'cod' ? (
                      <p className="order-shipping-name">Cash on Delivery (COD)</p>
                    ) : (
                      <>
                        <p className="order-shipping-name">Bank transfer to seller</p>
                        <p className="order-shipping-text">{order.payment.bankName} • {order.payment.accountNumber}</p>
                        <p className="order-shipping-text">{order.payment.accountHolder}</p>
                        {order.payment.reference ? <p className="order-shipping-text">Note: {order.payment.reference}</p> : null}
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

                <div className="order-total-row">
                  <span>Total</span>
                  <strong>{order.currencySymbol || '$'}{Number(order.subtotal || 0).toFixed(2)}</strong>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </aside>
    </>
  );
}

export default OrdersDrawer;
