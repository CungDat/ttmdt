import React, { useMemo } from 'react';
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';

function CartDrawer({
  isOpen,
  onClose,
  items,
  onIncrease,
  onDecrease,
  onRemove,
  onClear,
  onCheckout,
  isCheckoutSubmitting = false,
  shippingInfo,
  onShippingChange,
  paymentInfo,
  onPaymentChange,
  errorMessage = ''
}) {
  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0),
    [items]
  );

  return (
    <>
      <div
        className={`cart-backdrop ${isOpen ? 'cart-backdrop-open' : 'cart-backdrop-closed'}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className={`cart-drawer ${isOpen ? 'cart-drawer-open' : 'cart-drawer-closed'}`} aria-label="Shopping cart">
        <div className="cart-drawer-head">
          <h2 className="cart-drawer-title">Your Cart</h2>
          <button type="button" className="cart-icon-button" onClick={onClose} aria-label="Close cart">
            <X className="cart-icon" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="cart-empty">
            <ShoppingBag className="cart-empty-icon" />
            <p className="cart-empty-title">Your cart is empty</p>
            <p className="cart-empty-text">Add products to start your order.</p>
          </div>
        ) : (
          <>
            <ul className="cart-items" aria-label="Cart items">
              {items.map((item) => (
                <li key={item.id} className="cart-item">
                  <img src={item.image} alt={item.name} className="cart-item-image" loading="lazy" />

                  <div className="cart-item-body">
                    <p className="cart-item-name">{item.name}</p>
                    <p className="cart-item-meta">{item.seriesTitle || 'Cue Line'}</p>
                    <p className="cart-item-price">${Number(item.price || 0).toFixed(2)}</p>

                    <div className="cart-qty-row">
                      <button
                        type="button"
                        className="cart-qty-btn"
                        onClick={() => onDecrease(item.id)}
                        aria-label={`Decrease quantity for ${item.name}`}
                      >
                        <Minus className="cart-qty-icon" />
                      </button>
                      <span className="cart-qty-value">{item.quantity}</span>
                      <button
                        type="button"
                        className="cart-qty-btn"
                        onClick={() => onIncrease(item.id)}
                        aria-label={`Increase quantity for ${item.name}`}
                      >
                        <Plus className="cart-qty-icon" />
                      </button>

                      <button
                        type="button"
                        className="cart-remove-btn"
                        onClick={() => onRemove(item.id)}
                        aria-label={`Remove ${item.name} from cart`}
                      >
                        <Trash2 className="cart-remove-icon" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="cart-footer">
              <div className="cart-shipping-form">
                <p className="cart-section-title">Shipping details</p>

                <label className="cart-field">
                  Full name
                  <input
                    type="text"
                    className="cart-input"
                    value={shippingInfo.fullName}
                    onChange={(event) => onShippingChange((prev) => ({ ...prev, fullName: event.target.value }))}
                    placeholder="Nguyen Van A"
                  />
                </label>

                <div className="cart-field-grid">
                  <label className="cart-field">
                    Phone
                    <input
                      type="tel"
                      className="cart-input"
                      value={shippingInfo.phone}
                      onChange={(event) => onShippingChange((prev) => ({ ...prev, phone: event.target.value }))}
                      placeholder="0123456789"
                    />
                  </label>

                  <label className="cart-field">
                    Postal code
                    <input
                      type="text"
                      className="cart-input"
                      value={shippingInfo.postalCode}
                      onChange={(event) => onShippingChange((prev) => ({ ...prev, postalCode: event.target.value }))}
                      placeholder="700000"
                    />
                  </label>
                </div>

                <label className="cart-field">
                  Address line 1
                  <input
                    type="text"
                    className="cart-input"
                    value={shippingInfo.addressLine1}
                    onChange={(event) => onShippingChange((prev) => ({ ...prev, addressLine1: event.target.value }))}
                    placeholder="123 Nguyen Trai"
                  />
                </label>

                <div className="cart-field-grid">
                  <label className="cart-field">
                    City
                    <input
                      type="text"
                      className="cart-input"
                      value={shippingInfo.city}
                      onChange={(event) => onShippingChange((prev) => ({ ...prev, city: event.target.value }))}
                      placeholder="Ho Chi Minh City"
                    />
                  </label>

                  <label className="cart-field">
                    Country
                    <input
                      type="text"
                      className="cart-input"
                      value={shippingInfo.country}
                      onChange={(event) => onShippingChange((prev) => ({ ...prev, country: event.target.value }))}
                      placeholder="Vietnam"
                    />
                  </label>
                </div>

                <p className="cart-section-title">Payment method</p>

                <div className="cart-payment-methods" role="radiogroup" aria-label="Payment method">
                  <label className={`cart-payment-option ${paymentInfo.method === 'cod' ? 'cart-payment-option-active' : ''}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={paymentInfo.method === 'cod'}
                      onChange={() => onPaymentChange((prev) => ({ ...prev, method: 'cod' }))}
                    />
                    <span>Cash on Delivery (COD)</span>
                  </label>

                  <label className={`cart-payment-option ${paymentInfo.method === 'bank-transfer' ? 'cart-payment-option-active' : ''}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bank-transfer"
                      checked={paymentInfo.method === 'bank-transfer'}
                      onChange={() => onPaymentChange((prev) => ({ ...prev, method: 'bank-transfer' }))}
                    />
                    <span>Bank transfer to seller</span>
                  </label>
                </div>

                {paymentInfo.method === 'bank-transfer' ? (
                  <p className="cart-payment-note">
                    After you press Checkout, we will show the seller QR code so you can scan and transfer.
                  </p>
                ) : null}
              </div>

              {errorMessage ? <p className="cart-error">{errorMessage}</p> : null}

              <div className="cart-summary-row">
                <span>Subtotal</span>
                <strong>${subtotal.toFixed(2)}</strong>
              </div>

              <div className="cart-footer-actions">
                <button type="button" className="cart-clear-btn" onClick={onClear}>
                  Clear cart
                </button>
                <button
                  type="button"
                  className="cart-checkout-btn"
                  onClick={onCheckout}
                  disabled={isCheckoutSubmitting}
                >
                  {isCheckoutSubmitting ? 'Processing...' : 'Checkout'}
                </button>
              </div>
            </div>
          </>
        )}
      </aside>
    </>
  );
}

export default CartDrawer;
