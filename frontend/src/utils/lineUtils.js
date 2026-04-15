export const normalizeSearchText = (value = '') =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

export const getPrimaryImage = (item) => {
  if (!item) {
    return '';
  }

  if (Array.isArray(item.images) && typeof item.images[0] === 'string' && item.images[0].trim()) {
    return item.images[0];
  }

  if (Array.isArray(item.gallery) && typeof item.gallery[0] === 'string' && item.gallery[0].trim()) {
    return item.gallery[0];
  }

  return typeof item.image === 'string' ? item.image : '';
};

export const createLineSlug = (seriesKey, item, index) => {
  const slugName = (item?.name || `line-${index + 1}`)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const orderPart = Number.isFinite(item?.order) ? item.order : index + 1;
  return `${seriesKey}-${orderPart}-${slugName}`;
};

export const parseLineRoute = (pathname) => {
  const detailMatched = pathname.match(/^\/line\/([^/]+)\/([^/]+)\/?$/);

  if (detailMatched) {
    return {
      type: 'detail',
      seriesKey: decodeURIComponent(detailMatched[1]),
      lineSlug: decodeURIComponent(detailMatched[2])
    };
  }

  const seriesMatched = pathname.match(/^\/line\/([^/]+)\/?$/);

  if (!seriesMatched) {
    return null;
  }

  const routeValue = normalizeSearchText(decodeURIComponent(seriesMatched[1]));
  const routeSeriesAliases = {
    product: 'product',
    truesplice: 'truesplice',
    p3: 'p3',
    maelith: 'maelith',
    candy: 'candy',
    limited: 'limited',
    limitededition: 'limited'
  };

  const normalizedSeriesKey = routeSeriesAliases[routeValue];

  if (normalizedSeriesKey) {
    return {
      type: 'series',
      seriesKey: normalizedSeriesKey,
      lineSlug: null
    };
  }

  return {
    type: 'detail',
    seriesKey: null,
    lineSlug: routeValue
  };
};

export const getMenuSeriesKey = (menuItemName) => {
  const normalizedName = normalizeSearchText(menuItemName);

  if (normalizedName.includes('poison candy')) {
    return 'candy';
  }

  if (normalizedName.includes('poison maelith')) {
    return 'maelith';
  }

  if (normalizedName.includes('true splice')) {
    return 'truesplice';
  }

  if (normalizedName.includes('p3')) {
    return 'p3';
  }

  if (normalizedName.includes('limited edition')) {
    return 'limited';
  }

  return null;
};
