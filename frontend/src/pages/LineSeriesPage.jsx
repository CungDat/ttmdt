import React, { useEffect, useMemo, useState } from 'react';
import { ArrowUp, CheckCircle2 } from 'lucide-react';
import Footer from '../components/Footer';
import { createLineSlug, getPrimaryImage } from '../utils/lineUtils';

const SERIES_COPY = {
  maelith: {
    heading: 'Poison Maelith Series - A Dark Masterpiece Forged From the Shadows.',
    description:
      "Introducing the Poison Maelith pool cues engineered by Predator - dark masterpieces forged from the shadows, designed to strike with deadly precision. Their sleek, vampiric design exudes power and elegance, offering players a cue stick that's as mysterious as it is powerful. Crafted for those who dare to dominate the table, the Maelith delivers unmatched control and accuracy with every shot. Unleash the darkness and embrace the night with the cue of eternal power."
  },
  candy: {
    heading: 'Poison Candy Series - Bright Looks, Precise Hits.',
    description:
      'Poison Candy cues blend playful energy with competition-grade control. Built for players who want standout colorways without compromising feel, each cue gives smooth power transfer and dependable precision for every frame.'
  },
  truesplice: {
    heading: 'TrueSplice Collection - Classic Craft Meets Modern Precision.',
    description:
      'TrueSplice cues preserve the visual soul of traditional craftsmanship while integrating modern low-deflection performance. Every piece is built for players who value premium wood aesthetics and pro-level control at the table.'
  },
  p3: {
    heading: 'Predator P3 Series Pool Cues',
    description:
      'The worlds most advanced shaft, paired with our most advanced cue construction technology. You will never see the game the same way again once you play with P3, it is the most forward-thinking cue we have ever made. Meticulously engineered, obsessively forward-thinking and with unprecedented P3 technology, these pool cues have changed the game forever. Each P3 pool cue can be paired with your choice of our world-renowned low-deflection 314-3, Z-3, Vantage, Centro, or REVO shaft.'
  },
  product: {
    heading: 'Pool Cues - Featured Selection',
    description:
      'Explore our featured pool cues with carefully selected builds for consistency, balance, and control. Choose a setup that matches your game and style.'
  },
  limited: {
    heading: 'Predator Limited Edition Pool Cues',
    description:
      'Like the legend that inspired this cue’s design, some things demand to echo in history. Introducing the return of the Predator LE Gordian Knot. These cues, limited to 125 of each, feature intricate inlays featuring bright abalone contrasting with luxurious Ivorine or our classic Leather Luxe warp. All these elements combined with our trusted C10 construction, make this cue worthy of its namesake. Forever enshrine yourself in history with the LE Gordian Knot. Tradition doesn’t fade. It evolves'
  }
};

const getLineSeriesImage = (line) => {
  if (line?.lineSeriesImage) {
    return line.lineSeriesImage;
  }

  if (line?.seriesImage) {
    return line.seriesImage;
  }

  return getPrimaryImage(line);
};

const normalizeText = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : '');

const SERIES_BANNER_HINTS = {
  maelith: ['maelith'],
  candy: ['candy'],
  truesplice: ['true splice', 'truesplice'],
  p3: ['p3'],
  limited: ['limited edition', 'le']
};

