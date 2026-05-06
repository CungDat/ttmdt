import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ShoppingCart, Sparkles } from 'lucide-react';
import axios from 'axios';
import Footer from '../components/Footer';

const CUE_VARIANT_OPTIONS = {
  shaft: [
    { label: 'REVO Carbon Pool Shaft • 12.4 mm • 29"', value: 'revo-12.4', upcharge: 0 },
    { label: 'REVO Carbon Pool Shaft • 12.9 mm • 29"', value: 'revo-12.9', upcharge: 50 },
    { label: 'REVO Carbon Pool Shaft • 11.8 mm • 29"', value: 'revo-11.8', upcharge: 50 },
    { label: '314-3 Maple Shaft • 12.75 mm • 29"', value: '314-3', upcharge: -100 },
    { label: 'Z-3 Maple Shaft • 11.85 mm • 29"', value: 'z-3', upcharge: -100 },
    { label: 'Vantage Maple Shaft • 12.9 mm • 29"', value: 'vantage', upcharge: -100 },
    { label: 'Centro Hybrid Shaft • 12.4 mm • 29"', value: 'centro', upcharge: 0 }
  ],
  tip: [
    { label: 'Predator Victory • Medium', value: 'victory-medium', upcharge: 0 },
    { label: 'Predator Victory • Soft', value: 'victory-soft', upcharge: 0 },
    { label: 'Predator Victory • Hard', value: 'victory-hard', upcharge: 0 }
  ],
  weight: [
    { label: '19 oz', value: '19oz', upcharge: 0 },
    { label: '18.5 oz', value: '18.5oz', upcharge: 0 },
    { label: '19.5 oz', value: '19.5oz', upcharge: 0 },
    { label: '20 oz', value: '20oz', upcharge: 0 },
    { label: '18 oz', value: '18oz', upcharge: 0 }
  ]
};

const isCueProduct = (line) => {
  if (!line) return false;
  const key = (line.seriesKey || '').toLowerCase();
  // Explicitly exclude non-cue categories
  if (
    key.startsWith('shafts') || key.startsWith('cases') || key.startsWith('acc-') ||
    key === 'accessories' || key.startsWith('tables') || key === 'tables'
  ) {
    return false;
  }
  return (
    key.includes('truesplice') || key.includes('p3') || key.includes('maelith') ||
    key.includes('candy') || key.includes('limited') || key.includes('product') ||
    key.includes('bk-rush') || key.includes('bk4') || key.includes('air') ||
    key.includes('poison') || key.includes('breakjump') || key === 'allcues'
  );
};

