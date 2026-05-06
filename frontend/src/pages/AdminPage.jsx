import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import AdminDashboardSection from '../components/admin/AdminDashboardSection';
import AdminProductsSection from '../components/admin/AdminProductsSection';
import AdminInventorySection from '../components/admin/AdminInventorySection';
import AdminUsersSection from '../components/admin/AdminUsersSection';
import AdminOrdersSection from '../components/admin/AdminOrdersSection';
import AdminAnalyticsSection from '../components/admin/AdminAnalyticsSection';
import { LINE_TYPE_OPTIONS, NEXT_STATUS, STATUS_OPTIONS } from './admin/adminConstants';

function AdminPage({ currentUser, authToken, onRequireLogin }) {
  const [tab, setTab] = useState('dashboard');
  const [productStatusFilter, setProductStatusFilter] = useState('all');
  const [productSortBy, setProductSortBy] = useState('order-asc');
  const [activeProductQuickActionId, setActiveProductQuickActionId] = useState('');
  const [productLineTypeTab, setProductLineTypeTab] = useState('truesplice');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [inventoryWarnings, setInventoryWarnings] = useState([]);
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryLineFilter, setInventoryLineFilter] = useState('all');
  const [inventorySortBy, setInventorySortBy] = useState('low-first');
  const [isBootstrappingInventory, setIsBootstrappingInventory] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [selectedLineItem, setSelectedLineItem] = useState(null);
  const [variants, setVariants] = useState([]);
  const [editingVariantId, setEditingVariantId] = useState('');
  const [editingVariantDraft, setEditingVariantDraft] = useState({
    sku: '',
    shaft: 'Revo',
    collar: 'Uni-Loc',
    weight: '19 oz',
    wrap: 'No Wrap',
    priceAdjustment: '0'
  });

  const [variantDraft, setVariantDraft] = useState({
    sku: '',
    shaft: 'Revo',
    collar: 'Uni-Loc',
    weight: '19 oz',
    wrap: 'No Wrap',
    priceAdjustment: '0',
    quantity: '0'
  });

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
    () => Object.fromEntries(LINE_TYPE_OPTIONS.map((item) => [item.value, item.label])),
    []
  );

  const statusLabelMap = useMemo(
    () => Object.fromEntries(STATUS_OPTIONS.map((item) => [item.value, item.label])),
    []
  );

  const productsInCurrentLine = useMemo(
    () => products.filter((item) => item.lineType === productLineTypeTab),
    [products, productLineTypeTab]
  );

  const filteredProducts = useMemo(() => {
    const result = productsInCurrentLine.filter((item) => {
      const matchesStatus =
        productStatusFilter === 'all'
          ? true
          : productStatusFilter === 'active'
            ? item.isActive !== false
            : item.isActive === false;

      return matchesStatus;
    });

    const sorted = [...result];
    if (productSortBy === 'order-desc') {
      sorted.sort((a, b) => Number(b.order || 0) - Number(a.order || 0));
    } else if (productSortBy === 'price-asc') {
      sorted.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    } else if (productSortBy === 'price-desc') {
      sorted.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    } else if (productSortBy === 'name-asc') {
      sorted.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
    } else {
      sorted.sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
    }

    return sorted;
  }, [productsInCurrentLine, productStatusFilter, productSortBy]);

  const productSummary = useMemo(() => {
    const total = productsInCurrentLine.length;
    const active = productsInCurrentLine.filter((item) => item.isActive !== false).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [productsInCurrentLine]);

  const productCountByType = useMemo(() => {
    return products.reduce((acc, item) => {
      const key = item.lineType || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }, [products]);

  const inventoryByVariantId = useMemo(() => {
    const map = new Map();
    inventory.forEach((item) => {
      if (item.variantId?._id) {
        map.set(item.variantId._id, item);
      }
    });
    return map;
  }, [inventory]);

  const productInventorySummary = useMemo(() => {
    const map = new Map();
    inventory.forEach((item) => {
      const productId = typeof item.productId === 'string' ? item.productId : item.productId?._id;
      if (!productId) {
        return;
      }

      const current = map.get(productId) || { variantCount: 0, quantity: 0, reserved: 0, available: 0 };
      const quantity = Number(item.quantity || 0);
      const reserved = Number(item.reserved || 0);
      const available = quantity - reserved;

      map.set(productId, {
        variantCount: current.variantCount + 1,
        quantity: current.quantity + quantity,
        reserved: current.reserved + reserved,
        available: current.available + available
      });
    });

    return map;
  }, [inventory]);

  const filteredInventory = useMemo(() => {
    const normalizedQuery = String(inventorySearch || '').trim().toLowerCase();

    const filtered = inventory.filter((item) => {
      const matchesLineType = inventoryLineFilter === 'all' ? true : item.lineType === inventoryLineFilter;
      if (!matchesLineType) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const lineName = String(item.lineName || '').toLowerCase();
      const sku = String(item.variantId?.sku || '').toLowerCase();
      const location = String(item.location || '').toLowerCase();
      return lineName.includes(normalizedQuery) || sku.includes(normalizedQuery) || location.includes(normalizedQuery);
    });

    const sorted = [...filtered];
    if (inventorySortBy === 'high-first') {
      sorted.sort((a, b) => Number(b.quantity || 0) - Number(a.quantity || 0));
    } else if (inventorySortBy === 'name-asc') {
      sorted.sort((a, b) => String(a.lineName || '').localeCompare(String(b.lineName || '')));
    } else {
      sorted.sort((a, b) => Number(a.quantity || 0) - Number(b.quantity || 0));
    }

    return sorted;
  }, [inventory, inventoryLineFilter, inventorySearch, inventorySortBy]);

  useEffect(() => {
    setProductDraft((prev) => ({ ...prev, lineType: productLineTypeTab }));
  }, [productLineTypeTab]);

  const loadProducts = async () => {
    const response = await axios.get('http://localhost:5000/api/admin/products', { headers: authHeaders });
    const productList = Array.isArray(response.data?.products) ? response.data.products : [];
    setProducts(productList);

    if (!selectedLineItem) {
      return;
    }

    const updatedSelected = productList.find((item) => item._id === selectedLineItem._id) || null;
    setSelectedLineItem(updatedSelected);
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

  const loadInventoryWarnings = async () => {
    const response = await axios.get('http://localhost:5000/api/admin/inventory/warnings?threshold=2', { headers: authHeaders });
    setInventoryWarnings(Array.isArray(response.data?.warnings) ? response.data.warnings : []);
  };

  const loadVariants = async (lineItem) => {
    if (!lineItem?._id) {
      setVariants([]);
      return;
    }

    const response = await axios.get(`http://localhost:5000/api/admin/products/${lineItem._id}/variants`, {
      headers: authHeaders,
      params: { lineType: lineItem.lineType }
    });

    setVariants(Array.isArray(response.data?.variants) ? response.data.variants : []);
  };

  const loadAnalytics = async () => {
    const [revenueRes, topProductsRes, kpiRes] = await Promise.all([
      axios.get('http://localhost:5000/api/admin/analytics/revenue?days=30', { headers: authHeaders }),
      axios.get('http://localhost:5000/api/admin/analytics/top-products?days=30', { headers: authHeaders }),
      axios.get('http://localhost:5000/api/admin/analytics/kpis', { headers: authHeaders })
    ]);

    setAnalytics({
      revenue: revenueRes.data,
      topProducts: topProductsRes.data.topProducts || [],
      kpis: kpiRes.data || {}
    });
  };

  const loadDashboardData = async () => {
    await Promise.all([
      loadProducts(),
      loadUsers(),
      loadOrders(),
      loadInventoryWarnings(),
      loadAnalytics()
    ]);
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
          await Promise.all([loadProducts(), loadInventory()]);
        } else if (tab === 'dashboard') {
          await loadDashboardData();
        } else if (tab === 'users') {
          await loadUsers();
        } else if (tab === 'inventory') {
          await Promise.all([loadInventory(), loadInventoryWarnings()]);
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

  useEffect(() => {
    if (tab !== 'products' || !selectedLineItem?._id) {
      return;
    }

    const run = async () => {
      try {
        await loadVariants(selectedLineItem);
      } catch (err) {
        setError(err?.response?.data?.message || 'Cannot load variants.');
      }
    };

    run();
  }, [tab, selectedLineItem?._id]);

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
      if (selectedLineItem?._id === productId) {
        setSelectedLineItem(null);
        setVariants([]);
      }
      await loadProducts();
    } catch (err) {
      setError(err?.response?.data?.message || 'Cannot delete line item.');
    }
  };

  const handleToggleProductActive = async (product) => {
    try {
      setActiveProductQuickActionId(product._id);
      await axios.put(
        `http://localhost:5000/api/admin/products/${product._id}`,
        {
          lineType: product.lineType,
          name: product.name,
          image: product.image || (Array.isArray(product.images) ? (product.images[0] || '') : ''),
          lineSeriesImage: product.lineSeriesImage || '',
          price: Number(product.price || 0),
          order: Number(product.order || 0),
          isActive: !(product.isActive !== false)
        },
        { headers: authHeaders }
      );
      await loadProducts();
    } catch (err) {
      setError(err?.response?.data?.message || 'Cannot toggle product status.');
    } finally {
      setActiveProductQuickActionId('');
    }
  };

  const handleCreateVariant = async (event) => {
    event.preventDefault();
    if (!selectedLineItem?._id) {
      setError('Please select a line item before adding variants.');
      return;
    }

    try {
      await axios.post(
        `http://localhost:5000/api/admin/products/${selectedLineItem._id}/variants`,
        {
          lineType: selectedLineItem.lineType,
          sku: variantDraft.sku,
          shaft: variantDraft.shaft,
          collar: variantDraft.collar,
          weight: variantDraft.weight,
          wrap: variantDraft.wrap,
          priceAdjustment: Number(variantDraft.priceAdjustment || 0),
          quantity: Number(variantDraft.quantity || 0),
          reorderLevel: 5
        },
        { headers: authHeaders }
      );

      setVariantDraft({
        sku: '',
        shaft: 'Revo',
        collar: 'Uni-Loc',
        weight: '19 oz',
        wrap: 'No Wrap',
        priceAdjustment: '0',
        quantity: '0'
      });

      await Promise.all([loadVariants(selectedLineItem), loadInventory(), loadInventoryWarnings()]);
    } catch (err) {
      setError(err?.response?.data?.message || 'Cannot create variant.');
    }
  };

  const beginEditVariant = (variant) => {
    setEditingVariantId(variant._id);
    setEditingVariantDraft({
      sku: variant.sku || '',
      shaft: variant.shaft || 'Revo',
      collar: variant.joint || 'Uni-Loc',
      weight: variant.weight || '19 oz',
      wrap: variant.wrap || 'No Wrap',
      priceAdjustment: String(variant.priceAdjustment ?? 0)
    });
  };

  const handleSaveVariant = async () => {
    if (!editingVariantId) {
      return;
    }

    try {
      await axios.put(
        `http://localhost:5000/api/admin/variants/${editingVariantId}`,
        {
          sku: editingVariantDraft.sku,
          shaft: editingVariantDraft.shaft,
          collar: editingVariantDraft.collar,
          weight: editingVariantDraft.weight,
          wrap: editingVariantDraft.wrap,
          priceAdjustment: Number(editingVariantDraft.priceAdjustment || 0)
        },
        { headers: authHeaders }
      );

      setEditingVariantId('');
      await loadVariants(selectedLineItem);
    } catch (err) {
      setError(err?.response?.data?.message || 'Cannot update variant.');
    }
  };

  const handleDeleteVariant = async (variantId) => {
    try {
      await axios.delete(`http://localhost:5000/api/admin/variants/${variantId}`, { headers: authHeaders });
      await Promise.all([loadVariants(selectedLineItem), loadInventory(), loadInventoryWarnings()]);
    } catch (err) {
      setError(err?.response?.data?.message || 'Cannot delete variant.');
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

  const handleMoveOrderToNextStatus = async (order) => {
    const nextStatus = NEXT_STATUS[order.status];
    if (!nextStatus) {
      return;
    }

    try {
      await axios.put(
        `http://localhost:5000/api/admin/orders/${order._id}`,
        {
          status: nextStatus,
          notes: order.notes || '',
          assignedWarehouse: order.assignedWarehouse || 'Main Warehouse',
          tracking: {
            number: order.tracking?.number || '',
            carrier: order.tracking?.carrier || '',
            currentLocation: order.tracking?.currentLocation || ''
          }
        },
        { headers: authHeaders }
      );

      await loadOrders();
    } catch (err) {
      setError(err?.response?.data?.message || 'Cannot update order status.');
    }
  };

  const handleUpdateInventory = async (inventoryId, payload) => {
    try {
      await axios.put(
        `http://localhost:5000/api/admin/inventory/${inventoryId}`,
        { ...payload, inventoryId },
        { headers: authHeaders }
      );
      await Promise.all([loadInventory(), loadInventoryWarnings()]);
    } catch (err) {
      setError(err?.response?.data?.message || 'Cannot update inventory.');
    }
  };

  const handleBootstrapInventory = async () => {
    try {
      setIsBootstrappingInventory(true);
      await axios.post(
        'http://localhost:5000/api/admin/inventory/bootstrap',
        { defaultQuantity: 10, defaultReorderLevel: 5 },
        { headers: authHeaders }
      );

      await Promise.all([loadProducts(), loadInventory(), loadInventoryWarnings()]);
    } catch (err) {
      setError(err?.response?.data?.message || 'Cannot bootstrap inventory.');
    } finally {
      setIsBootstrappingInventory(false);
    }
  };

  const weeklyRevenue = Array.isArray(analytics?.kpis?.weeklyRevenue)
    ? analytics.kpis.weeklyRevenue
    : [];
  const weeklyTotal = useMemo(
    () => weeklyRevenue.reduce((sum, item) => sum + Number(item?.revenue || 0), 0),
    [weeklyRevenue]
  );

  const topCategories = useMemo(() => {
    const source = Array.isArray(analytics?.topProducts) ? analytics.topProducts : [];
    return source.slice(0, 5);
  }, [analytics?.topProducts]);
  const topCategoriesTotal = useMemo(
    () => topCategories.reduce((sum, item) => sum + Number(item?.revenue || 0), 0),
    [topCategories]
  );

  const revenueByDay = useMemo(
    () => {
      const source = Array.isArray(analytics?.revenue?.dailyRevenue)
        ? analytics.revenue.dailyRevenue
        : [];
      return source.reduce((sum, item) => sum + Number(item?.revenue || 0), 0);
    },
    [analytics?.revenue?.dailyRevenue]
  );

  const monthlyTarget = 600000;
  const monthlyProgress = Math.min(100, Math.round((revenueByDay / monthlyTarget) * 100) || 0);

  const orderStatusCounts = useMemo(() => {
    return orders.reduce((acc, order) => {
      const key = order.status || 'pending';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }, [orders]);

  const totalOrders = orders.length;
  const activeUsers = users.filter((user) => user.role !== 'admin').length;

  const categoryDonutStyle = useMemo(() => {
    if (!topCategoriesTotal) {
      return {
        background: 'conic-gradient(#ff8a00 0deg 120deg, #ffd3a6 120deg 240deg, #ffe6cd 240deg 360deg)'
      };
    }

    const palette = ['#ff8a00', '#ffab4d', '#ffc784', '#ffdcb4', '#ffe9d3'];
    let cursor = 0;
    const segments = topCategories.map((item, index) => {
      const ratio = Number(item?.revenue || 0) / topCategoriesTotal;
      const deg = Math.max(6, Math.round(ratio * 360));
      const start = cursor;
      const end = Math.min(360, cursor + deg);
      cursor = end;
      return `${palette[index % palette.length]} ${start}deg ${end}deg`;
    });

    if (cursor < 360) {
      segments.push(`#ffe9d3 ${cursor}deg 360deg`);
    }

    return { background: `conic-gradient(${segments.join(',')})` };
  }, [topCategories, topCategoriesTotal]);

  const tabTitle = {
    dashboard: 'Dashboard',
    products: 'Product Management',
    users: 'Customer Management',
    inventory: 'Inventory Control',
    orders: 'Order Workflow',
    analytics: 'Business Reports'
  }[tab] || 'Dashboard';

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
    <main className="admx-page">
      <section className="admx-layout">
        <aside className="admx-sidebar" aria-label="Admin navigation">
          <div className="admx-brand">Lab Billiard</div>
          <nav className="admx-nav" role="tablist" aria-label="Admin sections">
            <button type="button" className={`admx-nav-btn ${tab === 'dashboard' ? 'admx-nav-btn-active' : ''}`} onClick={() => setTab('dashboard')}>Dashboard</button>
            <button type="button" className={`admx-nav-btn ${tab === 'orders' ? 'admx-nav-btn-active' : ''}`} onClick={() => setTab('orders')}>Orders</button>
            <button type="button" className={`admx-nav-btn ${tab === 'products' ? 'admx-nav-btn-active' : ''}`} onClick={() => setTab('products')}>Products</button>
            <button type="button" className={`admx-nav-btn ${tab === 'users' ? 'admx-nav-btn-active' : ''}`} onClick={() => setTab('users')}>Customers</button>
            <button type="button" className={`admx-nav-btn ${tab === 'inventory' ? 'admx-nav-btn-active' : ''}`} onClick={() => setTab('inventory')}>Inventory</button>
            <button type="button" className={`admx-nav-btn ${tab === 'analytics' ? 'admx-nav-btn-active' : ''}`} onClick={() => setTab('analytics')}>Reports</button>
          </nav>
          <div className="admx-side-foot">
            <p className="admx-side-meta">Admin</p>
            <strong>{currentUser?.name || 'Administrator'}</strong>
          </div>
        </aside>

        <section className="admx-main">
          <header className="admx-topbar">
            <h1 className="admx-title">{tabTitle}</h1>
            <div className="admx-topbar-right">
              <div className="admx-user-chip">
                <span className="admx-user-avatar">{(currentUser?.name || 'A').slice(0, 1).toUpperCase()}</span>
                <span>{currentUser?.name || 'Administrator'}</span>
              </div>
            </div>
          </header>

          {error ? <p className="admin-error">{error}</p> : null}
          {isLoading ? <p className="admin-loading">Loading...</p> : null}

          {!isLoading && tab === 'dashboard' ? (
            <AdminDashboardSection
              weeklyTotal={weeklyTotal}
              totalOrders={totalOrders}
              activeUsers={activeUsers}
              inventoryWarnings={inventoryWarnings}
              weeklyRevenue={weeklyRevenue}
              monthlyProgress={monthlyProgress}
              revenueByDay={revenueByDay}
              monthlyTarget={monthlyTarget}
              categoryDonutStyle={categoryDonutStyle}
              topCategoriesTotal={topCategoriesTotal}
              topCategories={topCategories}
              orderStatusCounts={orderStatusCounts}
            />
          ) : null}

        {!isLoading && tab === 'products' ? (
          <AdminProductsSection
            productSummary={productSummary}
            productsInCurrentLine={productsInCurrentLine}
            productInventorySummary={productInventorySummary}
            productLineTypeTab={productLineTypeTab}
            productCountByType={productCountByType}
            setProductLineTypeTab={setProductLineTypeTab}
            setEditingProductId={setEditingProductId}
            setSelectedLineItem={setSelectedLineItem}
            setVariants={setVariants}
            productStatusFilter={productStatusFilter}
            setProductStatusFilter={setProductStatusFilter}
            productSortBy={productSortBy}
            setProductSortBy={setProductSortBy}
            handleCreateProduct={handleCreateProduct}
            productDraft={productDraft}
            setProductDraft={setProductDraft}
            filteredProducts={filteredProducts}
            selectedLineItem={selectedLineItem}
            editingProductId={editingProductId}
            editingProductDraft={editingProductDraft}
            setEditingProductDraft={setEditingProductDraft}
            lineTypeLabelMap={lineTypeLabelMap}
            handleSaveProduct={handleSaveProduct}
            activeProductQuickActionId={activeProductQuickActionId}
            beginEditProduct={beginEditProduct}
            handleToggleProductActive={handleToggleProductActive}
            handleDeleteProduct={handleDeleteProduct}
            variantDraft={variantDraft}
            setVariantDraft={setVariantDraft}
            handleCreateVariant={handleCreateVariant}
            variants={variants}
            inventoryByVariantId={inventoryByVariantId}
            editingVariantId={editingVariantId}
            editingVariantDraft={editingVariantDraft}
            setEditingVariantDraft={setEditingVariantDraft}
            handleSaveVariant={handleSaveVariant}
            beginEditVariant={beginEditVariant}
            handleDeleteVariant={handleDeleteVariant}
          />
        ) : null}

        {!isLoading && tab === 'users' ? (
          <AdminUsersSection
            users={users}
            setUsers={setUsers}
            handleUpdateUserRole={handleUpdateUserRole}
          />
        ) : null}

        {!isLoading && tab === 'inventory' ? (
          <AdminInventorySection
            handleBootstrapInventory={handleBootstrapInventory}
            isBootstrappingInventory={isBootstrappingInventory}
            inventorySearch={inventorySearch}
            setInventorySearch={setInventorySearch}
            inventoryLineFilter={inventoryLineFilter}
            setInventoryLineFilter={setInventoryLineFilter}
            inventorySortBy={inventorySortBy}
            setInventorySortBy={setInventorySortBy}
            inventoryWarnings={inventoryWarnings}
            lineTypeLabelMap={lineTypeLabelMap}
            filteredInventory={filteredInventory}
            handleUpdateInventory={handleUpdateInventory}
          />
        ) : null}

        {!isLoading && tab === 'orders' ? (
          <AdminOrdersSection
            orders={orders}
            editingOrderId={editingOrderId}
            editingOrderDraft={editingOrderDraft}
            setEditingOrderDraft={setEditingOrderDraft}
            setEditingOrderId={setEditingOrderId}
            statusLabelMap={statusLabelMap}
            beginEditOrder={beginEditOrder}
            handleMoveOrderToNextStatus={handleMoveOrderToNextStatus}
            handleSaveOrder={handleSaveOrder}
          />
        ) : null}

        {!isLoading && tab === 'analytics' ? (
          <AdminAnalyticsSection analytics={analytics} />
        ) : null}
        </section>
      </section>
    </main>
  );
}

export default AdminPage;
