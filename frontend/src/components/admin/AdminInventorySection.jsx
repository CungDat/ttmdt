import React from 'react';
import { LINE_TYPE_OPTIONS } from '../../pages/admin/adminConstants';

function AdminInventorySection({
  handleBootstrapInventory,
  isBootstrappingInventory,
  inventorySearch,
  setInventorySearch,
  inventoryLineFilter,
  setInventoryLineFilter,
  inventorySortBy,
  setInventorySortBy,
  inventoryWarnings,
  lineTypeLabelMap,
  filteredInventory,
  handleUpdateInventory
}) {
  const totalStock = filteredInventory.reduce((sum, inv) => sum + (inv.quantity || 0), 0);
  const totalReserved = filteredInventory.reduce((sum, inv) => sum + (inv.reserved || 0), 0);
  const totalAvailable = totalStock - totalReserved;
  const lowStockCount = filteredInventory.filter((inv) => inv.quantity < (inv.reorderLevel || 5)).length;

  return (
    <section className="admin-card admx-panel-wrap">
      {/* Summary metrics */}
      <div className="admx-product-metrics" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
        <div className="admx-product-metric">
          <span>Total Stock</span>
          <strong>{totalStock}</strong>
        </div>
        <div className="admx-product-metric">
          <span>Reserved</span>
          <strong>{totalReserved}</strong>
        </div>
        <div className="admx-product-metric">
          <span>Available</span>
          <strong style={totalAvailable < 10 ? { color: '#b45309' } : {}}>{totalAvailable}</strong>
        </div>
        <div className="admx-product-metric">
          <span>Low Stock</span>
          <strong style={lowStockCount > 0 ? { color: '#dc2626' } : {}}>{lowStockCount}</strong>
        </div>
      </div>

      {/* Toolbar */}
      <div className="admx-product-toolbar">
        <button
          type="button"
          className="admin-primary-btn"
          onClick={() => {
            if (window.confirm('Initialize inventory records for all existing products?')) {
              handleBootstrapInventory();
            }
          }}
          disabled={isBootstrappingInventory}
        >
          {isBootstrappingInventory ? 'Initializing...' : 'Initialize inventory from products'}
        </button>
        <input
          className="admin-input"
          placeholder="Search by name, SKU, warehouse location..."
          value={inventorySearch}
          onChange={(e) => setInventorySearch(e.target.value)}
        />
        <select className="admin-select" value={inventoryLineFilter} onChange={(e) => setInventoryLineFilter(e.target.value)}>
          <option value="all">All Collections</option>
          {LINE_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <select className="admin-select" value={inventorySortBy} onChange={(e) => setInventorySortBy(e.target.value)}>
          <option value="low-first">Low stock first</option>
          <option value="high-first">High stock first</option>
          <option value="name-asc">Name A→Z</option>
        </select>
      </div>

      {/* Low stock warnings */}
      {inventoryWarnings.length > 0 ? (
        <>
          <h2 className="admin-section-title">Low Stock Warnings ({inventoryWarnings.length})</h2>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Collection</th>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Stock</th>
                  <th>Reorder Level</th>
                </tr>
              </thead>
              <tbody>
                {inventoryWarnings.map((warn) => (
                  <tr key={warn._id} className="admin-row-warning">
                    <td>{lineTypeLabelMap[warn.lineType] || warn.lineType}</td>
                    <td>{warn.lineName || 'N/A'}</td>
                    <td>{warn.variantId?.sku || 'N/A'}</td>
                    <td><strong style={{ color: '#dc2626' }}>{warn.quantity}</strong></td>
                    <td>{warn.reorderLevel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p className="admx-empty-text" style={{ padding: '12px' }}>No low stock warnings.</p>
      )}

      {/* Full inventory table */}
      <h2 className="admin-section-title">Quick Inventory Update</h2>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Collection</th>
              <th>Product</th>
              <th>SKU</th>
              <th>Total</th>
              <th>Reserved</th>
              <th>Available</th>
              <th>Reorder Level</th>
              <th>Location</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInventory.map((inv) => {
              const available = inv.quantity - (inv.reserved || 0);
              const isLow = inv.quantity < (inv.reorderLevel || 5);
              return (
                <tr key={inv._id} className={isLow ? 'admin-row-warning' : ''}>
                  <td>{lineTypeLabelMap[inv.lineType] || inv.lineType}</td>
                  <td>{inv.lineName || 'N/A'}</td>
                  <td>{inv.variantId?.sku || 'N/A'}</td>
                  <td><strong>{inv.quantity}</strong></td>
                  <td>{inv.reserved || 0}</td>
                  <td style={available <= 0 ? { color: '#dc2626', fontWeight: 700 } : {}}>{available}</td>
                  <td>{inv.reorderLevel}</td>
                  <td>{inv.location || 'Main Warehouse'}</td>
                  <td>
                    <div className="admx-action-stack">
                      <input
                        type="number"
                        className="admin-input-small"
                        defaultValue={inv.quantity}
                        title="Stock Quantity"
                        min="0"
                        onBlur={(e) => {
                          const newVal = Number(e.target.value || 0);
                          if (newVal !== inv.quantity) {
                            handleUpdateInventory(inv._id, { quantity: newVal });
                          }
                        }}
                      />
                      <input
                        type="number"
                        className="admin-input-small"
                        defaultValue={inv.reorderLevel}
                        title="Reorder Level"
                        min="0"
                        onBlur={(e) => {
                          const newVal = Number(e.target.value || 0);
                          if (newVal !== inv.reorderLevel) {
                            handleUpdateInventory(inv._id, { reorderLevel: newVal });
                          }
                        }}
                      />
                      <input
                        type="text"
                        className="admin-input-small"
                        style={{ width: '6rem' }}
                        defaultValue={inv.location || 'Main Warehouse'}
                        title="Warehouse Location"
                        onBlur={(e) => {
                          if (e.target.value !== (inv.location || 'Main Warehouse')) {
                            handleUpdateInventory(inv._id, { location: e.target.value });
                          }
                        }}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredInventory.length === 0 ? (
              <tr>
                <td colSpan={9} className="admx-empty-text">
                  No inventory records. Click "Initialize inventory from products" to generate automatically.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default AdminInventorySection;