function LineDetailPage({ selectedLine, onAddToCart, isAuthenticated, lineCollections }) {
  const imageList = useMemo(() => {
    if (!selectedLine) return [];
    const candidates = [
      ...(Array.isArray(selectedLine.images) ? selectedLine.images : []),
      ...(Array.isArray(selectedLine.gallery) ? selectedLine.gallery : []),
      selectedLine.image
    ];
    return Array.from(new Set(candidates.filter((item) => typeof item === 'string' && item.trim().length > 0)));
  }, [selectedLine]);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [openOption, setOpenOption] = useState(null);
  const [selectedShaft, setSelectedShaft] = useState(CUE_VARIANT_OPTIONS.shaft[0]);
  const [selectedTip, setSelectedTip] = useState(CUE_VARIANT_OPTIONS.tip[0]);
  const [selectedWeight, setSelectedWeight] = useState(CUE_VARIANT_OPTIONS.weight[0]);
  const [crossSellItems, setCrossSellItems] = useState([]);

  const showVariants = isCueProduct(selectedLine);

  useEffect(() => {
    setActiveImageIndex(0);
    setOpenOption(null);
    setSelectedShaft(CUE_VARIANT_OPTIONS.shaft[0]);
    setSelectedTip(CUE_VARIANT_OPTIONS.tip[0]);
    setSelectedWeight(CUE_VARIANT_OPTIONS.weight[0]);
  }, [selectedLine?.lineSlug]);

  // Fetch cross-sell suggestions
  useEffect(() => {
    if (!selectedLine) return;
    const category = (selectedLine.seriesKey || '').includes('shaft') ? 'shafts'
      : (selectedLine.seriesKey || '').includes('case') ? 'cases'
        : (selectedLine.seriesKey || '').includes('acc') ? 'accessories'
          : 'cues';
    axios.get(`http://localhost:5000/api/cross-sell?category=${category}&limit=4`)
      .then((res) => setCrossSellItems(Array.isArray(res.data?.suggestions) ? res.data.suggestions : []))
      .catch(() => setCrossSellItems([]));
  }, [selectedLine?.lineSlug, selectedLine?.seriesKey]);

  const activeImage = imageList[activeImageIndex] || selectedLine?.image;
  const hasMultipleImages = imageList.length > 1;
  const canGoBackward = activeImageIndex > 0;
  const canGoForward = activeImageIndex < imageList.length - 1;

  const handlePrevImage = () => {
    setActiveImageIndex((prev) => (imageList.length === 0 ? 0 : prev === 0 ? imageList.length - 1 : prev - 1));
  };
  const handleNextImage = () => {
    setActiveImageIndex((prev) => (imageList.length === 0 ? 0 : prev === imageList.length - 1 ? 0 : prev + 1));
  };

  const totalUpcharge = showVariants ? (selectedShaft.upcharge + selectedTip.upcharge + selectedWeight.upcharge) : 0;
  const basePrice = Number(selectedLine?.price || 0);
  const finalPrice = basePrice + totalUpcharge;

  const hasStockValue = Number.isFinite(Number(selectedLine?.countInStock));
  const isSoldOut = selectedLine?.isSoldOut === true || (hasStockValue && Number(selectedLine?.countInStock) <= 0) || selectedLine?.isActive === false;
  const isNewArrival = selectedLine?.isNew || selectedLine?.badge === 'NEW' || selectedLine?.seriesKey === 'limited';

  const priceText = `${selectedLine?.currencySymbol || '$'}${finalPrice.toFixed(2)}`;

  const handleAddToCartWithConfig = useCallback(() => {
    if (isSoldOut) return;
    const lineWithConfig = {
      ...selectedLine,
      price: finalPrice,
      configuration: showVariants ? {
        shaft: selectedShaft.label,
        tip: selectedTip.label,
        weight: selectedWeight.label,
        shaftUpcharge: selectedShaft.upcharge,
        tipUpcharge: selectedTip.upcharge,
        weightUpcharge: selectedWeight.upcharge
      } : null
    };
    onAddToCart(lineWithConfig);
  }, [selectedLine, finalPrice, selectedShaft, selectedTip, selectedWeight, isSoldOut, onAddToCart, showVariants]);

  const toggleOption = (key) => setOpenOption((prev) => (prev === key ? null : key));

  const resetDefaults = () => {
    setSelectedShaft(CUE_VARIANT_OPTIONS.shaft[0]);
    setSelectedTip(CUE_VARIANT_OPTIONS.tip[0]);
    setSelectedWeight(CUE_VARIANT_OPTIONS.weight[0]);
    setOpenOption(null);
  };

  const handleImageError = (event) => {
    const fallbackImages = [
      ...(Array.isArray(selectedLine?.images) ? selectedLine.images : []),
      selectedLine?.image
    ].filter((item) => typeof item === 'string' && item.trim().length > 0);
    const currentSource = event.currentTarget.src;
    const fallbackSource = fallbackImages.find((item) => currentSource !== item);
    if (fallbackSource) event.currentTarget.src = fallbackSource;
  };

  const customizationRows = showVariants ? [
    { key: 'shaft', title: 'SHAFT', value: selectedShaft.label, upcharge: selectedShaft.upcharge, options: CUE_VARIANT_OPTIONS.shaft, setter: setSelectedShaft },
    { key: 'tip', title: 'TIP', value: selectedTip.label, upcharge: selectedTip.upcharge, options: CUE_VARIANT_OPTIONS.tip, setter: setSelectedTip },
    { key: 'weight', title: 'WEIGHT', value: selectedWeight.label, upcharge: selectedWeight.upcharge, options: CUE_VARIANT_OPTIONS.weight, setter: setSelectedWeight }
  ] : [];

  return (
    <>
      <main className="line-detail-main">
        {selectedLine ? (
          <>
            <section className="line-detail-card" aria-label="Product line detail">
              <div className="line-detail-showcase">
                {hasMultipleImages ? (
                  <div className="line-detail-thumbnails" role="list" aria-label="Product image gallery">
                    {imageList.map((imageUrl, index) => (
                      <button
                        key={`${selectedLine.lineSlug}-thumb-${index}`}
                        type="button"
                        className={`line-detail-thumb-btn ${index === activeImageIndex ? 'line-detail-thumb-btn-active' : ''}`}
                        onClick={() => setActiveImageIndex(index)}
                        aria-label={`View image ${index + 1}`}
                      >
                        <img src={imageUrl} alt={`${selectedLine.name} ${index + 1}`} className="line-detail-thumb-image" loading="lazy" />
                      </button>
                    ))}
                  </div>
                ) : null}
                <div className="line-detail-media-wrap">
                  {isNewArrival ? <span className="line-detail-badge-new">NEW</span> : null}
                  <img src={activeImage} alt={selectedLine.name} className="line-detail-image" loading="eager" onError={handleImageError} />
                  {hasMultipleImages ? (
                    <div className="line-detail-nav" aria-label="Image navigation">
                      <button type="button" className="line-detail-nav-btn" onClick={handlePrevImage} aria-label="Previous image" disabled={!canGoBackward}>
                        <ChevronLeft className="line-detail-nav-icon" />
                      </button>
                      <button type="button" className="line-detail-nav-btn" onClick={handleNextImage} aria-label="Next image" disabled={!canGoForward}>
                        <ChevronRight className="line-detail-nav-icon" />
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="line-detail-content">
                <h2 className="line-detail-title">{selectedLine.name}</h2>

                <p className="line-detail-price">
                  {priceText}
                  {totalUpcharge !== 0 && showVariants ? (
                    <span className="line-detail-price-upcharge">
                      {totalUpcharge > 0 ? `+$${totalUpcharge.toFixed(2)}` : `-$${Math.abs(totalUpcharge).toFixed(2)}`}
                    </span>
                  ) : null}
                </p>

                <button
                  type="button"
                  className="line-detail-cta"
                  disabled={isSoldOut}
                  onClick={handleAddToCartWithConfig}
                >
                  {isSoldOut ? 'SOLD OUT' : isAuthenticated ? 'ADD TO CART' : 'LOGIN TO BUY'}
                </button>

                {showVariants && customizationRows.length > 0 ? (
                  <>
                    <div className="line-detail-divider" />
                    <div className="line-detail-options-head">
                      <p className="line-detail-options-title">
                        <Sparkles size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                        Build Your Own Cue
                      </p>
                      <button type="button" className="line-detail-reset-btn" onClick={resetDefaults}>Reset to defaults</button>
                    </div>
                    <div className="line-detail-options-list" role="list" aria-label="Customization options">
                      {customizationRows.map((option) => (
                        <article key={option.key} className="line-detail-option-card" role="listitem">
                          <button
                            type="button"
                            className="line-detail-option-toggle"
                            onClick={() => toggleOption(option.key)}
                            aria-expanded={openOption === option.key}
                          >
                            <div>
                              <p className="line-detail-option-title">{option.title}</p>
                              <p className="line-detail-option-value">
                                {option.value}
                                {option.upcharge !== 0 ? (
                                  <span className={`line-detail-upcharge ${option.upcharge > 0 ? 'line-detail-upcharge-plus' : 'line-detail-upcharge-minus'}`}>
                                    {option.upcharge > 0 ? `+$${option.upcharge}` : `-$${Math.abs(option.upcharge)}`}
                                  </span>
                                ) : null}
                              </p>
                            </div>
                            {openOption === option.key ? <ChevronUp className="line-detail-option-icon" /> : <ChevronDown className="line-detail-option-icon" />}
                          </button>
                          {openOption === option.key ? (
                            <div className="line-detail-variant-dropdown">
                              {option.options.map((opt) => (
                                <button
                                  key={opt.value}
                                  type="button"
                                  className={`line-detail-variant-item ${opt.value === (option.key === 'shaft' ? selectedShaft : option.key === 'tip' ? selectedTip : selectedWeight).value ? 'line-detail-variant-item-active' : ''}`}
                                  onClick={() => {
                                    option.setter(opt);
                                    setOpenOption(null);
                                  }}
                                >
                                  <span>{opt.label}</span>
                                  {opt.upcharge !== 0 ? (
                                    <span className={`line-detail-upcharge ${opt.upcharge > 0 ? 'line-detail-upcharge-plus' : 'line-detail-upcharge-minus'}`}>
                                      {opt.upcharge > 0 ? `+$${opt.upcharge}` : `-$${Math.abs(opt.upcharge)}`}
                                    </span>
                                  ) : <span className="line-detail-upcharge">Included</span>}
                                </button>
                              ))}
                            </div>
                          ) : null}
                        </article>
                      ))}
                    </div>
                  </>
                ) : null}
              </div>
            </section>

            {/* Cross-selling section */}
            {crossSellItems.length > 0 ? (
              <section className="cross-sell-section" aria-label="Related products">
                <h3 className="cross-sell-title">
                  <ShoppingCart size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                  You may also like
                </h3>
                <div className="cross-sell-grid">
                  {crossSellItems.map((item) => (
                    <article key={item._id} className="cross-sell-card">
                      <div className="cross-sell-image-wrap">
                        <img
                          src={Array.isArray(item.images) && item.images[0] ? item.images[0] : item.image || ''}
                          alt={item.name}
                          className="cross-sell-image"
                          loading="lazy"
                        />
                        <span className="cross-sell-badge">{item.suggestCategory}</span>
                      </div>
                      <div className="cross-sell-body">
                        <p className="cross-sell-name">{item.name}</p>
                        <p className="cross-sell-price">${Number(item.price || 0).toFixed(2)}</p>
                        <button
                          type="button"
                          className="cross-sell-add-btn"
                          onClick={() => onAddToCart({
                            ...item,
                            lineSlug: item._id,
                            seriesTitle: item.suggestCategory,
                            image: Array.isArray(item.images) && item.images[0] ? item.images[0] : item.image || ''
                          })}
                        >
                          + Add to cart
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}
          </>
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

export default LineDetailPage;
