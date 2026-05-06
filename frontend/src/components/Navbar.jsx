import React, { useEffect, useRef, useState } from 'react';
import { Search, ShoppingCart, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MegaMenu from './MegaMenu';
import SearchPanel from './SearchPanel';

function Navbar({
  isScrolled,
  activeMenu,
  setActiveMenu,
  isSearchOpen,
  setIsSearchOpen,
  navItems,
  getCategoriesByType,
  getMenuSeriesKey,
  openLineSeriesPage,
  openLineDetailPage,
  resolveMenuLineItem,
  searchPanelRef,
  closeSearchPanel,
  searchInputRef,
  searchQuery,
  setSearchQuery,
  handleSearchKeyDown,
  searchResults,
  handleSearchResultSelect,
  onCartClick,
  cartItemCount,
  onAuthClick,
  currentUser,
  onLogout,
  onViewOrders,
  onOpenAdmin
}) {
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    if (!currentUser) {
      setIsUserMenuOpen(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!isUserMenuOpen) {
      return undefined;
    }

    const handleClickOutside = (event) => {
      if (!userMenuRef.current?.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  const handleLogoClick = () => {
    setActiveMenu(null);
    setIsSearchOpen(false);
    setSearchQuery('');
    navigate('/');
  };

  return (
    <nav
      className={`navbar ${isScrolled ? 'navbar-scrolled' : ''} ${activeMenu ? 'navbar-menu-open' : ''} ${isSearchOpen ? 'navbar-search-open' : ''}`}
      onMouseLeave={() => setActiveMenu(null)}
    >
      <div className="nav-shell">
        <div className="navbar-inner">
          <button
            type="button"
            className="nav-logo-button"
            onClick={handleLogoClick}
            aria-label="Go to homepage"
          >
            <span className="nav-logo">Lab Billiard</span>
          </button>

          <div className="nav-links">
            {navItems.map((item) => (
              <button
                key={item.label}
                type="button"
                className={`nav-link nav-link-trigger ${activeMenu === item.label ? 'nav-link-active' : ''}`}
                onMouseEnter={() => {
                  setIsSearchOpen(false);
                  setActiveMenu(item.label);
                }}
                onFocus={() => {
                  setIsSearchOpen(false);
                  setActiveMenu(item.label);
                }}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="nav-icons">
            <button
              type="button"
              className="nav-icon-button"
              aria-label="Search"
              aria-expanded={isSearchOpen}
              onClick={() => {
                setActiveMenu(null);
                setIsSearchOpen((prev) => !prev);
              }}
            >
              <Search className="nav-icon" />
            </button>
            <button
              type="button"
              className="nav-icon-button nav-icon-button-cart"
              aria-label={`Shopping cart${cartItemCount ? ` (${cartItemCount} items)` : ''}`}
              onClick={onCartClick}
            >
              <ShoppingCart className="nav-icon" />
              {cartItemCount > 0 ? <span className="cart-count-badge">{cartItemCount}</span> : null}
            </button>
            <button
              type="button"
              className="nav-icon-button"
              aria-label={currentUser ? `Signed in as ${currentUser.name}` : 'User'}
              onClick={() => {
                if (!currentUser) {
                  onAuthClick();
                  return;
                }

                setIsUserMenuOpen((prev) => !prev);
              }}
            >
              <User className="nav-icon" />
            </button>

            {currentUser ? (
              <div className={`user-menu-wrap ${isUserMenuOpen ? 'user-menu-wrap-open' : 'user-menu-wrap-closed'}`} ref={userMenuRef}>
                <div className={`user-menu ${isUserMenuOpen ? 'user-menu-open' : 'user-menu-closed'}`}>
                  <p className="user-menu-name">{currentUser.name}</p>
                  <button
                    type="button"
                    className="user-menu-action"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      navigate('/profile');
                    }}
                  >
                    Thông tin cá nhân
                  </button>
                  <button
                    type="button"
                    className="user-menu-action"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onViewOrders();
                    }}
                  >
                    My Orders
                  </button>
                  <button
                    type="button"
                    className="user-menu-action"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      navigate('/search');
                    }}
                  >
                    Tìm kiếm nâng cao
                  </button>
                  {currentUser.role === 'admin' ? (
                    <button
                      type="button"
                      className="user-menu-action"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onOpenAdmin();
                      }}
                    >
                      Admin Dashboard
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="user-menu-logout"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onLogout();
                    }}
                  >
                    Log out
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <MegaMenu
          activeMenu={activeMenu}
          isSearchOpen={isSearchOpen}
          navItems={navItems}
          getCategoriesByType={getCategoriesByType}
          getMenuSeriesKey={getMenuSeriesKey}
          openLineSeriesPage={openLineSeriesPage}
          openLineDetailPage={openLineDetailPage}
          resolveMenuLineItem={resolveMenuLineItem}
        />

        <SearchPanel
          isSearchOpen={isSearchOpen}
          searchPanelRef={searchPanelRef}
          closeSearchPanel={closeSearchPanel}
          searchInputRef={searchInputRef}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          handleSearchKeyDown={handleSearchKeyDown}
          searchResults={searchResults}
          handleSearchResultSelect={handleSearchResultSelect}
        />
      </div>
    </nav>
  );
}

export default Navbar;
