import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Minus, Plus, ShoppingBag, Tag, Trash2, Truck, X } from 'lucide-react';
import axios from 'axios';

const PROVINCES_API = 'https://provinces.open-api.vn/api';

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
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [selectedProvinceCode, setSelectedProvinceCode] = useState('');
  const [selectedDistrictCode, setSelectedDistrictCode] = useState('');
  const [selectedWardCode, setSelectedWardCode] = useState('');
  const [shippingFee, setShippingFee] = useState(0);
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherApplied, setVoucherApplied] = useState(null);
  const [voucherError, setVoucherError] = useState('');
  const [discount, setDiscount] = useState(0);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0),
    [items]
  );

  const total = useMemo(() => Math.max(0, subtotal + shippingFee - discount), [subtotal, shippingFee, discount]);

  // Load provinces
  useEffect(() => {
    if (!isOpen) return;
    axios.get(`${PROVINCES_API}/p/`)
      .then((res) => setProvinces(Array.isArray(res.data) ? res.data : []))
      .catch(() => setProvinces([]));
  }, [isOpen]);

  // Load districts when province changes
  useEffect(() => {
    if (!selectedProvinceCode) {
      setDistricts([]);
      setWards([]);
      return;
    }
    axios.get(`${PROVINCES_API}/p/${selectedProvinceCode}?depth=2`)
      .then((res) => setDistricts(Array.isArray(res.data?.districts) ? res.data.districts : []))
      .catch(() => setDistricts([]));
    setSelectedDistrictCode('');
    setSelectedWardCode('');
    setWards([]);
  }, [selectedProvinceCode]);

  // Load wards when district changes
  useEffect(() => {
    if (!selectedDistrictCode) {
      setWards([]);
      return;
    }
    axios.get(`${PROVINCES_API}/d/${selectedDistrictCode}?depth=2`)
      .then((res) => setWards(Array.isArray(res.data?.wards) ? res.data.wards : []))
      .catch(() => setWards([]));
    setSelectedWardCode('');
  }, [selectedDistrictCode]);

  // Calculate shipping fee when city changes
  useEffect(() => {
    const selectedProvince = provinces.find((p) => String(p.code) === String(selectedProvinceCode));
    if (!selectedProvince) {
      setShippingFee(0);
      return;
    }
    axios.post('http://localhost:5000/api/shipping/calculate', { city: selectedProvince.name })
      .then((res) => setShippingFee(Number(res.data?.shippingFee) || 0))
      .catch(() => setShippingFee(50000));
  }, [selectedProvinceCode, provinces]);

  // Sync address to parent state
  useEffect(() => {
    const prov = provinces.find((p) => String(p.code) === String(selectedProvinceCode));
    const dist = districts.find((d) => String(d.code) === String(selectedDistrictCode));
    const ward = wards.find((w) => String(w.code) === String(selectedWardCode));
    onShippingChange((prev) => ({
      ...prev,
      province: prov?.name || '',
      city: prov?.name || prev.city,
      district: dist?.name || '',
      ward: ward?.name || '',
      country: 'Vietnam',
      postalCode: prev.postalCode || '700000'
    }));
  }, [selectedProvinceCode, selectedDistrictCode, selectedWardCode, provinces, districts, wards]);

  const handleApplyVoucher = useCallback(async () => {
    if (!voucherCode.trim()) return;
    setVoucherError('');
    try {
      const res = await axios.post('http://localhost:5000/api/voucher/validate', {
        code: voucherCode,
        subtotal,
        city: shippingInfo.city || shippingInfo.province
      });
      if (res.data?.valid) {
        setVoucherApplied(res.data);
        setDiscount(Number(res.data.discount) || 0);
        if (res.data.shippingFee !== undefined) {
          setShippingFee(res.data.shippingFee);
        }
        setVoucherError('');
      }
    } catch (err) {
      setVoucherError(err.response?.data?.message || 'Mã giảm giá không hợp lệ');
      setVoucherApplied(null);
      setDiscount(0);
    }
  }, [voucherCode, subtotal, shippingInfo]);

  const handleRemoveVoucher = () => {
    setVoucherApplied(null);
    setDiscount(0);
    setVoucherCode('');
    setVoucherError('');
  };

  const handleCheckout = () => {
    onCheckout({
      shippingFee,
      discount,
      total,
      voucherCode: voucherApplied?.code || ''
    });
  };

  const formatVND = (value) => {
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k₫`;
    return `${value.toLocaleString()}₫`;
  };

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
                    {item.configuration ? (
                      <div className="cart-item-config">
                        {item.configuration.shaft ? <span className="cart-config-tag">Shaft: {item.configuration.shaft.split('•')[0].trim()}</span> : null}
                        {item.configuration.tip ? <span className="cart-config-tag">Tip: {item.configuration.tip.split('•')[0].trim()}</span> : null}
                        {item.configuration.weight ? <span className="cart-config-tag">Weight: {item.configuration.weight}</span> : null}
                      </div>
                    ) : null}
                    <p className="cart-item-price">${Number(item.price || 0).toFixed(2)}</p>
                    <div className="cart-qty-row">
                      <button type="button" className="cart-qty-btn" onClick={() => onDecrease(item.id)} aria-label={`Decrease quantity for ${item.name}`}>
                        <Minus className="cart-qty-icon" />
                      </button>
                      <span className="cart-qty-value">{item.quantity}</span>
                      <button type="button" className="cart-qty-btn" onClick={() => onIncrease(item.id)} aria-label={`Increase quantity for ${item.name}`}>
                        <Plus className="cart-qty-icon" />
                      </button>
                      <button type="button" className="cart-remove-btn" onClick={() => onRemove(item.id)} aria-label={`Remove ${item.name} from cart`}>
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
                  Họ và tên
                  <input type="text" className="cart-input" value={shippingInfo.fullName}
                    onChange={(e) => onShippingChange((prev) => ({ ...prev, fullName: e.target.value }))}
                    placeholder="Nguyễn Văn A" />
                </label>

                <div className="cart-field-grid">
                  <label className="cart-field">
                    Số điện thoại
                    <input type="tel" className="cart-input" value={shippingInfo.phone}
                      onChange={(e) => onShippingChange((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="0123456789" />
                  </label>
                  <label className="cart-field">
                    Mã bưu điện
                    <input type="text" className="cart-input" value={shippingInfo.postalCode}
                      onChange={(e) => onShippingChange((prev) => ({ ...prev, postalCode: e.target.value }))}
                      placeholder="700000" />
                  </label>
                </div>

                {/* Province / District / Ward cascading selects */}
                <label className="cart-field">
                  Tỉnh / Thành phố
                  <select className="cart-select" value={selectedProvinceCode}
                    onChange={(e) => setSelectedProvinceCode(e.target.value)}>
                    <option value="">-- Chọn Tỉnh/Thành phố --</option>
                    {provinces.map((p) => (
                      <option key={p.code} value={p.code}>{p.name}</option>
                    ))}
                  </select>
                </label>

                <div className="cart-field-grid">
                  <label className="cart-field">
                    Quận / Huyện
                    <select className="cart-select" value={selectedDistrictCode}
                      onChange={(e) => setSelectedDistrictCode(e.target.value)}
                      disabled={districts.length === 0}>
                      <option value="">-- Chọn Quận/Huyện --</option>
                      {districts.map((d) => (
                        <option key={d.code} value={d.code}>{d.name}</option>
                      ))}
                    </select>
                  </label>
                  <label className="cart-field">
                    Phường / Xã
                    <select className="cart-select" value={selectedWardCode}
                      onChange={(e) => setSelectedWardCode(e.target.value)}
                      disabled={wards.length === 0}>
                      <option value="">-- Chọn Phường/Xã --</option>
                      {wards.map((w) => (
                        <option key={w.code} value={w.code}>{w.name}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="cart-field">
                  Địa chỉ chi tiết
                  <input type="text" className="cart-input" value={shippingInfo.addressLine1}
                    onChange={(e) => onShippingChange((prev) => ({ ...prev, addressLine1: e.target.value }))}
                    placeholder="123 Nguyễn Trãi, Phường 2" />
                </label>

                {/* Voucher */}
                <p className="cart-section-title" style={{ marginTop: 16 }}>
                  <Tag size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                  Mã giảm giá
                </p>
                <div className="cart-voucher-row">
                  <input
                    type="text"
                    className="cart-input cart-voucher-input"
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                    placeholder="Nhập mã: PREDATOR10"
                    disabled={!!voucherApplied}
                  />
                  {voucherApplied ? (
                    <button type="button" className="cart-voucher-remove-btn" onClick={handleRemoveVoucher}>Xóa</button>
                  ) : (
                    <button type="button" className="cart-voucher-btn" onClick={handleApplyVoucher}>Áp dụng</button>
                  )}
                </div>
                {voucherError ? <p className="cart-voucher-error">{voucherError}</p> : null}
                {voucherApplied ? (
                  <p className="cart-voucher-success">
                    <CheckCircle2 size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                    {voucherApplied.description} — Giảm ${discount > 0 ? discount.toLocaleString() : ''}{voucherApplied.shippingFee === 0 ? ' + Miễn phí ship' : ''}
                  </p>
                ) : null}

                {/* Payment method */}
                <p className="cart-section-title">Payment method</p>
                <div className="cart-payment-methods" role="radiogroup" aria-label="Payment method">
                  <label className={`cart-payment-option ${paymentInfo.method === 'cod' ? 'cart-payment-option-active' : ''}`}>
                    <input type="radio" name="paymentMethod" value="cod" checked={paymentInfo.method === 'cod'}
                      onChange={() => onPaymentChange((prev) => ({ ...prev, method: 'cod' }))} />
                    <span>Thanh toán khi nhận hàng (COD)</span>
                  </label>
                  <label className={`cart-payment-option ${paymentInfo.method === 'bank-transfer' ? 'cart-payment-option-active' : ''}`}>
                    <input type="radio" name="paymentMethod" value="bank-transfer" checked={paymentInfo.method === 'bank-transfer'}
                      onChange={() => onPaymentChange((prev) => ({ ...prev, method: 'bank-transfer' }))} />
                    <span>Chuyển khoản ngân hàng</span>
                  </label>
                  <label className={`cart-payment-option ${paymentInfo.method === 'vnpay' ? 'cart-payment-option-active' : ''}`}>
                    <input type="radio" name="paymentMethod" value="vnpay" checked={paymentInfo.method === 'vnpay'}
                      onChange={() => onPaymentChange((prev) => ({ ...prev, method: 'vnpay' }))} />
                    <span>🏦 Thanh toán VNPAY (ATM/Visa/QR)</span>
                  </label>
                </div>
                {paymentInfo.method === 'bank-transfer' ? (
                  <p className="cart-payment-note">Sau khi bấm Thanh toán, mã QR sẽ hiển thị để bạn chuyển khoản.</p>
                ) : null}
                {paymentInfo.method === 'vnpay' ? (
                  <p className="cart-payment-note">Bạn sẽ được chuyển đến cổng thanh toán VNPAY để hoàn tất giao dịch (Sandbox mode).</p>
                ) : null}
              </div>

              {errorMessage ? <p className="cart-error">{errorMessage}</p> : null}

              {/* Summary */}
              <div className="cart-summary-block">
                <div className="cart-summary-row">
                  <span>Tạm tính</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="cart-summary-row">
                  <span>
                    <Truck size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                    Phí vận chuyển
                  </span>
                  <span>{shippingFee > 0 ? formatVND(shippingFee) : 'Free'}</span>
                </div>
                {discount > 0 ? (
                  <div className="cart-summary-row cart-summary-discount">
                    <span>Giảm giá</span>
                    <span>-${discount.toLocaleString()}</span>
                  </div>
                ) : null}
                <div className="cart-summary-row cart-summary-total">
                  <strong>Tổng cộng</strong>
                  <strong>${total.toFixed(2)}</strong>
                </div>
              </div>

              <div className="cart-footer-actions">
                <button type="button" className="cart-clear-btn" onClick={onClear}>Xóa giỏ hàng</button>
                <button type="button" className="cart-checkout-btn" onClick={handleCheckout} disabled={isCheckoutSubmitting}>
                  {isCheckoutSubmitting ? 'Đang xử lý...' : 'Thanh toán'}
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
