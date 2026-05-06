import React from 'react';

function MegaMenu({
  activeMenu,
  isSearchOpen,
  navItems,
  getCategoriesByType,
  getMenuSeriesKey,
  openLineSeriesPage,
  openLineDetailPage,
  resolveMenuLineItem
}) {
  const activeType = navItems.find((item) => item.label === activeMenu)?.type;
  const activeCategories = getCategoriesByType(activeType);
  const fallbackSeriesByType = {
    shafts: 'shafts',
    cases: 'cases',
    accessories: 'accessories',
    tables: 'tables'
  };

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
                  const resolvedSeriesKey = menuSeriesKey || fallbackSeriesByType[activeType] || null;

                  return (
                    <li key={item.name}>
                      <a
                        href={resolvedSeriesKey ? `/line/${resolvedSeriesKey}` : '/'}
                        className="mega-cues-link"
                        onClick={(event) => {
                          if (!resolvedSeriesKey) {
                            return;
                          }

                          event.preventDefault();
                          openLineSeriesPage(resolvedSeriesKey);
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