function LineSeriesPage({
  banners = [],
  selectedSeriesKey,
  selectedSeriesItems = [],
  selectedSeriesTitle,
  openLineDetailPage
}) {
  const [showCount, setShowCount] = useState(12);
  const [isAscending, setIsAscending] = useState(true);
  const [sortBy, setSortBy] = useState('position');

  const effectiveSeriesItems = Array.isArray(selectedSeriesItems) ? selectedSeriesItems : [];

  const seriesCopy = SERIES_COPY[selectedSeriesKey] || {
    heading: selectedSeriesTitle,
    description: 'Browse the complete lineup in this collection and open any item to see its dedicated detail page.'
  };

  const selectedBanner = useMemo(() => {
    if (!Array.isArray(banners) || banners.length === 0) {
      return null;
    }

    const normalizedSeriesKey = normalizeText(selectedSeriesKey);
    const bySeriesKey = banners.find((banner) => normalizeText(banner?.seriesKey) === normalizedSeriesKey);
    if (bySeriesKey) {
      return bySeriesKey;
    }

    const titleHints = SERIES_BANNER_HINTS[normalizedSeriesKey] || [];
    if (titleHints.length > 0) {
      const byTitle = banners.find((banner) => {
        const title = normalizeText(banner?.title);
        return titleHints.some((hint) => title.includes(hint));
      });

      if (byTitle) {
        return byTitle;
      }
    }

    return banners[0];
  }, [banners, selectedSeriesKey]);

  const displayedItems = useMemo(() => {
    const getNumber = (value, fallback = 0) => (Number.isFinite(Number(value)) ? Number(value) : fallback);

    const sorted = [...effectiveSeriesItems].sort((left, right) => {
      if (sortBy === 'price-high-to-low') {
        return getNumber(right.price) - getNumber(left.price);
      }

      if (sortBy === 'price-low-to-high') {
        return getNumber(left.price) - getNumber(right.price);
      }

      if (sortBy === 'top-rated') {
        const rightScore = getNumber(right.rating) || getNumber(right.topRatedScore) || 0;
        const leftScore = getNumber(left.rating) || getNumber(left.topRatedScore) || 0;
        return rightScore - leftScore;
      }

      if (sortBy === 'new') {
        const rightNew = right.isNew || right.badge === 'NEW' ? 1 : 0;
        const leftNew = left.isNew || left.badge === 'NEW' ? 1 : 0;
        if (rightNew !== leftNew) {
          return rightNew - leftNew;
        }

        const rightOrder = getNumber(right.order);
        const leftOrder = getNumber(left.order);
        return rightOrder - leftOrder;
      }

      if (sortBy === 'best-sellers') {
        const rightSales = getNumber(right.soldCount) || getNumber(right.salesCount) || 0;
        const leftSales = getNumber(left.soldCount) || getNumber(left.salesCount) || 0;
        return rightSales - leftSales;
      }

      if (sortBy === 'most-viewed') {
        const rightViews = getNumber(right.viewCount) || getNumber(right.views) || 0;
        const leftViews = getNumber(left.viewCount) || getNumber(left.views) || 0;
        return rightViews - leftViews;
      }

      if (sortBy === 'product-name') {
        return left.name.localeCompare(right.name, 'en');
      }

      const leftOrder = Number.isFinite(left.order) ? left.order : 0;
      const rightOrder = Number.isFinite(right.order) ? right.order : 0;

      return isAscending ? leftOrder - rightOrder : rightOrder - leftOrder;
    });

    if (sortBy !== 'position' && !isAscending) {
      sorted.reverse();
    }

    return sorted.slice(0, showCount);
  }, [effectiveSeriesItems, isAscending, showCount, sortBy]);

  return (
    <>
      <main className="line-detail-main">
        {effectiveSeriesItems.length > 0 ? (
          <section className="line-series-simple" aria-label={`${selectedSeriesTitle} list`}>
            <div className="line-series-simple-header">
              <h2 className="line-series-simple-title">{seriesCopy.heading}</h2>
              <p className="line-series-simple-description">{seriesCopy.description}</p>
            </div>
            <section className="line-series-banner-section" id="section-top">
          {selectedBanner && (
            <a href={selectedBanner.link || '/'} className="line-series-banner-link" aria-label={selectedBanner.title}>
              <img
                src={selectedBanner.image}
                alt={selectedBanner.title}
                className="line-series-hero-banner"
                loading="eager"
              />
            </a>
          )}
        </section>
            <div className="line-series-simple-toolbar" role="group" aria-label="Line series controls">
              <div className="line-series-simple-toolbar-left">
                <label className="line-series-simple-label" htmlFor="line-sort-select">Sort By:</label>
                <select
                  id="line-sort-select"
                  className="line-series-simple-select"
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                >
                  <option value="price-high-to-low">Price: High To Low</option>
                  <option value="price-low-to-high">Price: Low To High</option>
                  <option value="top-rated">Top Rated</option>
                  <option value="new">New</option>
                  <option value="best-sellers">Best Sellers</option>
                  <option value="most-viewed">Most Viewed</option>
                  <option value="product-name">Product Name</option>
                  <option value="position">Position</option>
                </select>
                <button
                  type="button"
                  className="line-series-simple-icon-btn"
                  onClick={() => setIsAscending((prev) => !prev)}
                  aria-label="Toggle sort direction"
                >
                  <ArrowUp className={`line-series-simple-sort-arrow ${isAscending ? '' : 'line-series-simple-sort-arrow-desc'}`} />
                </button>
              </div>

              <div className="line-series-simple-toolbar-right">
                <label className="line-series-simple-label" htmlFor="line-show-select">Show:</label>
                <select
                  id="line-show-select"
                  className="line-series-simple-select line-series-simple-select-compact"
                  value={showCount}
                  onChange={(event) => setShowCount(Number(event.target.value))}
                >
                  <option value={12}>12</option>
                  <option value={24}>24</option>
                  <option value={36}>36</option>
                </select>
              </div>
            </div>

            <div className="line-series-simple-list">
              {displayedItems.map((line) => (
                <article key={line.lineSlug} className="line-series-simple-row">
                  <button
                    type="button"
                    className="line-series-simple-image-link"
                    onClick={() => openLineDetailPage(line)}
                  >
                    <img
                      src={getLineSeriesImage(line)}
                      alt={line.name}
                      className="line-series-simple-image"
                      loading="lazy"
                      onError={(event) => {
                        const fallbackSrc = getPrimaryImage(line);

                        if (!fallbackSrc || event.currentTarget.src === fallbackSrc) {
                          return;
                        }

                        event.currentTarget.src = fallbackSrc;
                      }}
                    />
                  </button>

                  <div className="line-series-simple-row-body">
                    <button
                      type="button"
                      className="line-series-simple-row-title"
                      onClick={() => openLineDetailPage(line)}
                    >
                      {line.name}
                    </button>

                    <p className="line-series-simple-row-price">
                      {line.currencySymbol || '$'}{Number(line.price || 0).toFixed(2)}
                    </p>

                    <div className="line-series-simple-row-actions">
                      <span className="line-series-simple-stock">
                        <CheckCircle2 className="line-series-simple-stock-icon" />
                        In Stock
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : (
          <section className="line-detail-empty" aria-label="Line not found">
            <h2 className="line-detail-empty-title">Product line not found</h2>
            <p className="line-detail-empty-text">
              The selected line may be unavailable. Please return to the homepage and choose another item.
            </p>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}

export default LineSeriesPage;
