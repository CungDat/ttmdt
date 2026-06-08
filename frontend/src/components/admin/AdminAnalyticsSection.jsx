import React from 'react';
import {
  Line,
  LineChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
  Bar
} from 'recharts';
import { formatCurrency } from '../../pages/admin/adminConstants';

function AdminAnalyticsSection({ analytics }) {
  const weeklyRevenue = analytics?.kpis?.weeklyRevenue || [];
  const topProducts = analytics?.topProducts || [];
  const todayRevenue = analytics?.kpis?.todayRevenue || 0;
  const pendingCount = analytics?.kpis?.pendingOrderCount || 0;
  const topProduct = analytics?.kpis?.topProduct;
  const totalRevenue30d = analytics?.revenue?.totalRevenue || 0;
  const totalOrders30d = analytics?.revenue?.totalOrders || 0;
  const avgOrderValue = totalOrders30d > 0 ? totalRevenue30d / totalOrders30d : 0;

  return (
    <section className="admin-card admx-panel-wrap">
      <h2 className="admin-section-title">Analytics & Reports</h2>

      {analytics ? (
        <div className="admx-analytics-layout">
          {/* KPI Summary */}
          <div className="admx-analytics-kpi-grid">
            <div className="admx-analytics-kpi">
              <p className="admx-analytics-kpi-label">Today's Revenue</p>
              <p className="admx-analytics-kpi-value admx-analytics-kpi-highlight">{formatCurrency(todayRevenue)}</p>
            </div>
            <div className="admx-analytics-kpi">
              <p className="admx-analytics-kpi-label">30-Day Revenue</p>
              <p className="admx-analytics-kpi-value">{formatCurrency(totalRevenue30d)}</p>
            </div>
            <div className="admx-analytics-kpi">
              <p className="admx-analytics-kpi-label">Pending Orders</p>
              <p className="admx-analytics-kpi-value">{pendingCount}</p>
            </div>
            <div className="admx-analytics-kpi">
              <p className="admx-analytics-kpi-label">Avg Order Value</p>
              <p className="admx-analytics-kpi-value">{formatCurrency(avgOrderValue)}</p>
            </div>
            <div className="admx-analytics-kpi">
              <p className="admx-analytics-kpi-label">Top Product</p>
              <p className="admx-analytics-kpi-value admx-analytics-kpi-name">{topProduct?.name || 'N/A'}</p>
            </div>
          </div>

          {/* Revenue Line Chart */}
          <article className="admx-panel">
            <header className="admx-panel-head">
              <h2>7-Day Revenue Chart</h2>
            </header>
            <div style={{ width: '100%', height: 320 }}>
              <ResponsiveContainer>
                <LineChart data={weeklyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e9dfd4" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#b7a894" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#b7a894" />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Line type="monotone" dataKey="revenue" stroke="#ff8a00" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </article>

          {/* Top Products Bar Chart + Table */}
          <article className="admx-panel">
            <header className="admx-panel-head">
              <h2>Top Selling Products (30 Days)</h2>
              <span>{topProducts.length} products</span>
            </header>

            {topProducts.length > 0 ? (
              <>
                <div style={{ width: '100%', height: 280, marginBottom: 16 }}>
                  <ResponsiveContainer>
                    <BarChart data={topProducts.slice(0, 10)} layout="vertical" margin={{ left: 120 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e9dfd4" />
                      <XAxis type="number" tick={{ fontSize: 11 }} stroke="#b7a894" />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="#b7a894" width={120} />
                      <Tooltip formatter={(value, name) => name === 'revenue' ? formatCurrency(value) : value} />
                      <Bar dataKey="revenue" fill="#111111" radius={[0, 6, 6, 0]} barSize={18} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Product</th>
                        <th>Qty Sold</th>
                        <th>Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topProducts.map((product, idx) => (
                        <tr key={product.name}>
                          <td><strong>{idx + 1}</strong></td>
                          <td>{product.name}</td>
                          <td>{product.quantity}</td>
                          <td><strong>{formatCurrency(product.revenue)}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <p className="admx-empty-text">No sales data available yet.</p>
            )}
          </article>
        </div>
      ) : (
        <p className="admx-empty-text">Loading analytics data...</p>
      )}
    </section>
  );
}

export default AdminAnalyticsSection;
