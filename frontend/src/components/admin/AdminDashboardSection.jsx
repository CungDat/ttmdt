import React, { useMemo } from 'react';
import {
  Line,
  LineChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { STATUS_OPTIONS, formatCurrency, formatDate, PAYMENT_METHOD_LABELS } from '../../pages/admin/adminConstants';

function AdminDashboardSection({
  weeklyTotal,
  totalOrders,
  activeUsers,
  inventoryWarnings,
  weeklyRevenue,
  monthlyProgress,
  revenueByDay,
  monthlyTarget,
  categoryDonutStyle,
  topCategoriesTotal,
  topCategories,
  orderStatusCounts,
  recentOrders,
  onNavigateTab
}) {
  const pendingCount = (orderStatusCounts?.pending || 0);
  const packingCount = (orderStatusCounts?.packing || 0);
  const shippedCount = (orderStatusCounts?.shipped || 0);
  const actionableOrders = pendingCount + packingCount + shippedCount;

  return (
    <section className="admx-dashboard">
      {/* KPI Metric cards */}
      <div className="admx-metric-grid">
        <article className="admx-metric-card admx-metric-card-main">
          <p className="admx-metric-label">Weekly Revenue</p>
          <p className="admx-metric-value">{formatCurrency(weeklyTotal)}</p>
          <p className="admx-metric-sub">Last 7 days</p>
        </article>
        <article className="admx-metric-card">
          <p className="admx-metric-label">Total Orders</p>
          <p className="admx-metric-value">{totalOrders.toLocaleString()}</p>
          <p className="admx-metric-sub">all statuses</p>
        </article>
        <article className="admx-metric-card">
          <p className="admx-metric-label">Customers</p>
          <p className="admx-metric-value">{activeUsers.toLocaleString()}</p>
          <p className="admx-metric-sub">active accounts</p>
        </article>
        <article className="admx-metric-card admx-metric-card-alert">
          <p className="admx-metric-label">Action Required</p>
          <p className="admx-metric-value">{actionableOrders}</p>
          <p className="admx-metric-sub">
            {pendingCount} pending · {inventoryWarnings.length} stock warnings
          </p>
        </article>
      </div>

      <div className="admx-dashboard-grid">
        {/* Revenue chart */}
        <article className="admx-panel admx-panel-chart">
          <header className="admx-panel-head">
            <h2>Revenue</h2>
            <span>Last 8 days</span>
          </header>
          <div className="admx-chart-box">
            <ResponsiveContainer>
              <LineChart data={weeklyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e9dfd4" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#b7a894" />
                <YAxis tick={{ fontSize: 12 }} stroke="#b7a894" />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Line type="monotone" dataKey="revenue" stroke="#ff8a00" strokeWidth={3} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        {/* Monthly target */}
        <article className="admx-panel admx-panel-target">
          <header className="admx-panel-head">
            <h2>Monthly Target</h2>
            <span>{monthlyProgress}%</span>
          </header>
          <div className="admx-target-ring-wrap">
            <div
              className="admx-target-ring"
              style={{ background: `conic-gradient(#ff8a00 0 ${Math.round((monthlyProgress / 100) * 360)}deg, #f1e2cf ${Math.round((monthlyProgress / 100) * 360)}deg 360deg)` }}
            >
              <div className="admx-target-ring-inner">{monthlyProgress}%</div>
            </div>
          </div>
          <div className="admx-target-meta">
            <p>Actual: {formatCurrency(revenueByDay)}</p>
            <p>Target: {formatCurrency(monthlyTarget)}</p>
          </div>
        </article>

        {/* Top categories */}
        <article className="admx-panel admx-panel-categories">
          <header className="admx-panel-head">
            <h2>Top Products</h2>
            <span>30 days</span>
          </header>
          <div className="admx-category-ring" style={categoryDonutStyle}>
            <div className="admx-category-ring-inner">
              <small>Total</small>
              <strong>{formatCurrency(topCategoriesTotal)}</strong>
            </div>
          </div>
          <ul className="admx-category-list">
            {topCategories.map((item, idx) => (
              <li key={`${item.name}-${idx}`}>
                <span>{item.name}</span>
                <strong>{formatCurrency(item.revenue)}</strong>
              </li>
            ))}
            {topCategories.length === 0 ? <li><span>No data available</span><strong>$0</strong></li> : null}
          </ul>
        </article>

        {/* Order workflow overview */}
        <article className="admx-panel admx-panel-compact">
          <header className="admx-panel-head">
            <h2>Order Statuses</h2>
            <button
              type="button"
              className="admx-panel-link-btn"
              onClick={() => onNavigateTab?.('orders')}
            >
              View all →
            </button>
          </header>
          <div className="admx-progress-list">
            {STATUS_OPTIONS.map((status) => {
              const count = orderStatusCounts[status.value] || 0;
              const percent = totalOrders ? Math.round((count / totalOrders) * 100) : 0;
              return (
                <div className="admx-progress-item" key={status.value}>
                  <div className="admx-progress-label-row">
                    <span>{status.label}</span>
                    <strong>{count}</strong>
                  </div>
                  <div className="admx-progress-track">
                    <span style={{ width: `${percent}%`, background: status.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </article>
      </div>

      {/* Recent orders quick view */}
      {recentOrders && recentOrders.length > 0 ? (
        <article className="admx-panel">
          <header className="admx-panel-head">
            <h2>Recent Orders</h2>
            <button type="button" className="admx-panel-link-btn" onClick={() => onNavigateTab?.('orders')}>
              Manage orders →
            </button>
          </header>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Payment</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date Created</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.slice(0, 8).map((order) => {
                  const statusInfo = STATUS_OPTIONS.find((s) => s.value === order.status);
                  return (
                    <tr key={order._id}>
                      <td><strong>#{String(order._id).slice(-8).toUpperCase()}</strong></td>
                      <td>{order.user?.name || 'N/A'}</td>
                      <td>{PAYMENT_METHOD_LABELS[order.payment?.method] || order.payment?.method || 'N/A'}</td>
                      <td><strong>{formatCurrency(order.total || order.subtotal)}</strong></td>
                      <td>
                        <span
                          className="admx-order-status-badge"
                          style={{ background: (statusInfo?.color || '#6b7280') + '18', color: statusInfo?.color || '#6b7280', borderColor: (statusInfo?.color || '#6b7280') + '40' }}
                        >
                          {statusInfo?.label || order.status}
                        </span>
                      </td>
                      <td>{formatDate(order.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </article>
      ) : null}

      {/* Inventory warnings */}
      {inventoryWarnings.length > 0 ? (
        <article className="admx-panel admx-panel-warning">
          <header className="admx-panel-head">
            <h2>Stock Warnings</h2>
            <button type="button" className="admx-panel-link-btn" onClick={() => onNavigateTab?.('inventory')}>
              Manage inventory →
            </button>
          </header>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Stock</th>
                  <th>Reorder Level</th>
                </tr>
              </thead>
              <tbody>
                {inventoryWarnings.slice(0, 5).map((warn) => (
                  <tr key={warn._id} className="admin-row-warning">
                    <td>{warn.lineName || 'N/A'}</td>
                    <td>{warn.variantId?.sku || 'N/A'}</td>
                    <td><strong>{warn.quantity}</strong></td>
                    <td>{warn.reorderLevel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      ) : null}
    </section>
  );
}

export default AdminDashboardSection;
