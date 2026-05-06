import React from 'react';
import { NEXT_STATUS, STATUS_OPTIONS } from '../../pages/admin/adminConstants';

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
  return (
    <section className="admin-card admx-panel-wrap">
      <h2 className="admin-section-title">Order Workflow</h2>
      <p className="admin-loading">Workflow: Pending Confirmation -&gt; Paid -&gt; Packing -&gt; Shipping -&gt; Completed</p>
      <div className="admin-orders-list">
        {orders.map((order) => (
          <article key={order._id} className={`admin-order-card ${editingOrderId === order._id ? 'admin-order-editing' : ''}`}>
            <div className="admin-order-head">
              <p className="admin-order-id">#{String(order._id).slice(-8).toUpperCase()}</p>
              {editingOrderId === order._id ? (
                <select className="admin-select" value={editingOrderDraft.status} onChange={(e) => setEditingOrderDraft((p) => ({ ...p, status: e.target.value }))}>
                  {STATUS_OPTIONS.map((statusOption) => (
                    <option key={statusOption.value} value={statusOption.value}>{statusOption.label}</option>
                  ))}
                </select>
              ) : (
                <span className="admin-order-status">{statusLabelMap[order.status] || order.status}</span>
              )}
            </div>

            <p className="admin-order-meta">Customer: {order.user?.name || 'Unknown'} ({order.user?.email || 'n/a'})</p>
            <p className="admin-order-meta">Payment: {order.payment?.method || 'n/a'} {order.payment?.reference ? `- ${order.payment.reference}` : ''}</p>
            <p className="admin-order-meta">Total: ${Number(order.subtotal || 0).toFixed(2)}</p>

            {editingOrderId === order._id ? (
              <div className="admin-order-edit">
                <input className="admin-input" placeholder="Warehouse" value={editingOrderDraft.assignedWarehouse} onChange={(e) => setEditingOrderDraft((p) => ({ ...p, assignedWarehouse: e.target.value }))} />
                <input className="admin-input" placeholder="Tracking Number" value={editingOrderDraft.tracking.number} onChange={(e) => setEditingOrderDraft((p) => ({ ...p, tracking: { ...p.tracking, number: e.target.value } }))} />
                <input className="admin-input" placeholder="Carrier" value={editingOrderDraft.tracking.carrier} onChange={(e) => setEditingOrderDraft((p) => ({ ...p, tracking: { ...p.tracking, carrier: e.target.value } }))} />
                <input className="admin-input" placeholder="Current Location" value={editingOrderDraft.tracking.currentLocation} onChange={(e) => setEditingOrderDraft((p) => ({ ...p, tracking: { ...p.tracking, currentLocation: e.target.value } }))} />
                <textarea className="admin-input" placeholder="Notes" value={editingOrderDraft.notes} onChange={(e) => setEditingOrderDraft((p) => ({ ...p, notes: e.target.value }))} />
                <button type="button" className="admin-link-btn" onClick={handleSaveOrder}>Save & Notify</button>
                <button type="button" className="admin-link-btn" onClick={() => setEditingOrderId('')}>Cancel</button>
              </div>
            ) : (
              <>
                {order.tracking?.number ? <p className="admin-order-meta">Tracking: {order.tracking.number} ({order.tracking.carrier})</p> : null}
                {order.tracking?.currentLocation ? <p className="admin-order-meta">Location: {order.tracking.currentLocation}</p> : null}
                {order.notes ? <p className="admin-order-meta">Notes: {order.notes}</p> : null}
                <button type="button" className="admin-link-btn" onClick={() => beginEditOrder(order)}>Edit</button>
                {NEXT_STATUS[order.status] ? (
                  <button type="button" className="admin-link-btn" onClick={() => handleMoveOrderToNextStatus(order)}>
                    Move to {statusLabelMap[NEXT_STATUS[order.status]] || NEXT_STATUS[order.status]}
                  </button>
                ) : null}
              </>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

export default AdminOrdersSection;
