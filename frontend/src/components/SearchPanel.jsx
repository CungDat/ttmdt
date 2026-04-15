import React from 'react';
import { Search } from 'lucide-react';

function SearchPanel({
  isSearchOpen,
  searchPanelRef,
  closeSearchPanel,
  searchInputRef,
  searchQuery,
  setSearchQuery,
  handleSearchKeyDown,
  searchResults,
  handleSearchResultSelect
}) {
  return (
    <div
      ref={searchPanelRef}
      className={`search-panel ${isSearchOpen ? 'search-panel-open' : 'search-panel-closed'}`}
      onMouseLeave={() => {
        if (isSearchOpen) {
          closeSearchPanel();
        }
      }}
    >
      <div className="search-panel-inner">
        <div className="search-input-wrap">
          <Search className="search-input-icon" />
          <input
            ref={searchInputRef}
            type="text"
            className="search-input"
            placeholder="Tim kiem tren labbilliard.com"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
        </div>

        <div className="search-results">
          {searchQuery.trim() ? (
            searchResults.length > 0 ? (
              <ul className="search-quick-list" aria-label="Search results">
                {searchResults.map((result) => (
                  <li key={result.id}>
                    <button
                      type="button"
                      className="search-result-button"
                      onClick={() => handleSearchResultSelect(result)}
                    >
                      <div className="search-result-meta">
                        <p className="search-result-title">{result.title}</p>
                        <p className="search-result-subtitle">{result.subtitle}</p>
                      </div>

                      <span className="search-result-type">Product</span>

                      {result.badge ? <span className={`badge badge-${result.badge.toLowerCase()}`}>{result.badge}</span> : null}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="search-results-empty">No suitable products found</div>
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default SearchPanel;
