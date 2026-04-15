import React from 'react';
import Footer from '../components/Footer';
import { getPrimaryImage } from '../utils/lineUtils';

function HomePage({ banners, lineCollections, poisonMaelithVideoSrc, openLineDetailPage }) {
  const hasTruesplice = lineCollections.truesplice.length > 0;
  const hasMaelith = lineCollections.maelith.length > 0;
  const hasCandy = lineCollections.candy.length > 0;

  return (
    <>
      <main className="main-content">
        <section className="banner-section" id="section-top">
          {banners.length > 0 ? (
            <a href={banners[0].link || '/'} className="banner-link" aria-label={banners[0].title}>
              <img
                src={banners[0].image}
                alt={banners[0].title}
                className="hero-banner"
                loading="eager"
              />
            </a>
          ) : (
            <div className="banner-fallback">
              <p className="banner-fallback-kicker">Lab Billiard</p>
              <h2 className="banner-fallback-title">Premium cues, clean layouts, and fast navigation.</h2>
              <p className="banner-fallback-text">
                The catalog is loading or unavailable right now. The homepage still stays visible so you can keep browsing.
              </p>
            </div>
          )}
        </section>

        <section className="truesplice-section" aria-label="TrueSplice product lines" id="section-truesplice">
          <div className="section-heading">
            <p className="section-kicker">Classic Wood Feel With Hi-tech Finesse</p>
            <h2 className="section-title">TrueSplice Collection</h2>
          </div>
          <div className="truesplice-grid">
            {hasTruesplice ? lineCollections.truesplice.map((line) => (
              <article key={line.lineSlug} className="truesplice-card">
                <button
                  type="button"
                  className="line-card-link"
                  onClick={() => openLineDetailPage(line)}
                >
                  <img src={getPrimaryImage(line)} alt={line.name} className="truesplice-image" loading="lazy" />
                </button>
                <div className="truesplice-content">
                  <button
                    type="button"
                    className="line-card-title-link"
                    onClick={() => openLineDetailPage(line)}
                  >
                    {line.name}
                  </button>
                  <p className="truesplice-price">{line.price.toLocaleString('de-DE')}{line.currencySymbol}</p>
                  <button type="button" className="truesplice-btn">Add to cart</button>
                </div>
              </article>
            )) : (
              <div className="catalog-empty-card">TrueSplice items will appear here once data is loaded.</div>
            )}
          </div>
        </section>

        <section className="banner-section">
          {banners.length > 1 && (
            <a href={banners[1].link || '/'} className="banner-link" aria-label={banners[1].title}>
              <img
                src={banners[1].image}
                alt={banners[1].title}
                className="hero-banner"
                loading="eager"
              />
            </a>
          )}
        </section>

        <section className="truesplice-section" aria-label="Poison Maelith products" id="section-maelith">
          <div className="section-heading">
            <p className="section-kicker">A Dark Masterpiece Forged From the Shadows</p>
            <h2 className="section-title">Poison Maelith Series</h2>
          </div>
          <div className="truesplice-grid">
            {hasMaelith ? lineCollections.maelith.slice(0, 4).map((line) => (
              <article key={line.lineSlug} className="truesplice-card">
                <button
                  type="button"
                  className="line-card-link"
                  onClick={() => openLineDetailPage(line)}
                >
                  <img src={getPrimaryImage(line)} alt={line.name} className="truesplice-image" loading="lazy" />
                </button>
                <div className="truesplice-content">
                  <button
                    type="button"
                    className="line-card-title-link"
                    onClick={() => openLineDetailPage(line)}
                  >
                    {line.name}
                  </button>
                  <p className="truesplice-price">{line.price.toLocaleString('de-DE')}{line.currencySymbol}</p>
                  <button type="button" className="truesplice-btn">Add to cart</button>
                </div>
              </article>
            )) : (
              <div className="catalog-empty-card">Poison Maelith products will appear here once data is loaded.</div>
            )}
          </div>
        </section>

        <section className="video-section" aria-label="Poison Maelith video showcase">
          <div className="video-frame">
            <video
              className="showcase-video"
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
            >
              <source src={poisonMaelithVideoSrc} type="video/mp4" />
            </video>
          </div>
        </section>

        <section className="truesplice-section" aria-label="Poison Candy products" id="section-candy">
          <div className="section-heading">
            <p className="section-kicker">Where Vibrant Style Meets Unbeatable Performance</p>
            <h2 className="section-title">Poison Candy Series</h2>
          </div>
          <div className="truesplice-grid">
            {hasCandy ? lineCollections.candy.slice(0, 4).map((line) => (
              <article key={line.lineSlug} className="truesplice-card">
                <button
                  type="button"
                  className="line-card-link"
                  onClick={() => openLineDetailPage(line)}
                >
                  <img src={getPrimaryImage(line)} alt={line.name} className="truesplice-image" loading="lazy" />
                </button>
                <div className="truesplice-content">
                  <button
                    type="button"
                    className="line-card-title-link"
                    onClick={() => openLineDetailPage(line)}
                  >
                    {line.name}
                  </button>
                  <p className="truesplice-price">{line.price.toLocaleString('de-DE')}{line.currencySymbol}</p>
                  <button type="button" className="truesplice-btn">Add to cart</button>
                </div>
              </article>
            )) : (
              <div className="catalog-empty-card">Poison Candy products will appear here once data is loaded.</div>
            )}
          </div>
        </section>

        <section className="banner-section">
          {banners.length > 2 && (
            <a href={banners[2].link || '/'} className="banner-link" aria-label={banners[2].title}>
              <img
                src={banners[2].image}
                alt={banners[2].title}
                className="hero-banner"
                loading="eager"
              />
            </a>
          )}
        </section>
      </main>

      <Footer />
    </>
  );
}

export default HomePage;
