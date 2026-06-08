import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = 'http://localhost:5000/api/vouchers';

const VOUCHER_TYPE_LABELS = {
  percent: '% Percentage',
  fixed: 'Fixed Amount',
  freeship: 'Free Shipping'
};

const TYPE_COLORS = {
  percent: { bg: '#eff6ff', color: '#1d4ed8' },
  fixed: { bg: '#f0fdf4', color: '#16a34a' },
  freeship: { bg: '#fff7ed', color: '#c2410c' }
};

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const emptyDraft = {
  code: '', description: '', type: 'percent', value: 10,
  minOrderValue: 0, maxDiscount: 0, usageLimit: 0, perUserLimit: 1,
  startDate: '', endDate: '', isActive: true
};

function AdminVouchersSection({ authHeaders }) {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [editingId, setEditingId] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  const loadVouchers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 50, search });
      if (filterActive !== 'all') params.set('isActive', filterActive);
      const { data } = await axios.get(`${API}?${params}`, { headers: authHeaders });
      setVouchers(data.vouchers || []);
      setTotalCount(data.total || 0);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load vouchers');
    } finally {
      setLoading(false);
    }
  }, [authHeaders, search, filterActive]);

  useEffect(() => { loadVouchers(); }, [loadVouchers]);

  const showMsg = (msg, isError = false) => {
    if (isError) { setError(msg); setTimeout(() => setError(''), 4000); }
    else { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...draft,
        code: draft.code.toUpperCase().trim(),
        value: Number(draft.value),
        minOrderValue: Number(draft.minOrderValue),
        maxDiscount: Number(draft.maxDiscount),
        usageLimit: Number(draft.usageLimit),
        perUserLimit: Number(draft.perUserLimit),
        startDate: draft.startDate || null,
        endDate: draft.endDate || null
      };

      if (editingId) {
        await axios.put(`${API}/${editingId}`, payload, { headers: authHeaders });
        showMsg('Voucher updated successfully!');
      } else {
        await axios.post(API, payload, { headers: authHeaders });
        showMsg('Voucher created successfully!');
      }
      setDraft(emptyDraft);
      setEditingId(null);
      setShowForm(false);
      await loadVouchers();
    } catch (e) {
      showMsg(e?.response?.data?.message || 'Error saving voucher', true);
    }
  };

  const handleToggleActive = async (voucher) => {
    try {
      await axios.put(`${API}/${voucher._id}`, { isActive: !voucher.isActive }, { headers: authHeaders });
      showMsg(voucher.isActive ? 'Voucher deactivated' : 'Voucher activated');
      await loadVouchers();
    } catch (e) {
      showMsg(e?.response?.data?.message || 'Update error', true);
    }
  };

  const handleDelete = async (voucher) => {
    if (!window.confirm(`Delete voucher "${voucher.code}"? This action cannot be undone.`)) return;
    try {
      await axios.delete(`${API}/${voucher._id}`, { headers: authHeaders });
      showMsg('Voucher deleted');
      await loadVouchers();
    } catch (e) {
      showMsg(e?.response?.data?.message || 'Delete error', true);
    }
  };

  const handleResetUsage = async (voucher) => {
    if (!window.confirm(`Reset usage count of "${voucher.code}" to 0?`)) return;
    try {
      await axios.post(`${API}/${voucher._id}/reset-usage`, {}, { headers: authHeaders });
      showMsg('Usage count reset');
      await loadVouchers();
    } catch (e) {
      showMsg(e?.response?.data?.message || 'Reset error', true);
    }
  };

  const beginEdit = (v) => {
    setDraft({
      code: v.code, description: v.description || '', type: v.type, value: v.value,
      minOrderValue: v.minOrderValue || 0, maxDiscount: v.maxDiscount || 0,
      usageLimit: v.usageLimit || 0, perUserLimit: v.perUserLimit || 1,
      startDate: v.startDate ? v.startDate.slice(0, 10) : '',
      endDate: v.endDate ? v.endDate.slice(0, 10) : '',
      isActive: v.isActive
    });
    setEditingId(v._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeCount = vouchers.filter(v => v.isActive).length;
  const expiredCount = vouchers.filter(v => v.endDate && new Date(v.endDate) < new Date()).length;

  return (
    <section className="admin-card admx-panel-wrap">
      {/* Alerts */}
      {error && (
        <div className="admx-alert admx-alert-error">
          {error}
          <button onClick={() => setError('')} className="admx-alert-close">✕</button>
        </div>
      )}
      {success && (
        <div className="admx-alert admx-alert-success">{success}</div>
      )}

      {/* Metrics */}
      <div className="admx-product-metrics">
        <div className="admx-product-metric">
          <span>Total Vouchers</span>
          <strong>{totalCount}</strong>
        </div>
        <div className="admx-product-metric">
          <span>Active</span>
          <strong style={{ color: '#16a34a' }}>{activeCount}</strong>
        </div>
        <div className="admx-product-metric">
          <span>Expired</span>
          <strong style={{ color: expiredCount > 0 ? '#dc2626' : undefined }}>{expiredCount}</strong>
        </div>
        <div className="admx-product-metric">
          <span>Inactive</span>
          <strong style={{ color: '#888' }}>{vouchers.filter(v => !v.isActive).length}</strong>
        </div>
      </div>

      {/* Toolbar */}
      <div className="admx-product-toolbar">
        <button className="admin-primary-btn" onClick={() => { setDraft(emptyDraft); setEditingId(null); setShowForm(f => !f); }}>
          {showForm ? '✕ Close Form' : '+ Create New Voucher'}
        </button>
        <input className="admin-input" placeholder="Search voucher code..." value={search}
          onChange={e => setSearch(e.target.value)} />
        <select className="admin-select" value={filterActive} onChange={e => setFilterActive(e.target.value)}>
          <option value="all">All</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <form className="admx-voucher-form" onSubmit={handleSubmit}>
          <h3 className="admin-section-title" style={{ marginBottom: '16px' }}>
            {editingId ? 'Edit Voucher' : 'Create New Voucher'}
          </h3>
          <div className="admx-voucher-form-grid">
            <div className="admx-form-field">
              <label>Voucher Code *</label>
              <input className="admin-input" placeholder="e.g., SUMMER30" required
                value={draft.code} disabled={!!editingId}
                onChange={e => setDraft(p => ({ ...p, code: e.target.value.toUpperCase() }))} />
            </div>
            <div className="admx-form-field">
              <label>Discount Type *</label>
              <select className="admin-select" value={draft.type}
                onChange={e => setDraft(p => ({ ...p, type: e.target.value }))}>
                {Object.entries(VOUCHER_TYPE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            {draft.type !== 'freeship' && (
              <div className="admx-form-field">
                <label>{draft.type === 'percent' ? 'Percentage (%)' : 'Discount Amount ($)'}</label>
                <input className="admin-input" type="number" min="0"
                  value={draft.value} onChange={e => setDraft(p => ({ ...p, value: e.target.value }))} />
              </div>
            )}
            <div className="admx-form-field">
              <label>Min Order Value ($)</label>
              <input className="admin-input" type="number" min="0"
                value={draft.minOrderValue} onChange={e => setDraft(p => ({ ...p, minOrderValue: e.target.value }))} />
            </div>
            {draft.type === 'percent' && (
              <div className="admx-form-field">
                <label>Max Discount ($, 0 = unlimited)</label>
                <input className="admin-input" type="number" min="0"
                  value={draft.maxDiscount} onChange={e => setDraft(p => ({ ...p, maxDiscount: e.target.value }))} />
              </div>
            )}
            <div className="admx-form-field">
              <label>Total Usage Limit (0 = unlimited)</label>
              <input className="admin-input" type="number" min="0"
                value={draft.usageLimit} onChange={e => setDraft(p => ({ ...p, usageLimit: e.target.value }))} />
            </div>
            <div className="admx-form-field">
              <label>Limit per user (0 = unlimited)</label>
              <input className="admin-input" type="number" min="0"
                value={draft.perUserLimit} onChange={e => setDraft(p => ({ ...p, perUserLimit: e.target.value }))} />
            </div>
            <div className="admx-form-field">
              <label>Start Date</label>
              <input className="admin-input" type="date"
                value={draft.startDate} onChange={e => setDraft(p => ({ ...p, startDate: e.target.value }))} />
            </div>
            <div className="admx-form-field">
              <label>End Date</label>
              <input className="admin-input" type="date"
                value={draft.endDate} onChange={e => setDraft(p => ({ ...p, endDate: e.target.value }))} />
            </div>
            <div className="admx-form-field" style={{ gridColumn: '1 / -1' }}>
              <label>Description shown to customer</label>
              <input className="admin-input" placeholder="e.g., 30% off summer sale"
                value={draft.description} onChange={e => setDraft(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="admx-form-field" style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input type="checkbox" id="voucher-active" checked={draft.isActive}
                onChange={e => setDraft(p => ({ ...p, isActive: e.target.checked }))} />
              <label htmlFor="voucher-active">Activate immediately</label>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <button type="submit" className="admin-primary-btn">
              {editingId ? 'Update' : 'Create Voucher'}
            </button>
            <button type="button" className="admin-link-btn"
              onClick={() => { setShowForm(false); setDraft(emptyDraft); setEditingId(null); }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Table */}
      <h2 className="admin-section-title">Voucher List ({loading ? '...' : totalCount})</h2>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Type</th>
              <th>Value</th>
              <th>Min Order</th>
              <th>Used / Limit</th>
              <th>Validity</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {vouchers.map(v => {
              const isExpired = v.endDate && new Date(v.endDate) < new Date();
              const usageRatio = v.usageLimit > 0 ? v.usedCount / v.usageLimit : 0;
              return (
                <tr key={v._id} style={isExpired ? { opacity: 0.6 } : {}}>
                  <td>
                    <code style={{
                      background: TYPE_COLORS[v.type]?.bg, color: TYPE_COLORS[v.type]?.color,
                      padding: '3px 10px', borderRadius: '6px', fontWeight: 700, fontSize: '13px'
                    }}>{v.code}</code>
                    {v.description && <div style={{ fontSize: '11px', color: '#888', marginTop: '3px' }}>{v.description}</div>}
                  </td>
                  <td>
                    <span style={{
                      padding: '2px 8px', borderRadius: '4px', fontSize: '12px',
                      background: TYPE_COLORS[v.type]?.bg, color: TYPE_COLORS[v.type]?.color
                    }}>{VOUCHER_TYPE_LABELS[v.type]}</span>
                  </td>
                  <td style={{ fontWeight: 700 }}>
                    {v.type === 'percent' && `${v.value}%`}
                    {v.type === 'fixed' && `$${Number(v.value).toFixed(2)}`}
                    {v.type === 'freeship' && 'Free Shipping'}
                    {v.type === 'percent' && v.maxDiscount > 0 && (
                      <div style={{ fontSize: '11px', color: '#888' }}>Max ${Number(v.maxDiscount).toFixed(2)}</div>
                    )}
                  </td>
                  <td>{v.minOrderValue > 0 ? `$${Number(v.minOrderValue).toFixed(2)}` : '—'}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>
                        {v.usedCount} / {v.usageLimit > 0 ? v.usageLimit : '∞'}
                      </span>
                      {v.usageLimit > 0 && (
                        <div style={{ width: '60px', height: '6px', background: '#eee', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(100, usageRatio * 100)}%`, height: '100%', background: usageRatio >= 1 ? '#dc2626' : '#16a34a', borderRadius: '3px' }} />
                        </div>
                      )}
                    </div>
                  </td>
                  <td style={{ fontSize: '12px' }}>
                    {v.startDate ? formatDate(v.startDate) : '—'}
                    <br />
                    {v.endDate ? (
                      <span style={{ color: isExpired ? '#dc2626' : '#888' }}>
                        → {formatDate(v.endDate)} {isExpired && 'Expired'}
                      </span>
                    ) : '→ ∞'}
                  </td>
                  <td>
                    <span className="admin-order-status-badge" style={{
                      background: v.isActive && !isExpired ? '#dcfce7' : '#fee2e2',
                      color: v.isActive && !isExpired ? '#166534' : '#991b1b'
                    }}>
                      {v.isActive && !isExpired ? 'Active' : isExpired ? 'Expired' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="admx-action-stack">
                      <button className="admin-link-btn" onClick={() => beginEdit(v)}>Edit</button>
                      <button className="admin-link-btn" onClick={() => handleToggleActive(v)}>
                        {v.isActive ? 'Disable' : 'Enable'}
                      </button>
                      <button className="admin-link-btn" onClick={() => handleResetUsage(v)} title="Reset Usage">↺ Reset</button>
                      <button className="admin-link-btn admin-link-btn-danger" onClick={() => handleDelete(v)}>Delete</button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!loading && vouchers.length === 0 && (
              <tr><td colSpan={8} className="admx-empty-text">No vouchers found. Click "+ Create New Voucher" to begin.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default AdminVouchersSection;
