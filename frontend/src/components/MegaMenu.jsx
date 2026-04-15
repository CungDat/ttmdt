import React from 'react';

function MegaMenu({
  activeMenu,
  isSearchOpen,
  navItems,
  getCategoriesByType,
  getMenuSeriesKey,
  openLineSeriesPage
}) {
  const activeType = navItems.find((item) => item.label === activeMenu)?.type;
  const activeCategories = getCategoriesByType(activeType);

  return (
    <div
      className={`mega-menu ${activeMenu ? 'mega-menu-open' : 'mega-menu-closed'}`}
      aria-hidden={!activeMenu || isSearchOpen}
    >
      {activeMenu && !isSearchOpen && activeCategories.length > 0 ? (
        <div className="mega-menu-inner mega-menu-cues-dynamic">
          {activeCategories.map((category) => (
            <div key={category.categoryName}>
              <p className="mega-cues-title">{category.categoryName}</p>
              <ul className="mega-cues-list">
                {category.items.map((item) => {
                  const menuSeriesKey = getMenuSeriesKey(item.name);

                  return (
                    <li key={item.name}>
                      <a
                        href={menuSeriesKey ? `/line/${menuSeriesKey}` : '/'}
                        className="mega-cues-link"
                        onClick={(event) => {
                          if (!menuSeriesKey) {
                            return;
                          }

                          event.preventDefault();
                          openLineSeriesPage(menuSeriesKey);
                        }}
                      >
                        {item.name}
                        {item.badge ? <span className={`badge badge-${item.badge.toLowerCase()}`}>{item.badge}</span> : null}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default MegaMenu;
