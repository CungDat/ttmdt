import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = 'http://localhost:5000/api/admin/banners';

const POSITION_OPTIONS = [
  { value: 'hero',    label: 'Hero (Homepage Top)', desc: 'Largest banner, shows first' },
  { value: 'mid',     label: 'Mid (Homepage Middle)',         desc: 'Middle banner, after cues section' },
  { value: 'series',  label: 'Series (Product Line Page)', desc: 'Maps to product line seriesKey' },
  { value: 'sidebar', label: 'Sidebar',                       desc: 'Sidebar banner (if layout exists)' },
  { value: 'popup',   label: 'Popup / Promotion',             desc: 'Promotional popup banner' }
];

const POSITION_COLORS = {
  hero: { bg: '#dbeafe', color: '#1d4ed8' },
  mid: { bg: '#f0fdf4', color: '#15803d' },
  series: { bg: '#fef3c7', color: '#b45309' },
  sidebar: { bg: '#f5f3ff', color: '#7c3aed' },
  popup: { bg: '#fce7f3', color: '#be185d' }
};

const emptyDraft = {
  title: '', subtitle: '', image: '', imageMobile: '',
  link: '/', buttonText: 'Shop Now', position: 'hero',
  seriesKey: '', overlayColor: '', textColor: '#ffffff',
  order: 0, startDate: '', endDate: '', isActive: true
};

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US') : '—';

