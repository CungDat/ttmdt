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

function AdminAnalyticsSection({ analytics }) {
  return (
    <section className="admin-card admx-panel-wrap">
      <h2 className="admin-section-title">KPI Dashboard</h2>
      {analytics ? (
        <div className="admin-analytics">
          <div className="admin-analytics-row">
            <div className="admin-analytics-card">
              <p className="admin-analytics-label">Revenue Today</p>
              <p className="admin-analytics-value">${Number(analytics.kpis?.todayRevenue || 0).toFixed(2)}</p>
            </div>
            <div className="admin-analytics-card">
              <p className="admin-analytics-label">Unprocessed New Orders</p>
              <p className="admin-analytics-value">{analytics.kpis?.pendingOrderCount || 0}</p>
            </div>
            <div className="admin-analytics-card">
              <p className="admin-analytics-label">Top Product This Month</p>
              <p className="admin-analytics-value">{analytics.kpis?.topProduct?.name || 'N/A'}</p>
            </div>
          </div>

          <h3 className="admin-section-title">7-Day Revenue Chart</h3>
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
              <LineChart data={analytics.kpis?.weeklyRevenue || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => `$${Number(value || 0).toFixed(2)}`} />
                <Line type="monotone" dataKey="revenue" stroke="#111111" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <h3 className="admin-section-title">Top Selling Products (30 days)</h3>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity Sold</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {analytics.topProducts.map((product) => (
                  <tr key={product.name}>
                    <td>{product.name}</td>
                    <td>{product.quantity}</td>
                    <td>${Number(product.revenue || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default AdminAnalyticsSection;
