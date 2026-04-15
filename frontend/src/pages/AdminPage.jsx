import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

function AdminPage({ currentUser, authToken, onRequireLogin }) {
  const lineTypeOptions = [
    { value: 'truesplice', label: 'True Splice' },
    { value: 'p3', label: 'P3' },
    { value: 'poison-maelith', label: 'Poison Maelith' },
    { value: 'poison-candy', label: 'Poison Candy' },
    { value: 'limited', label: 'Limited Edition' }
  ];

  const [tab, setTab] = useState('products');
  const [productLineTypeTab, setProductLineTypeTab] = useState('truesplice');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  const [productDraft, setProductDraft] = useState({
    lineType: 'truesplice',
    name: '',
    image: '',
    lineSeriesImage: '',
    price: '',
    order: '0',
    isActive: true
  });

  const [editingProductId, setEditingProductId] = useState('');
  const [editingProductDraft, setEditingProductDraft] = useState({
    lineType: 'truesplice',
    name: '',
    image: '',
    lineSeriesImage: '',
    price: '',
    order: '0',
    isActive: true
  });

  const [editingOrderId, setEditingOrderId] = useState('');
  const [editingOrderDraft, setEditingOrderDraft] = useState({
    status: 'pending',
    notes: '',
    assignedWarehouse: 'Main Warehouse',
    tracking: {
      number: '',
      carrier: '',
      currentLocation: ''
    }
  });

  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${authToken}` }), [authToken]);
  const isAdmin = currentUser?.role === 'admin';

  const lineTypeLabelMap = useMemo(
    () => Object.fromEntries(lineTypeOptions.map((item) => [item.value, item.label])),
    [lineTypeOptions]
  );

  const filteredProducts = useMemo(
    () => products.filter((item) => item.lineType === productLineTypeTab),
    [products, productLineTypeTab]
  );

  const productCountByType = useMemo(() => {
    return products.reduce((acc, item) => {
      const key = item.lineType || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }, [products]);

  useEffect(() => {
    setProductDraft((prev) => ({ ...prev, lineType: productLineTypeTab }));
  }, [productLineTypeTab]);

  const loadProducts = async () => {
    const response = await axios.get('http://localhost:5000/api/admin/products', { headers: authHeaders });
    setProducts(Array.isArray(response.data?.products) ? response.data.products : []);
  };

  const loadUsers = async () => {
    const response = await axios.get('http://localhost:5000/api/admin/users', { headers: authHeaders });
    setUsers(Array.isArray(response.data?.users) ? response.data.users : []);
  };

  const loadOrders = async () => {
    const response = await axios.get('http://localhost:5000/api/admin/orders', { headers: authHeaders });
    setOrders(Array.isArray(response.data?.orders) ? response.data.orders : []);
  };

  const loadInventory = async () => {
    const response = await axios.get('http://localhost:5000/api/admin/inventory', { headers: authHeaders });
    setInventory(Array.isArray(response.data?.inventory) ? response.data.inventory : []);
  };

  const loadAnalytics = async () => {
    const [revenueRes, topProductsRes] = await Promise.all([
      axios.get('http://localhost:5000/api/admin/analytics/revenue?days=30', { headers: authHeaders }),
      axios.get('http://localhost:5000/api/admin/analytics/top-products?days=30', { headers: authHeaders })
    ]);

    setAnalytics({
      revenue: revenueRes.data,
      topProducts: topProductsRes.data.topProducts || []
    });
  };

  useEffect(() => {
    if (!authToken || !isAdmin) {
      return;
    }

    const loadTabData = async () => {
      setIsLoading(true);
      setError('');

      try {
        if (tab === 'products') {
          await loadProducts();
        } else if (tab === 'users') {
          await loadUsers();
        } else if (tab === 'inventory') {
          await loadInventory();
        } else if (tab === 'orders') {
          await loadOrders();
        } else if (tab === 'analytics') {
          await loadAnalytics();
        }
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load admin data.');
      } finally {
        setIsLoading(false);
      }
    };

    loadTabData();
  }, [authToken, isAdmin, tab]);

  const handleCreateProduct = async (event) => {
    event.preventDefault();
    setError('');

    try {
      await axios.post(
        'http://localhost:5000/api/admin/products',
        {
          ...productDraft,
          price: Number(productDraft.price || 0),
          order: Number(productDraft.order || 0)
        },
        { headers: authHeaders }
      );

      setProductDraft({
        lineType: productDraft.lineType,
        name: '',
        image: '',
        lineSeriesImage: '',
        price: '',
        order: '0',
        isActive: true
      });
      await loadProducts();
    } catch (err) {
      setError(err?.response?.data?.message || 'Cannot create line item.');
    }
  };

  const beginEditProduct = (product) => {
    setEditingProductId(product._id);
    setEditingProductDraft({
      lineType: product.lineType || 'truesplice',
      name: product.name || '',
      image: product.image || (Array.isArray(product.images) ? (product.images[0] || '') : ''),
      lineSeriesImage: product.lineSeriesImage || '',
      price: String(product.price ?? ''),
      order: String(product.order ?? 0),
      isActive: product.isActive !== false
    });
  };

  const handleSaveProduct = async () => {
    if (!editingProductId) return;

    try {
      await axios.put(
        `http://localhost:5000/api/admin/products/${editingProductId}`,
        {
          ...editingProductDraft,
          price: Number(editingProductDraft.price || 0),
          order: Number(editingProductDraft.order || 0)
        },
        { headers: authHeaders }
      );
      setEditingProductId('');
      await loadProducts();
    } catch (err) {
      setError(err?.response?.data?.message || 'Cannot update line item.');
    }
  };

  const handleDeleteProduct = async (productId, lineType) => {
    try {
      await axios.delete(`http://localhost:5000/api/admin/products/${productId}`, {
        headers: authHeaders,
        params: { lineType }
      });
      await loadProducts();
    } catch (err) {
      setError(err?.response?.data?.message || 'Cannot delete line item.');
    }
  };

  const handleUpdateUserRole = async (userId, role) => {
    try {
      await axios.put(`http://localhost:5000/api/admin/users/${userId}`, { role }, { headers: authHeaders });
      await loadUsers();
    } catch (err) {
      setError(err?.response?.data?.message || 'Cannot update user role.');
    }
  };

  const beginEditOrder = (order) => {
    setEditingOrderId(order._id);
    setEditingOrderDraft({
      status: order.status || 'pending',
      notes: order.notes || '',
      assignedWarehouse: order.assignedWarehouse || 'Main Warehouse',
      tracking: {
        number: order.tracking?.number || '',
        carrier: order.tracking?.carrier || '',
        currentLocation: order.tracking?.currentLocation || ''
      }
    });
  };

  const handleSaveOrder = async () => {
    if (!editingOrderId) return;

    try {
      await axios.put(
        `http://localhost:5000/api/admin/orders/${editingOrderId}`,
        editingOrderDraft,
        { headers: authHeaders }
      );
      setEditingOrderId('');
      await loadOrders();
    } catch (err) {
      setError(err?.response?.data?.message || 'Cannot update order.');
    }
  };

  const handleUpdateInventory = async (inventoryId, newQuantity) => {
    try {
      await axios.put(
        `http://localhost:5000/api/admin/inventory/${inventoryId}`,
        { quantity: Number(newQuantity || 0), inventoryId },
        { headers: authHeaders }
      );
      await loadInventory();
    } catch (err) {
      setError(err?.response?.data?.message || 'Cannot update inventory.');
    }
  };

  if (!currentUser) {
    return (
      <main className="admin-page">
        <section className="admin-empty">
          <h2 className="admin-empty-title">Admin Login Required</h2>
          <p className="admin-empty-text">Please sign in with an admin account to open the dashboard.</p>
          <button type="button" className="admin-primary-btn" onClick={onRequireLogin}>
            Log in
          </button>
        </section>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="admin-page">
        <section className="admin-empty">
          <h2 className="admin-empty-title">No Admin Access</h2>
          <p className="admin-empty-text">This account is not allowed to access admin management.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <section className="admin-shell">
        <header className="admin-head">
          <div>
            <p className="admin-kicker">Lab Billiard</p>
            <h1 className="admin-title">Admin Dashboard</h1>
          </div>
          <div className="admin-tabs" role="tablist" aria-label="Admin sections">
            <button type="button" className={`admin-tab ${tab === 'products' ? 'admin-tab-active' : ''}`} onClick={() => setTab('products')}>Products</button>
            <button type="button" className={`admin-tab ${tab === 'users' ? 'admin-tab-active' : ''}`} onClick={() => setTab('users')}>Users</button>
            <button type="button" className={`admin-tab ${tab === 'inventory' ? 'admin-tab-active' : ''}`} onClick={() => setTab('inventory')}>Inventory</button>
            <button type="button" className={`admin-tab ${tab === 'orders' ? 'admin-tab-active' : ''}`} onClick={() => setTab('orders')}>Orders</button>
            <button type="button" className={`admin-tab ${tab === 'analytics' ? 'admin-tab-active' : ''}`} onClick={() => setTab('analytics')}>Analytics</button>
          </div>
        </header>

        {error ? <p className="admin-error">{error}</p> : null}
        {isLoading ? <p className="admin-loading">Loading...</p> : null}

          {!isLoading && tab === 'products' ? (
            <section className="admin-card">
                <h2 className="admin-section-title">Manage Cue Lines By Collection</h2>
                <div className="admin-tabs" role="tablist" aria-label="Cue line collections">
                  {lineTypeOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`admin-tab ${productLineTypeTab === option.value ? 'admin-tab-active' : ''}`}
                      onClick={() => {
                        setProductLineTypeTab(option.value);
                        setEditingProductId('');
                      }}
                    >
                      {option.label} ({productCountByType[option.value] || 0})
                    </button>
                  ))}
                </div>

                <p className="admin-loading">
                  Adding item to: <strong>{lineTypeLabelMap[productLineTypeTab] || productLineTypeTab}</strong>
                </p>

              <form className="admin-product-form" onSubmit={handleCreateProduct}>
                <input className="admin-input" placeholder="Name" value={productDraft.name} onChange={(e) => setProductDraft((p) => ({ ...p, name: e.target.value }))} required />
                <input className="admin-input" placeholder="Image URL" value={productDraft.image} onChange={(e) => setProductDraft((p) => ({ ...p, image: e.target.value }))} required />
                <input className="admin-input" placeholder="Line Series Image URL" value={productDraft.lineSeriesImage} onChange={(e) => setProductDraft((p) => ({ ...p, lineSeriesImage: e.target.value }))} />
                <input className="admin-input" placeholder="Price" type="number" min="0" value={productDraft.price} onChange={(e) => setProductDraft((p) => ({ ...p, price: e.target.value }))} required />
                <input className="admin-input" placeholder="Order" type="number" min="0" value={productDraft.order} onChange={(e) => setProductDraft((p) => ({ ...p, order: e.target.value }))} />
                <label className="admin-select">
                  <input
                    type="checkbox"
                    checked={productDraft.isActive}
                    onChange={(e) => setProductDraft((p) => ({ ...p, isActive: e.target.checked }))}
                  />
                  {' '}Active
                </label>
                <button type="submit" className="admin-primary-btn">Add Line Item</button>
              </form>

              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Collection</th>
                      <th>Name</th>
                      <th>Price</th>
                      <th>Order</th>
                      <th>Active</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => (
                      <tr key={product._id}>
                        {editingProductId === product._id ? (
                          <>
                            <td>{lineTypeLabelMap[editingProductDraft.lineType] || editingProductDraft.lineType}</td>
                            <td><input className="admin-input" value={editingProductDraft.name} onChange={(e) => setEditingProductDraft((p) => ({ ...p, name: e.target.value }))} /></td>
                            <td><input className="admin-input" type="number" min="0" value={editingProductDraft.price} onChange={(e) => setEditingProductDraft((p) => ({ ...p, price: e.target.value }))} /></td>
                            <td><input className="admin-input" type="number" min="0" value={editingProductDraft.order} onChange={(e) => setEditingProductDraft((p) => ({ ...p, order: e.target.value }))} /></td>
                            <td>
                              <input
                                type="checkbox"
                                checked={editingProductDraft.isActive}
                                onChange={(e) => setEditingProductDraft((p) => ({ ...p, isActive: e.target.checked }))}
                              />
                            </td>
                            <td>
                              <button type="button" className="admin-link-btn" onClick={handleSaveProduct}>Save</button>
                              <button type="button" className="admin-link-btn" onClick={() => setEditingProductId('')}>Cancel</button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td>{lineTypeLabelMap[product.lineType] || product.lineType}</td>
                            <td>{product.name}</td>
                            <td>${Number(product.price || 0).toFixed(2)}</td>
                            <td>{product.order || 0}</td>
                            <td>{product.isActive ? 'Yes' : 'No'}</td>
                            <td>
                              <button type="button" className="admin-link-btn" onClick={() => beginEditProduct(product)}>Edit</button>
                              <button type="button" className="admin-link-btn admin-link-btn-danger" onClick={() => handleDeleteProduct(product._id, product.lineType)}>Delete</button>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={6}>No items in this collection.</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          {!isLoading && tab === 'users' ? (
            <section className="admin-card">
              <h2 className="admin-section-title">Manage Users</h2>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>
                          <select
                            className="admin-select"
                            value={user.role || 'customer'}
                            onChange={(e) => {
                              const role = e.target.value;
                              setUsers((prev) => prev.map((item) => (item.id === user.id ? { ...item, role } : item)));
                            }}
                          >
                            <option value="customer">customer</option>
                            <option value="admin">admin</option>
                          </select>
                        </td>
                        <td>
                          <button type="button" className="admin-link-btn" onClick={() => handleUpdateUserRole(user.id, user.role)}>Save</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          {!isLoading && tab === 'inventory' ? (
            <section className="admin-card">
              <h2 className="admin-section-title">Manage Inventory</h2>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>SKU</th>
                      <th>Product</th>
                      <th>Quantity</th>
                      <th>Reserved</th>
                      <th>Available</th>
                      <th>Reorder Level</th>
                      <th>Location</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.map((inv) => (
                      <tr key={inv._id} className={inv.quantity < inv.reorderLevel ? 'admin-row-warning' : ''}>
                        <td>{inv.variantId?.sku || 'N/A'}</td>
                        <td>{inv.productId?.name || 'N/A'}</td>
                        <td>{inv.quantity}</td>
                        <td>{inv.reserved || 0}</td>
                        <td>{inv.quantity - (inv.reserved || 0)}</td>
                        <td>{inv.reorderLevel}</td>
                        <td>{inv.location}</td>
                        <td>
                          <input
                            type="number"
                            className="admin-input-small"
                            defaultValue={inv.quantity}
                            onBlur={(e) => handleUpdateInventory(inv._id, e.target.value)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          {!isLoading && tab === 'orders' ? (
            <section className="admin-card">
              <h2 className="admin-section-title">Manage Orders</h2>
              <div className="admin-orders-list">
                {orders.map((order) => (
                  <article key={order._id} className={`admin-order-card ${editingOrderId === order._id ? 'admin-order-editing' : ''}`}>
                    <div className="admin-order-head">
                      <p className="admin-order-id">#{String(order._id).slice(-8).toUpperCase()}</p>
                      {editingOrderId === order._id ? (
                        <select className="admin-select" value={editingOrderDraft.status} onChange={(e) => setEditingOrderDraft((p) => ({ ...p, status: e.target.value }))}>
                          <option value="pending">pending</option>
                          <option value="processing">processing</option>
                          <option value="packing">packing</option>
                          <option value="shipped">shipped</option>
                          <option value="in-transit">in-transit</option>
                          <option value="delivered">delivered</option>
                          <option value="cancelled">cancelled</option>
                          <option value="returned">returned</option>
                        </select>
                      ) : (
                        <span className="admin-order-status">{order.status}</span>
                      )}
                    </div>

                    <p className="admin-order-meta">Customer: {order.user?.name || 'Unknown'} ({order.user?.email || 'n/a'})</p>
                    <p className="admin-order-meta">Payment: {order.payment?.method || 'n/a'} {order.payment?.reference ? `• ${order.payment.reference}` : ''}</p>
                    <p className="admin-order-meta">Total: ${Number(order.subtotal || 0).toFixed(2)}</p>

                    {editingOrderId === order._id ? (
                      <div className="admin-order-edit">
                        <input className="admin-input" placeholder="Warehouse" value={editingOrderDraft.assignedWarehouse} onChange={(e) => setEditingOrderDraft((p) => ({ ...p, assignedWarehouse: e.target.value }))} />
                        <input className="admin-input" placeholder="Tracking Number" value={editingOrderDraft.tracking.number} onChange={(e) => setEditingOrderDraft((p) => ({ ...p, tracking: { ...p.tracking, number: e.target.value } }))} />
                        <input className="admin-input" placeholder="Carrier" value={editingOrderDraft.tracking.carrier} onChange={(e) => setEditingOrderDraft((p) => ({ ...p, tracking: { ...p.tracking, carrier: e.target.value } }))} />
                        <input className="admin-input" placeholder="Current Location" value={editingOrderDraft.tracking.currentLocation} onChange={(e) => setEditingOrderDraft((p) => ({ ...p, tracking: { ...p.tracking, currentLocation: e.target.value } }))} />
                        <textarea className="admin-input" placeholder="Notes" value={editingOrderDraft.notes} onChange={(e) => setEditingOrderDraft((p) => ({ ...p, notes: e.target.value }))} />
                        <button type="button" className="admin-link-btn" onClick={handleSaveOrder}>Save</button>
                        <button type="button" className="admin-link-btn" onClick={() => setEditingOrderId('')}>Cancel</button>
                      </div>
                    ) : (
                      <>
                        {order.tracking?.number ? <p className="admin-order-meta">Tracking: {order.tracking.number} ({order.tracking.carrier})</p> : null}
                        {order.tracking?.currentLocation ? <p className="admin-order-meta">Location: {order.tracking.currentLocation}</p> : null}
                        {order.notes ? <p className="admin-order-meta">Notes: {order.notes}</p> : null}
                        <button type="button" className="admin-link-btn" onClick={() => beginEditOrder(order)}>Edit</button>
                      </>
                    )}
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {!isLoading && tab === 'analytics' ? (
            <section className="admin-card">
              <h2 className="admin-section-title">Analytics (Last 30 Days)</h2>
              {analytics ? (
                <div className="admin-analytics">
                  <div className="admin-analytics-row">
                    <div className="admin-analytics-card">
                      <p className="admin-analytics-label">Total Revenue</p>
                      <p className="admin-analytics-value">${Number(analytics.revenue?.totalRevenue || 0).toFixed(2)}</p>
                    </div>
                    <div className="admin-analytics-card">
                      <p className="admin-analytics-label">Total Orders</p>
                      <p className="admin-analytics-value">{analytics.revenue?.orderCount || 0}</p>
                    </div>
                    <div className="admin-analytics-card">
                      <p className="admin-analytics-label">Average Order Value</p>
                      <p className="admin-analytics-value">${Number(analytics.revenue?.averageOrderValue || 0).toFixed(2)}</p>
                    </div>
                  </div>

                  <h3 className="admin-section-title">Top Selling Products</h3>
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

                  <h3 className="admin-section-title">Daily Revenue</h3>
                  <div className="admin-daily-revenue">
                    {Object.entries(analytics.revenue?.dailyRevenue || {}).map(([date, revenue]) => (
                      <div key={date} className="admin-daily-item">
                        <span className="admin-daily-date">{date}</span>
                        <span className="admin-daily-value">${Number(revenue).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </section>
          ) : null}
        </section>
      </main>
    );
  }

export default AdminPage;