function AdminBannersSection({ authHeaders }) {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [posFilter, setPosFilter] = useState('all');
  const [showForm, setShowForm]   = useState(false);
  const [draft, setDraft]         = useState(emptyDraft);
  const [editingId, setEditingId] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [dragIdx, setDragIdx] = useState(null);

  const showMsg = (msg, isError = false) => {
    if (isError) { setError(msg); setTimeout(() => setError(''), 4000); }
    else { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); }
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = posFilter !== 'all' ? `?position=${posFilter}` : '';
      const { data } = await axios.get(`${API}${params}`, { headers: authHeaders });
      setBanners(data.banners || []);
    } catch (e) {
      showMsg(e?.response?.data?.message || 'Failed to load banners', true);
    } finally {
      setLoading(false);
    }
  }, [authHeaders, posFilter]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!draft.title.trim() || !draft.image.trim()) {
      return showMsg('Title and image URL are required', true);
    }
    try {
      const payload = {
        ...draft,
        order: Number(draft.order),
        startDate: draft.startDate || null,
        endDate: draft.endDate || null
      };
      if (editingId) {
        await axios.put(`${API}/${editingId}`, payload, { headers: authHeaders });
        showMsg('Banner updated successfully!');
      } else {
        await axios.post(API, payload, { headers: authHeaders });
        showMsg('Banner created successfully!');
      }
      setDraft(emptyDraft);
      setEditingId(null);
      setShowForm(false);
      await load();
    } catch (e) {
      showMsg(e?.response?.data?.message || 'Error saving banner', true);
    }
  };

  const handleDelete = async (b) => {
    if (!window.confirm(`Delete banner "${b.title}"?\nThis action cannot be undone.`)) return;
    try {
      await axios.delete(`${API}/${b._id}`, { headers: authHeaders });
      showMsg('Banner deleted');
      await load();
    } catch (e) { showMsg(e?.response?.data?.message || 'Delete error', true); }
  };

  const handleToggle = async (b) => {
    try {
      await axios.put(`${API}/${b._id}`, { isActive: !b.isActive }, { headers: authHeaders });
      showMsg(b.isActive ? 'Banner hidden' : 'Banner enabled');
      await load();
    } catch (e) { showMsg('Update error', true); }
  };

  const beginEdit = (b) => {
    setDraft({
      title: b.title, subtitle: b.subtitle || '', image: b.image,
      imageMobile: b.imageMobile || '', link: b.link || '/',
      buttonText: b.buttonText || '', position: b.position || 'hero',
      seriesKey: b.seriesKey || '', overlayColor: b.overlayColor || '',
      textColor: b.textColor || '#ffffff', order: b.order ?? 0,
      startDate: b.startDate ? b.startDate.slice(0, 10) : '',
      endDate: b.endDate ? b.endDate.slice(0, 10) : '',
      isActive: b.isActive
    });
    setEditingId(b._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Drag & Drop reorder
  const handleDragStart = (i) => setDragIdx(i);
  const handleDrop = async (targetIdx) => {
    if (dragIdx === null || dragIdx === targetIdx) return;
    const reordered = [...banners];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(targetIdx, 0, moved);
    setBanners(reordered);
    setDragIdx(null);
    try {
      await axios.put('http://localhost:5000/api/admin/banners-reorder',
        { items: reordered.map(b => ({ id: b._id })) },
        { headers: authHeaders }
      );
      showMsg('Banner order saved');
    } catch { showMsg('Order save error', true); }
  };

  const filtered = posFilter === 'all' ? banners : banners.filter(b => b.position === posFilter);
  const activeCount = banners.filter(b => b.isActive).length;

  return (
    <section className="admin-card admx-panel-wrap">
      {/* Alerts */}
      {error && <div className="admx-alert admx-alert-error">⚠️ {error}<button className="admx-alert-close" onClick={() => setError('')}>✕</button></div>}
      {success && <div className="admx-alert admx-alert-success">{success}</div>}

      {/* Metrics */}
      <div className="admx-product-metrics">
        <div className="admx-product-metric"><span>Total Banners</span><strong>{banners.length}</strong></div>
        <div className="admx-product-metric"><span>Active</span><strong style={{ color: '#16a34a' }}>{activeCount}</strong></div>
        <div className="admx-product-metric"><span>Hidden</span><strong style={{ color: '#888' }}>{banners.length - activeCount}</strong></div>
        <div className="admx-product-metric">
          <span>Positions</span>
          <strong>{POSITION_OPTIONS.filter(p => banners.some(b => b.position === p.value)).length} / {POSITION_OPTIONS.length}</strong>
        </div>
      </div>

      {/* Toolbar */}
      <div className="admx-product-toolbar">
        <button className="admin-primary-btn" onClick={() => { setDraft(emptyDraft); setEditingId(null); setShowForm(f => !f); }}>
          {showForm ? '✕ Close Form' : '+ Add New Banner'}
        </button>
        <select className="admin-select" value={posFilter} onChange={e => setPosFilter(e.target.value)}>
          <option value="all">All Positions</option>
          {POSITION_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
        <span style={{ fontSize: '12px', color: '#888', alignSelf: 'center' }}>
          Drag and drop rows to reorder
        </span>
      </div>

      {/* CREATE / EDIT FORM */}
      {showForm && (
        <div className="admx-banner-form-wrap">
          <h3 className="admin-section-title">{editingId ? 'Edit Banner' : 'Create New Banner'}</h3>

          {/* Live Preview */}
          {draft.image && (
            <div className="admx-banner-preview-box" style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', marginBottom: '20px', maxHeight: '220px' }}>
              <img src={draft.image} alt="Preview" style={{ width: '100%', height: '220px', objectFit: 'cover', display: 'block' }} onError={e => { e.target.style.display = 'none'; }} />
              {(draft.overlayColor) && <div style={{ position: 'absolute', inset: 0, background: draft.overlayColor }} />}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '24px', color: draft.textColor || '#fff' }}>
                <p style={{ margin: 0, fontSize: '13px', opacity: 0.8, textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>{draft.subtitle}</p>
                <h2 style={{ margin: '6px 0', fontSize: '22px', fontWeight: 800, textShadow: '0 2px 6px rgba(0,0,0,0.5)' }}>{draft.title || 'Banner Title'}</h2>
                {draft.buttonText && <span style={{ display: 'inline-block', background: '#fff', color: '#111', padding: '6px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, marginTop: '8px', width: 'fit-content' }}>{draft.buttonText}</span>}
              </div>
              <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.5)', color: '#fff', padding: '3px 10px', borderRadius: '20px', fontSize: '11px' }}>PREVIEW</div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="admx-voucher-form-grid">
              {/* Col 1 */}
              <div className="admx-form-field" style={{ gridColumn: '1 / -1' }}>
                <label>Banner Image URL *</label>
                <input className="admin-input" placeholder="https://res.cloudinary.com/... or https://..." required
                  value={draft.image} onChange={e => setDraft(p => ({ ...p, image: e.target.value }))} />
              </div>
              <div className="admx-form-field">
                <label>Main Title *</label>
                <input className="admin-input" placeholder="e.g., SUMMER SALE 2025" required
                  value={draft.title} onChange={e => setDraft(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div className="admx-form-field">
                <label>Subtitle</label>
                <input className="admin-input" placeholder="e.g., Up to 30% off Predator cues"
                  value={draft.subtitle} onChange={e => setDraft(p => ({ ...p, subtitle: e.target.value }))} />
              </div>
              <div className="admx-form-field">
                <label>Click Link</label>
                <input className="admin-input" placeholder="/ or /lines/truesplice"
                  value={draft.link} onChange={e => setDraft(p => ({ ...p, link: e.target.value }))} />
              </div>
              <div className="admx-form-field">
                <label>CTA Button Text</label>
                <input className="admin-input" placeholder="e.g., Shop Now, View Details..."
                  value={draft.buttonText} onChange={e => setDraft(p => ({ ...p, buttonText: e.target.value }))} />
              </div>
              <div className="admx-form-field">
                <label>Display Position</label>
                <select className="admin-select" value={draft.position}
                  onChange={e => setDraft(p => ({ ...p, position: e.target.value }))}>
                  {POSITION_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
                {draft.position === 'series' && (
                  <p style={{ fontSize: '11px', color: '#888', margin: '4px 0 0' }}>Enter Series Key below to map to the correct product line</p>
                )}
              </div>
              {draft.position === 'series' && (
                <div className="admx-form-field">
                  <label>Series Key (product line name)</label>
                  <input className="admin-input" placeholder="e.g., true-splice, p3, poison-candy"
                    value={draft.seriesKey} onChange={e => setDraft(p => ({ ...p, seriesKey: e.target.value }))} />
                </div>
              )}
              <div className="admx-form-field">
                <label>Mobile Image URL (optional)</label>
                <input className="admin-input" placeholder="Vertical image for mobile"
                  value={draft.imageMobile} onChange={e => setDraft(p => ({ ...p, imageMobile: e.target.value }))} />
              </div>
              <div className="admx-form-field">
                <label>Overlay Color (rgba or hex)</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input className="admin-input" placeholder="rgba(0,0,0,0.35) or leave empty"
                    value={draft.overlayColor} onChange={e => setDraft(p => ({ ...p, overlayColor: e.target.value }))} />
                </div>
              </div>
              <div className="admx-form-field">
                <label>Title Text Color</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input type="color" value={draft.textColor} onChange={e => setDraft(p => ({ ...p, textColor: e.target.value }))}
                    style={{ width: '40px', height: '36px', border: 'none', borderRadius: '6px', cursor: 'pointer' }} />
                  <input className="admin-input" value={draft.textColor}
                    onChange={e => setDraft(p => ({ ...p, textColor: e.target.value }))} />
                </div>
              </div>
              <div className="admx-form-field">
                <label>Order (lower number = earlier)</label>
                <input className="admin-input" type="number" min="0"
                  value={draft.order} onChange={e => setDraft(p => ({ ...p, order: e.target.value }))} />
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
              <div className="admx-form-field" style={{ justifyContent: 'flex-end', paddingTop: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={draft.isActive} onChange={e => setDraft(p => ({ ...p, isActive: e.target.checked }))} />
                  Enable banner immediately
                </label>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button type="submit" className="admin-primary-btn">{editingId ? 'Update' : '+ Create Banner'}</button>
              <button type="button" className="admin-link-btn" onClick={() => { setShowForm(false); setDraft(emptyDraft); setEditingId(null); }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* BANNER LIST */}
      <h2 className="admin-section-title">Banner List ({loading ? '...' : filtered.length})</h2>

      {/* Card view */}
      <div className="admx-banner-grid">
        {filtered.map((b, idx) => {
          const pos = POSITION_OPTIONS.find(p => p.value === b.position);
          const isExpired = b.endDate && new Date(b.endDate) < new Date();
          return (
            <div
              key={b._id}
              className={`admx-banner-card ${!b.isActive || isExpired ? 'admx-banner-card-dim' : ''}`}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={e => e.preventDefault()}
              onDrop={() => handleDrop(idx)}
            >
              {/* Image preview */}
              <div className="admx-banner-card-img">
                <img src={b.image} alt={b.title} onError={e => { e.target.src = 'https://placehold.co/400x160?text=No+Image'; }} />
                <div className="admx-banner-card-overlay">
                  <span style={{ padding: '3px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, background: POSITION_COLORS[b.position]?.bg, color: POSITION_COLORS[b.position]?.color }}>
                    {pos?.label || b.position}
                  </span>
                </div>
                {!b.isActive && <div className="admx-banner-dim-badge">HIDDEN</div>}
                {isExpired && <div className="admx-banner-dim-badge" style={{ background: '#dc2626' }}>EXPIRED</div>}
              </div>

              {/* Info */}
              <div className="admx-banner-card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <div>
                    <strong style={{ fontSize: '14px', display: 'block' }}>{b.title}</strong>
                    {b.subtitle && <span style={{ fontSize: '12px', color: '#888' }}>{b.subtitle}</span>}
                  </div>
                  <span style={{ fontSize: '12px', color: '#aaa', whiteSpace: 'nowrap' }}>#{b.order}</span>
                </div>
                <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px', fontSize: '11px', color: '#666' }}>
                  {b.link && <span>🔗 {b.link}</span>}
                  {b.buttonText && <span style={{ background: '#f3f4f6', padding: '2px 8px', borderRadius: '4px' }}>{b.buttonText}</span>}
                </div>
                {(b.startDate || b.endDate) && (
                  <div style={{ marginTop: '6px', fontSize: '11px', color: isExpired ? '#dc2626' : '#888' }}>
                    📅 {formatDate(b.startDate)} → {b.endDate ? formatDate(b.endDate) : '∞'}
                    {isExpired && ' Expired'}
                  </div>
                )}
                {b.seriesKey && <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>Series: <code style={{ background: '#f3f4f6', padding: '1px 6px', borderRadius: '3px' }}>{b.seriesKey}</code></div>}
              </div>

              {/* Actions */}
              <div className="admx-banner-card-actions">
                <button className="admin-link-btn" onClick={() => beginEdit(b)}>Edit</button>
                <button className="admin-link-btn" onClick={() => handleToggle(b)} style={{ color: b.isActive ? '#888' : '#16a34a' }}>
                  {b.isActive ? 'Hide' : 'Enable'}
                </button>
                <button className="admin-link-btn admin-link-btn-danger" onClick={() => handleDelete(b)}>Delete</button>
              </div>
            </div>
          );
        })}
        {!loading && filtered.length === 0 && (
          <div style={{ gridColumn: '1/-1', padding: '40px', textAlign: 'center', color: '#aaa' }}>
            No banners yet. Click <strong>"+ Add New Banner"</strong> to begin.
          </div>
        )}
      </div>
    </section>
  );
}

export default AdminBannersSection;
