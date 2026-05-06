import React from 'react';
import {
  Line,
  LineChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { STATUS_OPTIONS } from '../../pages/admin/adminConstants';

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
  orderStatusCounts
}) {
  return (
    <section className="admx-dashboard">
      <div className="admx-metric-grid">
        <article className="admx-metric-card admx-metric-card-main">
          <p className="admx-metric-label">Total Sales</p>
          <p className="admx-metric-value">${Number(weeklyTotal).toLocaleString()}</p>
          <p className="admx-metric-sub">7-day revenue</p>
        </article>
        <article className="admx-metric-card">
          <p className="admx-metric-label">Total Orders</p>
          <p className="admx-metric-value">{totalOrders.toLocaleString()}</p>
          <p className="admx-metric-sub">all statuses</p>
        </article>
        <article className="admx-metric-card">
          <p className="admx-metric-label">Active Users</p>
          <p className="admx-metric-value">{activeUsers.toLocaleString()}</p>
          <p className="admx-metric-sub">non-admin accounts</p>
        </article>
        <article className="admx-metric-card">
          <p className="admx-metric-label">Low Stock Alerts</p>
          <p className="admx-metric-value">{inventoryWarnings.length.toLocaleString()}</p>
          <p className="admx-metric-sub">threshold under 2</p>
        </article>
      </div>

      <div className="admx-dashboard-grid">
        <article className="admx-panel admx-panel-chart">
          <header className="admx-panel-head">
            <h2>Revenue Analytics</h2>
            <span>Last 8 days</span>
          </header>
          <div className="admx-chart-box">
            <ResponsiveContainer>
              <LineChart data={weeklyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e9dfd4" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#b7a894" />
                <YAxis tick={{ fontSize: 12 }} stroke="#b7a894" />
                <Tooltip formatter={(value) => `$${Number(value || 0).toFixed(2)}`} />
                <Line type="monotone" dataKey="revenue" stroke="#ff8a00" strokeWidth={3} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

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
            <p>Revenue: ${Number(revenueByDay).toLocaleString()}</p>
            <p>Target: ${monthlyTarget.toLocaleString()}</p>
          </div>
        </article>

        <article className="admx-panel admx-panel-categories">
          <header className="admx-panel-head">
            <h2>Top Categories</h2>
            <span>30 days</span>
          </header>
          <div className="admx-category-ring" style={categoryDonutStyle}>
            <div className="admx-category-ring-inner">
              <small>Total Sales</small>
              <strong>${Number(topCategoriesTotal).toLocaleString()}</strong>
            </div>
          </div>
          <ul className="admx-category-list">
            {topCategories.map((item, idx) => (
              <li key={`${item.name}-${idx}`}>
                <span>{item.name}</span>
                <strong>${Number(item.revenue || 0).toLocaleString()}</strong>
              </li>
            ))}
            {topCategories.length === 0 ? <li><span>No data yet</span><strong>$0</strong></li> : null}
          </ul>
        </article>

        <article className="admx-panel admx-panel-compact">
          <header className="admx-panel-head">
            <h2>Order Workflow</h2>
            <span>live</span>
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
                    <span style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </article>
      </div>
    </section>
  );
}

export default AdminDashboardSection;
