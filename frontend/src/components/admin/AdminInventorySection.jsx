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
  return (
    <section className="admin-card admx-panel-wrap">
      <div className="admx-product-toolbar">
        <button
          type="button"
          className="admin-primary-btn"
          onClick={handleBootstrapInventory}
          disabled={isBootstrappingInventory}
        >
          {isBootstrappingInventory ? 'Initializing...' : 'Initialize Inventory From Existing Lines'}
        </button>
        <input
          className="admin-input"
          placeholder="Search by line name / SKU / location"
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
          <option value="low-first">Sort: Low stock first</option>
          <option value="high-first">Sort: High stock first</option>
          <option value="name-asc">Sort: Name A→Z</option>
        </select>
      </div>

      <h2 className="admin-section-title">Inventory Alerts (Below 2)</h2>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Collection</th>
              <th>Line</th>
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
                <td>{warn.quantity}</td>
                <td>{warn.reorderLevel}</td>
              </tr>
            ))}
            {inventoryWarnings.length === 0 ? (
              <tr>
                <td colSpan={5}>No low-stock alerts.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <h2 className="admin-section-title">Quick Inventory Update</h2>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Collection</th>
              <th>Line</th>
              <th>SKU</th>
              <th>Quantity</th>
              <th>Reserved</th>
              <th>Available</th>
              <th>Reorder Level</th>
              <th>Location</th>
              <th>Quick Edit</th>
            </tr>
          </thead>
          <tbody>
            {filteredInventory.map((inv) => (
              <tr key={inv._id} className={inv.quantity < 2 ? 'admin-row-warning' : ''}>
                <td>{lineTypeLabelMap[inv.lineType] || inv.lineType}</td>
                <td>{inv.lineName || 'N/A'}</td>
                <td>{inv.variantId?.sku || 'N/A'}</td>
                <td>{inv.quantity}</td>
                <td>{inv.reserved || 0}</td>
                <td>{inv.quantity - (inv.reserved || 0)}</td>
                <td>{inv.reorderLevel}</td>
                <td>{inv.location}</td>
                <td>
                  <div className="admx-action-stack">
                    <input
                      type="number"
                      className="admin-input-small"
                      defaultValue={inv.quantity}
                      onBlur={(e) => handleUpdateInventory(inv._id, { quantity: Number(e.target.value || 0) })}
                    />
                    <input
                      type="number"
                      className="admin-input-small"
                      defaultValue={inv.reorderLevel}
                      onBlur={(e) => handleUpdateInventory(inv._id, { reorderLevel: Number(e.target.value || 0) })}
                    />
                    <input
                      type="text"
                      className="admin-input-small"
                      defaultValue={inv.location || 'Main Warehouse'}
                      onBlur={(e) => handleUpdateInventory(inv._id, { location: e.target.value })}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {filteredInventory.length === 0 ? (
              <tr>
                <td colSpan={9}>No inventory rows found. Use "Initialize Inventory From Existing Lines" to generate stock records.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default AdminInventorySection;
