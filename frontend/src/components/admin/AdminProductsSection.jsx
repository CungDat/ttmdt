import React from 'react';
import { LINE_TYPE_OPTIONS } from '../../pages/admin/adminConstants';

function AdminProductsSection({
  productSummary,
  productsInCurrentLine,
  productInventorySummary,
  productLineTypeTab,
  productCountByType,
  setProductLineTypeTab,
  setEditingProductId,
  setSelectedLineItem,
  setVariants,
  productStatusFilter,
  setProductStatusFilter,
  productSortBy,
  setProductSortBy,
  handleCreateProduct,
  productDraft,
  setProductDraft,
  filteredProducts,
  selectedLineItem,
  editingProductId,
  editingProductDraft,
  setEditingProductDraft,
  lineTypeLabelMap,
  handleSaveProduct,
  activeProductQuickActionId,
  beginEditProduct,
  handleToggleProductActive,
  handleDeleteProduct,
  variantDraft,
  setVariantDraft,
  handleCreateVariant,
  variants,
  inventoryByVariantId,
  editingVariantId,
  editingVariantDraft,
  setEditingVariantDraft,
  handleSaveVariant,
  beginEditVariant,
  handleDeleteVariant
}) {
  return (
    <section className="admin-card admx-panel-wrap">
      <h2 className="admin-section-title">Billiard Product Catalog Management</h2>
      <p className="admin-loading">Manage products by line (True Splice / P3 / Poison / Limited), then manage each variant by shaft, wrap, weight, collar, and SKU.</p>

      <div className="admx-product-metrics">
        <div className="admx-product-metric">
          <span>Total In Line</span>
          <strong>{productSummary.total}</strong>
        </div>
        <div className="admx-product-metric">
          <span>Active</span>
          <strong>{productSummary.active}</strong>
        </div>
        <div className="admx-product-metric">
          <span>Inactive</span>
          <strong>{productSummary.inactive}</strong>
        </div>
        <div className="admx-product-metric">
          <span>Stock In Line</span>
          <strong>
            {productsInCurrentLine.reduce((sum, item) => {
              const summary = productInventorySummary.get(item._id);
              return sum + Number(summary?.available || 0);
            }, 0)}
          </strong>
        </div>
      </div>

      <div className="admin-tabs" role="tablist" aria-label="Cue line collections">
        {LINE_TYPE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`admin-tab ${productLineTypeTab === option.value ? 'admin-tab-active' : ''}`}
            onClick={() => {
              setProductLineTypeTab(option.value);
              setEditingProductId('');
              setSelectedLineItem(null);
              setVariants([]);
            }}
          >
            {option.label} ({productCountByType[option.value] || 0})
          </button>
        ))}
      </div>

      <div className="admx-product-toolbar">
        <select className="admin-select" value={productStatusFilter} onChange={(e) => setProductStatusFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>
        <select className="admin-select" value={productSortBy} onChange={(e) => setProductSortBy(e.target.value)}>
          <option value="order-asc">Sort: Display Order ↑</option>
          <option value="order-desc">Sort: Display Order ↓</option>
          <option value="price-asc">Sort: Base Price ↑</option>
          <option value="price-desc">Sort: Base Price ↓</option>
          <option value="name-asc">Sort: Name A→Z</option>
        </select>
        <button
          type="button"
          className="admin-primary-btn admx-reset-btn"
          onClick={() => {
            setProductStatusFilter('all');
            setProductSortBy('order-asc');
          }}
        >
          Reset View
        </button>
      </div>

      <form className="admin-product-form" onSubmit={handleCreateProduct}>
        <input className="admin-input" placeholder="Cue Line Name (e.g. Predator LE True Splice 16)" value={productDraft.name} onChange={(e) => setProductDraft((p) => ({ ...p, name: e.target.value }))} required />
        <input className="admin-input" placeholder="Image URL" value={productDraft.image} onChange={(e) => setProductDraft((p) => ({ ...p, image: e.target.value }))} required />
        <input className="admin-input" placeholder="Line Series Hero Image URL" value={productDraft.lineSeriesImage} onChange={(e) => setProductDraft((p) => ({ ...p, lineSeriesImage: e.target.value }))} />
        <input className="admin-input" placeholder="Base Price" type="number" min="0" value={productDraft.price} onChange={(e) => setProductDraft((p) => ({ ...p, price: e.target.value }))} required />
        <input className="admin-input" placeholder="Display Order (for storefront)" type="number" min="0" value={productDraft.order} onChange={(e) => setProductDraft((p) => ({ ...p, order: e.target.value }))} />
        <label className="admin-select">
          <input
            type="checkbox"
            checked={productDraft.isActive}
            onChange={(e) => setProductDraft((p) => ({ ...p, isActive: e.target.checked }))}
          />
          {' '}Active
        </label>
        <button type="submit" className="admin-primary-btn">Add Cue Line</button>
      </form>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Model</th>
              <th>Collection</th>
              <th>Base Price</th>
              <th>Display Order</th>
              <th>SKUs</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Variant Setup</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => {
              const stockSummary = productInventorySummary.get(product._id) || { variantCount: 0, available: 0 };

              return (
                <tr key={product._id} className={selectedLineItem?._id === product._id ? 'admin-row-warning' : ''}>
                  {editingProductId === product._id ? (
                    <>
                      <td><input className="admin-input" value={editingProductDraft.name} onChange={(e) => setEditingProductDraft((p) => ({ ...p, name: e.target.value }))} /></td>
                      <td>{lineTypeLabelMap[editingProductDraft.lineType] || editingProductDraft.lineType}</td>
                      <td><input className="admin-input" type="number" min="0" value={editingProductDraft.price} onChange={(e) => setEditingProductDraft((p) => ({ ...p, price: e.target.value }))} /></td>
                      <td><input className="admin-input" type="number" min="0" value={editingProductDraft.order} onChange={(e) => setEditingProductDraft((p) => ({ ...p, order: e.target.value }))} /></td>
                      <td>{stockSummary.variantCount}</td>
                      <td>{stockSummary.available}</td>
                      <td>
                        <input
                          type="checkbox"
                          checked={editingProductDraft.isActive}
                          onChange={(e) => setEditingProductDraft((p) => ({ ...p, isActive: e.target.checked }))}
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="admin-link-btn"
                          onClick={() => {
                            setSelectedLineItem(product);
                            setEditingVariantId('');
                            setVariants([]);
                          }}
                        >
                          Manage Variants
                        </button>
                      </td>
                      <td>
                        <button type="button" className="admin-link-btn" onClick={handleSaveProduct}>Save</button>
                        <button type="button" className="admin-link-btn" onClick={() => setEditingProductId('')}>Cancel</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="admx-product-table-name">
                        <img
                          src={product.image || (Array.isArray(product.images) ? (product.images[0] || '') : '') || 'https://placehold.co/56x56?text=Cue'}
                          alt={product.name}
                          className="admx-product-image"
                        />
                        <div>
                          <strong>{product.name}</strong>
                          <span>#{String(product._id || '').slice(-6).toUpperCase()}</span>
                        </div>
                      </td>
                      <td>{lineTypeLabelMap[product.lineType] || product.lineType}</td>
                      <td>${Number(product.price || 0).toFixed(2)}</td>
                      <td>{product.order || 0}</td>
                      <td>{stockSummary.variantCount}</td>
                      <td>{stockSummary.available}</td>
                      <td>
                        <span className={`admx-status-badge ${product.isActive ? 'admx-status-active' : 'admx-status-inactive'}`}>
                          {product.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="admin-link-btn"
                          onClick={() => {
                            setSelectedLineItem(product);
                            setEditingVariantId('');
                            setVariants([]);
                          }}
                        >
                          Manage Variants
                        </button>
                      </td>
                      <td>
                        <div className="admx-action-stack">
                          <button type="button" className="admin-link-btn" onClick={() => beginEditProduct(product)}>Edit</button>
                          <button
                            type="button"
                            className="admin-link-btn"
                            onClick={() => handleToggleProductActive(product)}
                            disabled={activeProductQuickActionId === product._id}
                          >
                            {activeProductQuickActionId === product._id
                              ? 'Saving...'
                              : product.isActive
                                ? 'Set Inactive'
                                : 'Set Active'}
                          </button>
                          <button type="button" className="admin-link-btn admin-link-btn-danger" onClick={() => handleDeleteProduct(product._id, product.lineType)}>Delete</button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={9}>No cue lines match this filter.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {selectedLineItem ? (
        <section className="admin-card">
          <h3 className="admin-section-title">Variants: {selectedLineItem.name}</h3>
          <p className="admin-loading">Each combination (Shaft + Wrap + Weight + Collar) has its own SKU, price, and inventory level.</p>

          <form className="admin-product-form" onSubmit={handleCreateVariant}>
            <input className="admin-input" placeholder="SKU (e.g. TS16-RED-LW-19)" value={variantDraft.sku} onChange={(e) => setVariantDraft((p) => ({ ...p, sku: e.target.value }))} required />
            <input className="admin-input" placeholder="Shaft (e.g. Revo 12.4)" value={variantDraft.shaft} onChange={(e) => setVariantDraft((p) => ({ ...p, shaft: e.target.value }))} required />
            <input className="admin-input" placeholder="Wrap (e.g. Leather Wrap)" value={variantDraft.wrap} onChange={(e) => setVariantDraft((p) => ({ ...p, wrap: e.target.value }))} required />
            <input className="admin-input" placeholder="Weight (e.g. 19 oz)" value={variantDraft.weight} onChange={(e) => setVariantDraft((p) => ({ ...p, weight: e.target.value }))} required />
            <input className="admin-input" placeholder="Collar / Joint (e.g. Uni-Loc)" value={variantDraft.collar} onChange={(e) => setVariantDraft((p) => ({ ...p, collar: e.target.value }))} required />
            <input className="admin-input" placeholder="Price Adjustment (+/-)" type="number" value={variantDraft.priceAdjustment} onChange={(e) => setVariantDraft((p) => ({ ...p, priceAdjustment: e.target.value }))} />
            <input className="admin-input" placeholder="Initial Stock" type="number" min="0" value={variantDraft.quantity} onChange={(e) => setVariantDraft((p) => ({ ...p, quantity: e.target.value }))} />
            <button type="submit" className="admin-primary-btn">Add SKU Variant</button>
          </form>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Shaft</th>
                  <th>Wrap</th>
                  <th>Weight</th>
                  <th>Collar</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {variants.map((variant) => {
                  const inv = inventoryByVariantId.get(variant._id);
                  const finalPrice = Number(selectedLineItem.price || 0) + Number(variant.priceAdjustment || 0);

                  return (
                    <tr key={variant._id}>
                      {editingVariantId === variant._id ? (
                        <>
                          <td><input className="admin-input" value={editingVariantDraft.sku} onChange={(e) => setEditingVariantDraft((p) => ({ ...p, sku: e.target.value }))} /></td>
                          <td><input className="admin-input" value={editingVariantDraft.shaft} onChange={(e) => setEditingVariantDraft((p) => ({ ...p, shaft: e.target.value }))} /></td>
                          <td><input className="admin-input" value={editingVariantDraft.wrap} onChange={(e) => setEditingVariantDraft((p) => ({ ...p, wrap: e.target.value }))} /></td>
                          <td><input className="admin-input" value={editingVariantDraft.weight} onChange={(e) => setEditingVariantDraft((p) => ({ ...p, weight: e.target.value }))} /></td>
                          <td><input className="admin-input" value={editingVariantDraft.collar} onChange={(e) => setEditingVariantDraft((p) => ({ ...p, collar: e.target.value }))} /></td>
                          <td><input className="admin-input" type="number" value={editingVariantDraft.priceAdjustment} onChange={(e) => setEditingVariantDraft((p) => ({ ...p, priceAdjustment: e.target.value }))} /></td>
                          <td>{inv?.quantity ?? 0}</td>
                          <td>
                            <button type="button" className="admin-link-btn" onClick={handleSaveVariant}>Save</button>
                            <button type="button" className="admin-link-btn" onClick={() => setEditingVariantId('')}>Cancel</button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td>{variant.sku}</td>
                          <td>{variant.shaft}</td>
                          <td>{variant.wrap}</td>
                          <td>{variant.weight}</td>
                          <td>{variant.joint}</td>
                          <td>${finalPrice.toFixed(2)}</td>
                          <td>{inv?.quantity ?? 0}</td>
                          <td>
                            <button type="button" className="admin-link-btn" onClick={() => beginEditVariant(variant)}>Edit</button>
                            <button type="button" className="admin-link-btn admin-link-btn-danger" onClick={() => handleDeleteVariant(variant._id)}>Delete</button>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
                {variants.length === 0 ? (
                  <tr>
                    <td colSpan={8}>No variants yet for this line item.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </section>
  );
}

export default AdminProductsSection;
