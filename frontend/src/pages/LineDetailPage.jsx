import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Clock3 } from 'lucide-react';

function LineDetailPage({ selectedLine, onAddToCart, isAuthenticated }) {
  const imageList = useMemo(() => {
    if (!selectedLine) {
      return [];
    }

    const candidates = [
      ...(Array.isArray(selectedLine.images) ? selectedLine.images : []),
      ...(Array.isArray(selectedLine.gallery) ? selectedLine.gallery : []),
      selectedLine.image
    ];

    return Array.from(new Set(candidates.filter((item) => typeof item === 'string' && item.trim().length > 0)));
  }, [selectedLine]);

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [selectedLine?.lineSlug]);

  const activeImage = imageList[activeImageIndex] || selectedLine?.image;

  const hasMultipleImages = imageList.length > 1;
  const canGoBackward = activeImageIndex > 0;
  const canGoForward = activeImageIndex < imageList.length - 1;

  const handlePrevImage = () => {
    setActiveImageIndex((prev) => {
      if (imageList.length === 0) {
        return 0;
      }

      return prev === 0 ? imageList.length - 1 : prev - 1;
    });
  };

  const handleNextImage = () => {
    setActiveImageIndex((prev) => {
      if (imageList.length === 0) {
        return 0;
      }

      return prev === imageList.length - 1 ? 0 : prev + 1;
    });
  };

  const hasStockValue = Number.isFinite(Number(selectedLine?.countInStock));

  const isSoldOut =
    selectedLine?.isSoldOut === true ||
    (hasStockValue && Number(selectedLine?.countInStock) <= 0) ||
    selectedLine?.isActive === false;

  const isNewArrival = selectedLine?.isNew || selectedLine?.badge === 'NEW' || selectedLine?.seriesKey === 'limited';

  const priceValue = Number(selectedLine?.price || 0);
  const priceText = `${selectedLine?.currencySymbol || '$'}${priceValue.toFixed(2)}`;

  const seriesLabel = selectedLine?.seriesTitle || 'Limited Edition';
  const seriesInitials = seriesLabel
    .split(/\s+/)
    .map((chunk) => chunk[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const specShaft = selectedLine?.specs?.shaft || 'REVO Carbon Pool Shaft • 12.4 mm • 29" • White';
  const specTip = selectedLine?.specs?.tip || 'Predator Victory • Medium';
  const specWeight = selectedLine?.specs?.weight || '19 oz';

  const customizationRows = [
    { title: 'SHAFT', value: specShaft },
    { title: 'TIP', value: specTip },
    { title: 'WEIGHT', value: specWeight }
  ];

  const handleImageError = (event) => {
    const fallbackImages = [
      ...(Array.isArray(selectedLine?.images) ? selectedLine.images : []),
      ...(Array.isArray(selectedLine?.gallery) ? selectedLine.gallery : []),
      selectedLine?.image
    ].filter(
      (item) => typeof item === 'string' && item.trim().length > 0
    );

    const currentSource = event.currentTarget.src;
    const fallbackSource = fallbackImages.find((item) => currentSource !== item);

    if (fallbackSource) {
      event.currentTarget.src = fallbackSource;
    }
  };

  return (
    <main className="line-detail-main">
      {selectedLine ? (
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
              <img
                src={activeImage}
                alt={selectedLine.name}
                className="line-detail-image"
                loading="eager"
                onError={handleImageError}
              />
              {hasMultipleImages ? (
                <div className="line-detail-nav" aria-label="Image navigation">
                  <button
                    type="button"
                    className="line-detail-nav-btn"
                    onClick={handlePrevImage}
                    aria-label="Previous image"
                    disabled={!canGoBackward}
                  >
                    <ChevronLeft className="line-detail-nav-icon" />
                  </button>
                  <button
                    type="button"
                    className="line-detail-nav-btn"
                    onClick={handleNextImage}
                    aria-label="Next image"
                    disabled={!canGoForward}
                  >
                    <ChevronRight className="line-detail-nav-icon" />
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          <div className="line-detail-content">
            <h2 className="line-detail-title">{selectedLine.name}</h2>

            <p className="line-detail-price">{priceText}</p>

            <div className="line-detail-stock-row" aria-live="polite">
              <CheckCircle2 className="line-detail-stock-icon" />
              <span className="line-detail-stock-text">{isSoldOut ? 'Sold out' : 'In stock'}</span>
            </div>

            <button
              type="button"
              className="line-detail-cta"
              disabled={isSoldOut}
              onClick={() => {
                if (!isSoldOut) {
                  onAddToCart(selectedLine);
                }
              }}
            >
              {isSoldOut ? 'SOLD OUT' : isAuthenticated ? 'ADD TO CART' : 'LOGIN TO BUY'}
            </button>

            <div className="line-detail-divider" />

            <div className="line-detail-options-head">
              <p className="line-detail-options-title">Optional Customizations</p>
              <button type="button" className="line-detail-reset-btn">Reset to defaults</button>
            </div>

            <div className="line-detail-options-list" role="list" aria-label="Customization options">
              {customizationRows.map((option) => (
                <article key={option.title} className="line-detail-option-card" role="listitem">
                  <div>
                    <p className="line-detail-option-title">{option.title}</p>
                    <p className="line-detail-option-value">{option.value}</p>
                  </div>
                  <button type="button" className="line-detail-option-action" aria-label={`Customize ${option.title.toLowerCase()}`}>
                    Customize
                    <ChevronDown className="line-detail-option-icon" />
                  </button>
                </article>
              ))}
            </div>
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
  );
}

export default LineDetailPage;
