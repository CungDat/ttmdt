import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, Filter, ChevronDown, ChevronUp, X, SlidersHorizontal, Package, Tag, Loader2 } from 'lucide-react';
import axios from 'axios';
import Footer from '../components/Footer';

const LINE_TYPE_LABELS = {
  truesplice: 'True Splice',
  p3: 'P3',
  'poison-maelith': 'Poison Maelith',
  'poison-candy': 'Poison Candy',
  'break-jump': 'Break & Jump',
  limited: 'Limited Edition'
};

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Phù hợp nhất' },
  { value: 'price-asc', label: 'Giá: Thấp → Cao' },
  { value: 'price-desc', label: 'Giá: Cao → Thấp' },
  { value: 'name-asc', label: 'Tên: A → Z' },
  { value: 'name-desc', label: 'Tên: Z → A' }
];

function SearchPage({ onAddToCart, isAuthenticated, onOpenLineDetailPage }) {
  const [query, setQuery] = useState('');
  const [shaft, setShaft] = useState('');
  const [thread, setThread] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [limitedOnly, setLimitedOnly] = useState(false);
  const [lineType, setLineType] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  const [page, setPage] = useState(1);
  const [results, setResults] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [filterMeta, setFilterMeta] = useState({ availableLineTypes: [], priceRange: { min: 0, max: 0 } });

  const fetchResults = useCallback(async (pageNum = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set('q', query.trim());
      if (shaft.trim()) params.set('shaft', shaft.trim());
      if (thread.trim()) params.set('thread', thread.trim());
      if (minPrice) params.set('minPrice', minPrice);
      if (maxPrice) params.set('maxPrice', maxPrice);
      if (inStockOnly) params.set('inStock', 'true');
      if (limitedOnly) params.set('limited', 'true');
      if (lineType) params.set('lineType', lineType);
      if (sortBy) params.set('sortBy', sortBy);
      params.set('page', String(pageNum));
      params.set('limit', '20');

      const res = await axios.get(`http://localhost:5000/api/search?${params.toString()}`);
      setResults(res.data?.results || []);
      setTotalResults(res.data?.totalResults || 0);
      setTotalPages(res.data?.totalPages || 0);
      setFilterMeta(res.data?.filters || { availableLineTypes: [], priceRange: { min: 0, max: 0 } });
      setPage(pageNum);
      setHasSearched(true);
    } catch (err) {
      console.error('Search error:', err);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [query, shaft, thread, minPrice, maxPrice, inStockOnly, limitedOnly, lineType, sortBy]);

  const handleSearch = (e) => {
    e?.preventDefault();
    fetchResults(1);
  };

  const handleClearFilters = () => {
    setQuery('');
    setShaft('');
    setThread('');
    setMinPrice('');
    setMaxPrice('');
    setInStockOnly(false);
    setLimitedOnly(false);
    setLineType('');
    setSortBy('relevance');
    setResults([]);
    setHasSearched(false);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchResults(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (shaft.trim()) count++;
    if (thread.trim()) count++;
    if (minPrice || maxPrice) count++;
    if (inStockOnly) count++;
    if (limitedOnly) count++;
    if (lineType) count++;
    return count;
  }, [shaft, thread, minPrice, maxPrice, inStockOnly, limitedOnly, lineType]);

  return (
    <>
      <main className="search-page-main">
        <div className="search-page-header">
          <h1 className="search-page-title">
            <Search size={28} />
            Tìm kiếm sản phẩm
          </h1>
          <p className="search-page-subtitle">
            Tìm kiếm theo tên, dòng cơ, loại ren, hoặc lọc theo giá và tình trạng hàng
          </p>
        </div>

        {/* Search bar */}
        <form className="search-page-bar" onSubmit={handleSearch}>
          <div className="search-page-input-wrap">
            <Search size={18} className="search-page-input-icon" />
            <input
              type="text"
              className="search-page-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm theo tên sản phẩm, dòng cơ..."
              autoFocus
            />
            {query && (
              <button type="button" className="search-page-clear-input" onClick={() => setQuery('')}>
                <X size={16} />
              </button>
            )}
          </div>
          <button type="submit" className="search-page-submit-btn">
            Tìm kiếm
          </button>
        </form>

        <div className="search-page-layout">
          {/* Filter sidebar */}
          <aside className={`search-filter-sidebar ${filtersOpen ? 'search-filter-sidebar-open' : ''}`}>
            <button
              type="button"
              className="search-filter-toggle"
              onClick={() => setFiltersOpen((prev) => !prev)}
            >
              <SlidersHorizontal size={16} />
              Bộ lọc {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
              {filtersOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {filtersOpen && (
              <div className="search-filter-body">
                {/* Shaft filter */}
                <div className="search-filter-group">
                  <label className="search-filter-label">Dòng cơ (Shaft)</label>
                  <input
                    type="text"
                    className="search-filter-input"
                    value={shaft}
                    onChange={(e) => setShaft(e.target.value)}
                    placeholder="VD: REVO, 314, Z-3..."
                  />
                </div>

                {/* Thread filter */}
                <div className="search-filter-group">
                  <label className="search-filter-label">Loại ren (Joint/Thread)</label>
                  <input
                    type="text"
                    className="search-filter-input"
                    value={thread}
                    onChange={(e) => setThread(e.target.value)}
                    placeholder="VD: Uni-Loc, 3/8x10..."
                  />
                </div>

                {/* Price range */}
                <div className="search-filter-group">
                  <label className="search-filter-label">Khoảng giá ($)</label>
                  <div className="search-filter-price-row">
                    <input
                      type="number"
                      className="search-filter-input search-filter-price-input"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      placeholder="Từ"
                      min="0"
                    />
                    <span className="search-filter-price-sep">—</span>
                    <input
                      type="number"
                      className="search-filter-input search-filter-price-input"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      placeholder="Đến"
                      min="0"
                    />
                  </div>
                </div>

                {/* Line type */}
                <div className="search-filter-group">
                  <label className="search-filter-label">Loại sản phẩm</label>
                  <select
                    className="search-filter-select"
                    value={lineType}
                    onChange={(e) => setLineType(e.target.value)}
                  >
                    <option value="">Tất cả</option>
                    {filterMeta.availableLineTypes.map((lt) => (
                      <option key={lt.value} value={lt.value}>{lt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Toggles */}
                <div className="search-filter-group">
                  <label className="search-filter-checkbox">
                    <input
                      type="checkbox"
                      checked={inStockOnly}
                      onChange={(e) => setInStockOnly(e.target.checked)}
                    />
                    <Package size={14} />
                    Chỉ hiện còn hàng
                  </label>
                </div>

                <div className="search-filter-group">
                  <label className="search-filter-checkbox">
                    <input
                      type="checkbox"
                      checked={limitedOnly}
                      onChange={(e) => setLimitedOnly(e.target.checked)}
                    />
                    <Tag size={14} />
                    Phiên bản giới hạn
                  </label>
                </div>

                {/* Sort */}
                <div className="search-filter-group">
                  <label className="search-filter-label">Sắp xếp</label>
                  <select
                    className="search-filter-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div className="search-filter-actions">
                  <button
                    type="button"
                    className="search-filter-apply-btn"
                    onClick={() => fetchResults(1)}
                  >
                    Áp dụng bộ lọc
                  </button>
                  <button
                    type="button"
                    className="search-filter-clear-btn"
                    onClick={handleClearFilters}
                  >
                    Xóa bộ lọc
                  </button>
                </div>
              </div>
            )}
          </aside>

          {/* Results */}
          <section className="search-results-section">
            {isLoading && (
              <div className="search-results-loading">
                <Loader2 className="search-loading-spinner" size={32} />
                <p>Đang tìm kiếm...</p>
              </div>
            )}

            {!isLoading && hasSearched && results.length === 0 && (
              <div className="search-results-empty">
                <Search size={48} className="search-results-empty-icon" />
                <h3>Không tìm thấy sản phẩm</h3>
                <p>Thử thay đổi từ khóa hoặc bộ lọc để tìm sản phẩm phù hợp.</p>
              </div>
            )}

            {!isLoading && hasSearched && results.length > 0 && (
              <>
                <div className="search-results-info">
                  <span>Tìm thấy <strong>{totalResults}</strong> sản phẩm</span>
                  <span className="search-results-page-info">Trang {page}/{totalPages}</span>
                </div>

                <div className="search-results-grid">
                  {results.map((product) => (
                    <article key={product._id} className="search-result-card">
                      <div className="search-result-image-wrap">
                        <img
                          src={product.image || (product.images && product.images[0]) || ''}
                          alt={product.name}
                          className="search-result-image"
                          loading="lazy"
                        />
                        {product.isLimited && (
                          <span className="search-result-badge-limited">Limited</span>
                        )}
                        <span className="search-result-badge-type">{product.lineLabel}</span>
                      </div>
                      <div className="search-result-body">
                        <h4 className="search-result-name">{product.name}</h4>
                        <p className="search-result-price">
                          {product.currencySymbol || '$'}{Number(product.price || 0).toFixed(2)}
                        </p>
                        <div className="search-result-actions">
                          <button
                            type="button"
                            className="search-result-view-btn"
                            onClick={() => {
                              if (onOpenLineDetailPage) {
                                onOpenLineDetailPage({
                                  ...product,
                                  lineSlug: product._id,
                                  seriesKey: product.lineType
                                });
                              }
                            }}
                          >
                            Xem chi tiết
                          </button>
                          <button
                            type="button"
                            className="search-result-cart-btn"
                            onClick={() => {
                              if (onAddToCart) {
                                onAddToCart({
                                  ...product,
                                  lineSlug: product._id,
                                  seriesTitle: product.lineLabel,
                                  image: product.image || (product.images && product.images[0]) || ''
                                });
                              }
                            }}
                          >
                            + Thêm vào giỏ
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="search-pagination">
                    <button
                      type="button"
                      className="search-pagination-btn"
                      disabled={page <= 1}
                      onClick={() => handlePageChange(page - 1)}
                    >
                      ← Trước
                    </button>
                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 7) {
                        pageNum = i + 1;
                      } else if (page <= 4) {
                        pageNum = i + 1;
                      } else if (page >= totalPages - 3) {
                        pageNum = totalPages - 6 + i;
                      } else {
                        pageNum = page - 3 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          type="button"
                          className={`search-pagination-btn ${pageNum === page ? 'search-pagination-btn-active' : ''}`}
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      className="search-pagination-btn"
                      disabled={page >= totalPages}
                      onClick={() => handlePageChange(page + 1)}
                    >
                      Sau →
                    </button>
                  </div>
                )}
              </>
            )}

            {!isLoading && !hasSearched && (
              <div className="search-results-empty search-results-initial">
                <Filter size={48} className="search-results-empty-icon" />
                <h3>Bắt đầu tìm kiếm</h3>
                <p>Nhập từ khóa hoặc sử dụng bộ lọc bên trái để tìm sản phẩm Predator phù hợp.</p>
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default SearchPage;
