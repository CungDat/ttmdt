import React, { useMemo, useState } from 'react';
import { NEXT_STATUS, STATUS_OPTIONS, PAYMENT_METHOD_LABELS, formatCurrency, formatDate } from '../../pages/admin/adminConstants';

function AdminOrdersSection({
  orders,
  editingOrderId,
  editingOrderDraft,
  setEditingOrderDraft,
  setEditingOrderId,
  statusLabelMap,
  beginEditOrder,
  handleMoveOrderToNextStatus,
  handleSaveOrder
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [expandedOrderId, setExpandedOrderId] = useState('');

  const statusCounts = useMemo(() => {
    return orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    let result = orders.filter((order) => {
      if (statusFilter !== 'all' && order.status !== statusFilter) return false;
      if (!query) return true;
      const orderId = String(order._id || '').toLowerCase();
      const customerName = String(order.user?.name || '').toLowerCase();
      const customerEmail = String(order.user?.email || '').toLowerCase();
      const phone = String(order.shippingAddress?.phone || '').toLowerCase();
      return orderId.includes(query) || customerName.includes(query) || customerEmail.includes(query) || phone.includes(query);
    });

    if (sortBy === 'oldest') {
      result = [...result].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortBy === 'total-desc') {
      result = [...result].sort((a, b) => (b.total || b.subtotal || 0) - (a.total || a.subtotal || 0));
    } else if (sortBy === 'total-asc') {
      result = [...result].sort((a, b) => (a.total || a.subtotal || 0) - (b.total || b.subtotal || 0));
    } else {
      result = [...result].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    return result;
  }, [orders, statusFilter, searchQuery, sortBy]);

  const getStatusColor = (status) => {
    const found = STATUS_OPTIONS.find((s) => s.value === status);
    return found?.color || '#6b7280';
  };

  return (
    <section className="admin-card admx-panel-wrap">
      <div className="admx-orders-header">
        <h2 className="admin-section-title">Order Management</h2>
        <span className="admx-orders-count">{filteredOrders.length} / {orders.length} orders</span>
      </div>

      {/* Status filter pills */}
      <div className="admx-order-status-pills">
        <button
          type="button"
          className={`admx-status-pill ${statusFilter === 'all' ? 'admx-status-pill-active' : ''}`}
          onClick={() => setStatusFilter('all')}
        >
          All ({orders.length})
        </button>
        {STATUS_OPTIONS.map((status) => (
          <button
            key={status.value}
            type="button"
            className={`admx-status-pill ${statusFilter === status.value ? 'admx-status-pill-active' : ''}`}
            style={statusFilter === status.value ? { background: status.color, borderColor: status.color, color: '#fff' } : {}}
            onClick={() => setStatusFilter(status.value)}
          >
            {status.label} ({statusCounts[status.value] || 0})
          </button>
        ))}
      </div>

      {/* Search & Sort */}
      <div className="admx-product-toolbar">
        <input
          className="admin-input"
          placeholder="Search by ID, name, email, phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select className="admin-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="total-desc">Total ↓</option>
          <option value="total-asc">Total ↑</option>
        </select>
      </div>

      {/* Order workflow guide */}
      <div className="admx-workflow-guide">
        {STATUS_OPTIONS.slice(0, 5).map((status, idx) => (
          <React.Fragment key={status.value}>
            <span className="admx-workflow-step" style={{ background: status.color + '18', color: status.color, borderColor: status.color + '40' }}>
              {status.label}
            </span>
            {idx < 4 ? <span className="admx-workflow-arrow">→</span> : null}
          </React.Fragment>
        ))}
      </div>

      {/* Orders list */}
      <div className="admin-orders-list">
        {filteredOrders.length === 0 ? (
          <p className="admx-empty-text">No orders match the filter.</p>
        ) : null}

        {filteredOrders.map((order) => {
          const isEditing = editingOrderId === order._id;
          const isExpanded = expandedOrderId === order._id;
          const statusColor = getStatusColor(order.status);
          const total = order.total || order.subtotal || 0;

          return (
            <article key={order._id} className={`admin-order-card ${isEditing ? 'admin-order-editing' : ''}`}>
              {/* Order header */}
              <div className="admx-order-row-head">
                <div className="admx-order-id-group">
                  <p className="admin-order-id">#{String(order._id).slice(-8).toUpperCase()}</p>
                  <span className="admx-order-date">{formatDate(order.createdAt)}</span>
                </div>
                <div className="admx-order-status-group">
                  {isEditing ? (
                    <select
                      className="admin-select"
                      value={editingOrderDraft.status}
                      onChange={(e) => setEditingOrderDraft((p) => ({ ...p, status: e.target.value }))}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  ) : (
                    <span
                      className="admx-order-status-badge"
                      style={{ background: statusColor + '18', color: statusColor, borderColor: statusColor + '40' }}
                    >
                      {statusLabelMap[order.status] || order.status}
                    </span>
                  )}
                  <strong className="admx-order-total">{formatCurrency(total)}</strong>
                </div>
              </div>

              {/* Customer info */}
              <div className="admx-order-customer-row">
                <span className="admx-order-customer-name">{order.user?.name || 'Guest'}</span>
                <span className="admx-order-customer-detail">{order.user?.email || 'N/A'}</span>
                <span className="admx-order-customer-detail">{order.shippingAddress?.phone || ''}</span>
                <span className="admx-order-payment-badge">
                  {PAYMENT_METHOD_LABELS[order.payment?.method] || order.payment?.method || 'N/A'}
                </span>
              </div>

              {/* Expand / collapse */}
              <button
                type="button"
                className="admx-order-expand-btn"
                onClick={() => setExpandedOrderId(isExpanded ? '' : order._id)}
              >
                {isExpanded ? '▲ Collapse' : '▼ Order Details'}
              </button>

              {/* Expanded details */}
              {isExpanded ? (
                <div className="admx-order-details">
                  {/* Items */}
                  <div className="admx-order-items-section">
                    <h4 className="admx-order-subsection-title">Products ({order.items?.length || 0})</h4>
                    <div className="admx-order-items-grid">
                      {(order.items || []).map((item, idx) => (
                        <div key={idx} className="admx-order-item-row">
                          <img src={item.image || 'https://placehold.co/40x40?text=Cue'} alt={item.name} className="admx-order-item-img" />
                          <div className="admx-order-item-info">
                            <strong>{item.name}</strong>
                            <span>x{item.quantity} — {formatCurrency(item.price)}</span>
                          </div>
                          <span className="admx-order-item-subtotal">{formatCurrency(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="admx-order-totals">
                      <div className="admx-order-total-row">
                        <span>Subtotal</span><strong>{formatCurrency(order.subtotal)}</strong>
                      </div>
                      {order.shippingFee ? (
                        <div className="admx-order-total-row">
                          <span>Shipping Fee</span><strong>{formatCurrency(order.shippingFee)}</strong>
                        </div>
                      ) : null}
                      {order.discount ? (
                        <div className="admx-order-total-row admx-order-discount">
                          <span>Discount {order.voucherCode ? `(${order.voucherCode})` : ''}</span>
                          <strong>-{formatCurrency(order.discount)}</strong>
                        </div>
                      ) : null}
                      <div className="admx-order-total-row admx-order-grand-total">
                        <span>Grand Total</span><strong>{formatCurrency(total)}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Shipping address */}
                  <div className="admx-order-shipping-section">
                    <h4 className="admx-order-subsection-title">Shipping Address</h4>
                    <div className="admx-order-address-card">
                      <p><strong>{order.shippingAddress?.fullName || 'N/A'}</strong></p>
                      <p>{order.shippingAddress?.phone || 'N/A'}</p>
                      <p>{[order.shippingAddress?.addressLine1, order.shippingAddress?.ward, order.shippingAddress?.district, order.shippingAddress?.city].filter(Boolean).join(', ')}</p>
                      {order.shippingAddress?.province ? <p>{order.shippingAddress.province}</p> : null}
                    </div>
                  </div>

                  {/* Tracking info */}
                  {order.tracking?.number ? (
                    <div className="admx-order-tracking-section">
                      <h4 className="admx-order-subsection-title">Tracking Information</h4>
                      <p>Tracking Number: <strong>{order.tracking.number}</strong></p>
                      <p>Carrier: {order.tracking.carrier || 'N/A'}</p>
                      {order.tracking.currentLocation ? <p>Location: {order.tracking.currentLocation}</p> : null}
                    </div>
                  ) : null}

                  {/* Status History */}
                  {order.statusHistory?.length ? (
                    <div className="admx-order-history-section">
                      <h4 className="admx-order-subsection-title">Status History</h4>
                      <div className="admx-order-timeline">
                        {order.statusHistory.map((entry, idx) => (
                          <div key={idx} className="admx-order-timeline-item">
                            <span className="admx-order-timeline-dot" style={{ background: getStatusColor(entry.status) }} />
                            <div>
                              <strong>{statusLabelMap[entry.status] || entry.status}</strong>
                              <span className="admx-order-timeline-date">{formatDate(entry.updatedAt)}</span>
                              {entry.note ? <p className="admx-order-timeline-note">{entry.note}</p> : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {/* Edit panel */}
              {isEditing ? (
                <div className="admin-order-edit">
                  <div className="admx-order-edit-grid">
                    <input className="admin-input" placeholder="Warehouse" value={editingOrderDraft.assignedWarehouse} onChange={(e) => setEditingOrderDraft((p) => ({ ...p, assignedWarehouse: e.target.value }))} />
                    <input className="admin-input" placeholder="Tracking Number" value={editingOrderDraft.tracking.number} onChange={(e) => setEditingOrderDraft((p) => ({ ...p, tracking: { ...p.tracking, number: e.target.value } }))} />
                    <input className="admin-input" placeholder="Carrier" value={editingOrderDraft.tracking.carrier} onChange={(e) => setEditingOrderDraft((p) => ({ ...p, tracking: { ...p.tracking, carrier: e.target.value } }))} />
                    <input className="admin-input" placeholder="Current Location" value={editingOrderDraft.tracking.currentLocation} onChange={(e) => setEditingOrderDraft((p) => ({ ...p, tracking: { ...p.tracking, currentLocation: e.target.value } }))} />
                  </div>
                  <textarea className="admin-input" placeholder="Internal notes..." rows={2} value={editingOrderDraft.notes} onChange={(e) => setEditingOrderDraft((p) => ({ ...p, notes: e.target.value }))} />
                  <div className="admx-order-edit-actions">
                    <button type="button" className="admin-primary-btn" onClick={handleSaveOrder}>Save changes</button>
                    <button type="button" className="admin-link-btn" onClick={() => setEditingOrderId('')}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="admx-order-actions-row">
                  <button type="button" className="admin-link-btn" onClick={() => beginEditOrder(order)}>Edit</button>
                  {NEXT_STATUS[order.status] ? (
                    <button
                      type="button"
                      className="admin-primary-btn admx-order-next-btn"
                      onClick={() => {
                        if (window.confirm(`Move order to "${statusLabelMap[NEXT_STATUS[order.status]]}"?`)) {
                          handleMoveOrderToNextStatus(order);
                        }
                      }}
                    >
                      → {statusLabelMap[NEXT_STATUS[order.status]] || NEXT_STATUS[order.status]}
                    </button>
                  ) : null}
                  {order.status === 'pending' ? (
                    <button
                      type="button"
                      className="admin-link-btn admin-link-btn-danger"
                      onClick={() => {
                        if (window.confirm('Confirm CANCEL this order?')) {
                          handleMoveOrderToNextStatus({ ...order, status: 'pending', _overrideNextStatus: 'cancelled' });
                        }
                      }}
                    >
                      Cancel Order
                    </button>
                  ) : null}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default AdminOrdersSection;
