import { useMemo } from 'react';
import { createLineSlug, parseLineRoute } from '../utils/lineUtils';

export const useLineCatalog = ({
  pathname,
  products,
  trueSpliceLines,
  p3Lines,
  limitedEditions,
  poisonMaeliths,
  poisonCandies
}) => {
  const lineRoute = useMemo(() => parseLineRoute(pathname), [pathname]);

  const lineCollections = useMemo(() => {
    const mapCollection = (items, seriesTitle, seriesKey, sectionId) =>
      items.map((item, index) => ({
        ...item,
        seriesTitle,
        seriesKey,
        sectionId,
        lineSlug: createLineSlug(seriesKey, item, index)
      }));

    return {
      product: mapCollection(products, 'Products', 'product', 'section-products'),
      truesplice: mapCollection(trueSpliceLines, 'TrueSplice Collection', 'truesplice', 'section-truesplice'),
      p3: mapCollection(p3Lines, 'Predator P3 Series', 'p3', 'section-p3'),
      maelith: mapCollection(poisonMaeliths, 'Poison Maelith Series', 'maelith', 'section-maelith'),
      candy: mapCollection(poisonCandies, 'Poison Candy Series', 'candy', 'section-candy'),
      limited: mapCollection(limitedEditions, 'Limited Editions', 'limited', 'section-limited')
    };
  }, [p3Lines, poisonCandies, poisonMaeliths, products, trueSpliceLines, limitedEditions]);

  const productLineItems = useMemo(
    () => [
      ...lineCollections.product,
      ...lineCollections.truesplice,
      ...lineCollections.p3,
      ...lineCollections.maelith,
      ...lineCollections.candy,
      ...lineCollections.limited
    ],
    [lineCollections]
  );

  const lineLookup = useMemo(() => {
    const map = new Map();
    productLineItems.forEach((item) => {
      if (!map.has(item.lineSlug)) {
        map.set(item.lineSlug, item);
      }
    });
    return map;
  }, [productLineItems]);

  const selectedLine = lineRoute?.lineSlug ? lineLookup.get(lineRoute.lineSlug) : null;
  const selectedSeriesItems = lineRoute?.seriesKey ? lineCollections[lineRoute.seriesKey] || [] : [];
  const selectedSeriesTitle = selectedSeriesItems[0]?.seriesTitle || 'Product Line';

  return {
    lineRoute,
    lineCollections,
    productLineItems,
    selectedLine,
    selectedSeriesItems,
    selectedSeriesTitle
  };
};
