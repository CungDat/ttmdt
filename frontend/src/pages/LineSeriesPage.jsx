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
      'Like the legend that inspired this cue\'s design, some things demand to echo in history. Introducing the return of the Predator LE Gordian Knot. These cues, limited to 125 of each, feature intricate inlays featuring bright abalone contrasting with luxurious Ivorine or our classic Leather Luxe warp. All these elements combined with our trusted C10 construction, make this cue worthy of its namesake. Forever enshrine yourself in history with the LE Gordian Knot. Tradition doesn\'t fade. It evolves'
  },
  breakjump: {
    heading: 'Break & Jump Cues - Power And Precision Under Pressure.',
    description:
      'From explosive breaks to controlled jump shots, this lineup focuses on fast energy transfer, stable balance, and repeatable accuracy for critical moments.'
  },
  'bk-rush-break': {
    heading: 'BK RUSH Break Cues - Explosive Breaking Power.',
    description:
      'The BK Rush Break Cue delivers more power with less effort. Paired with the Revo BK-R carbon fiber shaft, it provides seamless energy transfer for explosive breaks.'
  },
  'bk-rush-jump-break': {
    heading: 'BK RUSH Jump/Break Cues - Power And Convenience Together.',
    description:
      'The BK Rush Plus combines break and jump capabilities in one cue. With interchangeable forearm and handle, switch between powerful breaks and precise jump shots.'
  },
  'poison-vx-break-jump': {
    heading: 'Poison VX Break & Jump Cues - Drive Through The Rack.',
    description:
      'The Poison VX series with Venom carbon fiber shaft delivers explosive power and precision. Featuring Radial joint for balance and phenolic tip for maximum speed.'
  },
  'bk4-break': {
    heading: 'BK4 Break Cues - Criminally Powerful.',
    description:
      'A lethal mix of speed, accuracy, and explosive power. The BK4 features Vault-Plate construction and KTRL break tip for maximum speed, durability and control.'
  },
  'air-rush-jump': {
    heading: 'AIR RUSH Jump Cues - Soar To Victory.',
    description:
      'The Air Rush jump cue features innovative extended handles for effortless flight and precision landings. Paired with Air REVO carbon fiber shaft for ultimate jumping power and accuracy.'
  },
  'air-ii-jump': {
    heading: 'AIR II Jump Cues - Your Get Out Of Jail Free Card.',
    description:
      'The Predator Air II Jump Cue is designed to get you out of those tricky spots, no matter how you got there. Flexibility and accuracy for your next great escape.'
  },
  allcues: {
    heading: 'All Pool Cues - The Complete Collection.',
    description:
      'Browse every pool cue in our catalog — from classic TrueSplice craftsmanship and Predator P3 precision to Poison Maelith darkness and Candy vibrancy. Find the perfect cue that matches your style and game.'
  },
  // ─── Shaft sub-categories ───
  shafts: {
    heading: 'Pool Cue Shafts - Low-Deflection Performance.',
    description:
      'Since the launch of its original 314 shaft in 1994, Predator has been recognized for innovating and producing the best low-deflection pool cue shafts. From REVO carbon fiber to classic maple Z-3 and Vantage, find the shaft that matches your game.'
  },
  'shafts-revo': {
    heading: 'REVO Carbon Fiber Shafts - The Future Of Performance.',
    description:
      'REVO shafts feature proprietary carbon fiber construction for unmatched consistency, low deflection, and a feel that has redefined what a shaft can do. Available in 11.8mm, 12.4mm, and 12.9mm for every playing style.'
  },
  'shafts-centro': {
    heading: 'Centro Hybrid Shafts - Best Of Both Worlds.',
    description:
      'The Centro Hybrid shaft combines the natural feel of maple with carbon fiber technology. A perfect bridge between traditional wood and modern performance.'
  },
  'shafts-314': {
    heading: '314-3 Shafts - The Industry Standard.',
    description:
      'The 314-3 shaft has been the benchmark for low-deflection maple shafts. With 12.75mm diameter and proprietary construction, it delivers consistent accuracy shot after shot.'
  },
  'shafts-z3': {
    heading: 'Z-3 Shafts - Precision Engineered.',
    description:
      'The Z-3 shaft features 11.85mm diameter with advanced low-deflection technology. Built for players who demand maximum accuracy with a thinner profile.'
  },
  'shafts-vantage': {
    heading: 'Vantage Shafts - Classic Control.',
    description:
      'The Vantage shaft with 12.9mm diameter offers the feel of a traditional shaft with modern low-deflection benefits. Ideal for players transitioning from standard shafts.'
  },
  'shafts-bk2': {
    heading: 'BK2 Break Shafts - Built For Power.',
    description:
      'BK2 Break shafts are designed specifically for breaking, delivering maximum power transfer and durability for explosive opening shots.'
  },
  'shafts-carbon': {
    heading: 'Carbon Fiber Shafts - Advanced Technology.',
    description:
      'Our carbon fiber shaft collection featuring REVO technology — the most advanced shafts in the game. Unmatched consistency, zero moisture absorption, and incredible low deflection.'
  },
  'shafts-maple': {
    heading: 'Maple Wood Shafts - Traditional Excellence.',
    description:
      'Premium maple wood shafts including 314-3, Z-3, Vantage, and Centro. Each built with proprietary construction for low deflection and natural wood feel.'
  },
  // ─── Case sub-categories ───
  cases: {
    heading: 'Cue Cases - Protect Your Investment.',
    description:
      'Premium cue cases designed to protect your cues during travel and storage. From hard cases with heavy-duty protection to soft cases for everyday carry, find the perfect case for your collection.'
  },
  'cases-legacy': {
    heading: 'Legacy Cue Cases - Premium Leather Luxury.',
    description:
      'The Legacy collection features premium leather construction with elegant design. Built for players who demand the finest protection with sophisticated style.'
  },
  'cases-urbain': {
    heading: 'Urbain Cue Cases - Urban Style, Pro Protection.',
    description:
      'Urbain cases combine modern urban design with reliable protection. Available in hard and soft variations, in multiple sizes and colorways.'
  },
  'cases-metro': {
    heading: 'Metro Cue Cases - Sleek And Functional.',
    description:
      'Metro cases offer a sleek, streamlined design for the modern player. Hard shell protection with stylish colorways for travel and tournaments.'
  },
  'cases-roadline': {
    heading: 'Roadline Cue Cases - Road-Ready Durability.',
    description:
      'Roadline cases are built for the road warrior. Double-strap design, hard and soft options with durable construction for maximum protection on the go.'
  },
  'cases-poison': {
    heading: 'Poison Cases - Bold Style, Solid Protection.',
    description:
      'Poison-branded cases featuring bold designs including Camo and Armor series. Built tough with eye-catching style for the Poison player.'
  },
  'cases-carom': {
    heading: 'Carom Cue Cases - Specialized Protection.',
    description:
      'Cases designed specifically for carom cues. Proper sizing and protection for the carom player.'
  },
  'cases-1x1': { heading: '1 Butt x 1 Shaft Cases', description: 'Compact cases for carrying 1 butt and 1 shaft. Perfect for everyday play.' },
  'cases-2x4': { heading: '2 Butts x 4 Shafts Cases', description: 'Mid-size cases for carrying 2 butts and 4 shafts. Ideal for the versatile player.' },
  'cases-3x4': { heading: '3 Butts x 4 Shafts Cases', description: 'Cases for carrying 3 butts and 4 shafts. Extra room for tournament play.' },
  'cases-3x5': { heading: '3 Butts x 5 Shafts Cases', description: 'Cases for carrying 3 butts and 5 shafts. Built for serious competitors.' },
  'cases-3x6': { heading: '3 Butts x 6 Shafts Cases', description: 'Cases for carrying 3 butts and 6 shafts. Maximum shaft capacity.' },
  'cases-4x8': { heading: '4 Butts x 8 Shafts Cases', description: 'Full-size cases for carrying 4 butts and 8 shafts. The ultimate tournament case.' },
  // ─── Accessory sub-categories ───
  accessories: {
    heading: 'Billiard Accessories - Elevate Your Game.',
    description:
      'Everything you need to complement your billiard experience. From Arcos II ball sets and AeroRack triangles to gloves, chalk, extensions, and joint protectors — premium accessories for serious players.'
  },
  'acc-aerorack': { heading: 'Pool Ball AeroRack', description: 'The AeroRack triangle system for faster, tighter racks every time. Precision-engineered for tournament-quality results.' },
  'acc-pool-balls': { heading: 'Pool Balls - Arcos II Series', description: 'Premium Arcos II pool ball sets engineered for consistent roll, true colors, and long-lasting durability.' },
  'acc-cue-balls': { heading: 'Cue Balls', description: 'High-performance cue balls designed for optimal play. Balanced, durable, and tournament-approved.' },
  'acc-cloth': { heading: 'Pool Table Cloth', description: 'Professional-grade table cloth for smooth, consistent play. Available in multiple colors.' },
  'acc-chalk': { heading: 'Billiard Chalk', description: 'Premium billiard chalk for better cue ball grip and reduced miscues. Essential for every player.' },
  'acc-pure-chalk': { heading: 'Pure Chalk', description: 'Predator Pure Chalk — advanced formula for maximum grip and minimal mess. The choice of professionals.' },
  'acc-gloves': { heading: 'Billiard Gloves', description: 'Predator billiard gloves for smooth, consistent strokes. Reduce friction for a better playing experience.' },
  'acc-extensions': { heading: 'Pool Cue Extensions', description: 'Cue extensions for added reach without sacrificing control. Quick-attach designs for any situation.' },
  'acc-tips': { heading: 'Pool Cue Tips', description: 'Replacement cue tips for optimal ball control. From soft to hard, find the right tip for your game.' },
  'acc-maintenance': { heading: 'Cue Maintenance', description: 'Keep your cues in top condition with cleaning and maintenance supplies.' },
  'acc-holders': { heading: 'Pool Cue Holders', description: 'Cue holders and rests for your game room or pool hall. Keep your cues organized and accessible.' },
  'acc-weight': { heading: 'Weight Adjustment', description: 'Fine-tune your cue weight for the perfect feel. Weight bolts and adjustment kits.' },
  'acc-joint-protectors': { heading: 'Joint Protectors', description: 'Protect your cue joints from damage during transport and storage. Essential accessories for every cue.' },
  'acc-parts': { heading: 'Cue Parts & Accessories', description: 'Replacement parts, ferrules, bumpers, and accessories to keep your cue performing at its best.' },
  'acc-towel': { heading: 'Billiard Towel', description: 'Premium billiard towels for keeping your equipment clean during play.' },
  'acc-table': { heading: 'Table Accessories', description: 'Everything for your billiard table — balls, racks, cloth, chalk and more. Professional-grade equipment for the serious player.' },
  'acc-cue': { heading: 'Cue Accessories', description: 'Complete your setup with essential cue accessories — gloves, extensions, tips, maintenance supplies, joint protectors and more.' },
  // ─── Table sub-categories ───
  tables: {
    heading: 'Billiard Tables - Professional Grade.',
    description:
      'Predator billiard tables are engineered with precision and built to perform. From the Apex tournament-ready tables to the elegant Arc design, experience professional-grade play at home or in the club.'
  },
  'tables-apex': {
    heading: 'Apex Pool Tables - Tournament Ready.',
    description: 'The Predator Apex series is built for professional-level play. With precision-leveling systems and premium components, these tables deliver consistent, tournament-quality performance.'
  },
  'tables-arc': {
    heading: 'Arc Pool Tables - Elegant Design.',
    description: 'The Predator Arc table combines stunning aesthetics with pro-level playability. A statement piece for any game room.'
  },
  'tables-9ft': { heading: '9-Foot Pool Tables', description: 'Professional 9-foot tables for tournament-standard play. The standard for competitive billiards.' },
  'tables-8ft': { heading: '8-Foot Pool Tables', description: '8-foot tables offering a great balance between professional play and home use.' },
  'tables-7ft': { heading: '7-Foot Pool Tables', description: 'Compact 7-foot tables perfect for home game rooms and smaller spaces without compromising playability.' }
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
  'bk-rush-break': ['bk rush break', 'bk rush break cues'],
  'bk-rush-jump-break': ['bk rush jump/break', 'bk rush jump break'],
  'poison-vx-break-jump': ['poison vx break & jump', 'poison vx break jump'],
  'bk4-break': ['bk4 break'],
  'air-rush-jump': ['air rush jump'],
  'air-ii-jump': ['air ii jump'],
  limited: ['limited edition', 'le'],
  allcues: ['all pool cues', 'view all pool cues'],
  shafts: ['shaft', 'pool cue shaft'],
  'shafts-revo': ['revo'],
  'shafts-centro': ['centro'],
  'shafts-314': ['314'],
  'shafts-z3': ['z-3', 'z3'],
  'shafts-vantage': ['vantage'],
  'shafts-bk2': ['bk2', 'bk-r'],
  'shafts-carbon': ['carbon fiber shaft'],
  'shafts-maple': ['maple wood shaft'],
  cases: ['case', 'cue case'],
  'cases-legacy': ['legacy'],
  'cases-urbain': ['urbain'],
  'cases-metro': ['metro'],
  'cases-roadline': ['roadline'],
  'cases-poison': ['poison'],
  'cases-carom': ['carom'],
  accessories: ['accessory', 'accessories', 'billiard accessories'],
  'acc-aerorack': ['aerorack'],
  'acc-pool-balls': ['pool ball', 'arcos'],
  'acc-chalk': ['chalk'],
  'acc-gloves': ['glove'],
  tables: ['table', 'billiard table', 'pool table'],
  'tables-apex': ['apex'],
  'tables-arc': ['arc']
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
