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

  const routeValue = decodeURIComponent(seriesMatched[1]).toLowerCase().replace(/\s+/g, '-');
  const routeSeriesAliases = {
    product: 'product',
    truesplice: 'truesplice',
    p3: 'p3',
    maelith: 'maelith',
    candy: 'candy',
    breakjump: 'breakjump',
    'break-jump': 'breakjump',
    'bk-rush-break': 'bk-rush-break',
    'bk-rush-jump-break': 'bk-rush-jump-break',
    'poison-vx-break-jump': 'poison-vx-break-jump',
    'bk4-break': 'bk4-break',
    'air-rush-jump': 'air-rush-jump',
    'air-ii-jump': 'air-ii-jump',
    limited: 'limited',
    limitededition: 'limited',
    allcues: 'allcues',
    'all-cues': 'allcues',
    // Shafts
    shafts: 'shafts',
    'shafts-revo': 'shafts-revo',
    'shafts-centro': 'shafts-centro',
    'shafts-314': 'shafts-314',
    'shafts-z3': 'shafts-z3',
    'shafts-vantage': 'shafts-vantage',
    'shafts-bk2': 'shafts-bk2',
    'shafts-carbon': 'shafts-carbon',
    'shafts-maple': 'shafts-maple',
    // Cases
    cases: 'cases',
    'cases-legacy': 'cases-legacy',
    'cases-urbain': 'cases-urbain',
    'cases-metro': 'cases-metro',
    'cases-roadline': 'cases-roadline',
    'cases-poison': 'cases-poison',
    'cases-carom': 'cases-carom',
    'cases-1x1': 'cases-1x1',
    'cases-2x4': 'cases-2x4',
    'cases-3x4': 'cases-3x4',
    'cases-3x5': 'cases-3x5',
    'cases-3x6': 'cases-3x6',
    'cases-4x8': 'cases-4x8',
    // Accessories
    accessories: 'accessories',
    'acc-aerorack': 'acc-aerorack',
    'acc-pool-balls': 'acc-pool-balls',
    'acc-cue-balls': 'acc-cue-balls',
    'acc-cloth': 'acc-cloth',
    'acc-chalk': 'acc-chalk',
    'acc-pure-chalk': 'acc-pure-chalk',
    'acc-gloves': 'acc-gloves',
    'acc-extensions': 'acc-extensions',
    'acc-tips': 'acc-tips',
    'acc-maintenance': 'acc-maintenance',
    'acc-holders': 'acc-holders',
    'acc-weight': 'acc-weight',
    'acc-joint-protectors': 'acc-joint-protectors',
    'acc-parts': 'acc-parts',
    'acc-towel': 'acc-towel',
    'acc-table': 'acc-table',
    'acc-cue': 'acc-cue',
    // Tables
    tables: 'tables',
    'tables-apex': 'tables-apex',
    'tables-arc': 'tables-arc',
    'tables-9ft': 'tables-9ft',
    'tables-8ft': 'tables-8ft',
    'tables-7ft': 'tables-7ft'
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

  if (normalizedName.includes('bk rush break cues')) {
    return 'bk-rush-break';
  }

  if (normalizedName.includes('bk rush jump break cues') || normalizedName.includes('bk rush jump/break')) {
    return 'bk-rush-jump-break';
  }

  if (normalizedName.includes('poison vx break jump cues') || normalizedName.includes('poison vx break')) {
    return 'poison-vx-break-jump';
  }

  if (normalizedName.includes('bk4 break cues')) {
    return 'bk4-break';
  }

  if (normalizedName.includes('air rush jump cues')) {
    return 'air-rush-jump';
  }

  if (normalizedName.includes('air ii jump cues')) {
    return 'air-ii-jump';
  }

  if (
    normalizedName.includes('break and jump') ||
    normalizedName.includes('break jump') ||
    normalizedName.includes('view all break')
  ) {
    return 'breakjump';
  }

  if (
    normalizedName.includes('view all pool cues') ||
    normalizedName.includes('all pool cues')
  ) {
    return 'allcues';
  }

  // ─── Shaft sub-categories ───
  if (normalizedName.includes('revo 11 8')) {
    return 'shafts-revo';
  }
  if (normalizedName.includes('revo 12 4')) {
    return 'shafts-revo';
  }
  if (normalizedName.includes('revo 12 9')) {
    return 'shafts-revo';
  }
  if (normalizedName.includes('centro hybrid') || normalizedName.includes('centro shaft')) {
    return 'shafts-centro';
  }
  if (normalizedName.includes('314 3 shaft')) {
    return 'shafts-314';
  }
  if (normalizedName.includes('z 3 shaft')) {
    return 'shafts-z3';
  }
  if (normalizedName.includes('vantage shaft')) {
    return 'shafts-vantage';
  }
  if (normalizedName.includes('bk2 break shaft')) {
    return 'shafts-bk2';
  }
  if (normalizedName.includes('view all carbon fiber') || normalizedName.includes('carbon fiber shafts')) {
    return 'shafts-carbon';
  }
  if (normalizedName.includes('view all maple') || normalizedName.includes('maple wood shafts')) {
    return 'shafts-maple';
  }
  if (
    normalizedName.includes('pool cue shafts') ||
    normalizedName.includes('view all shafts') ||
    normalizedName.includes('all shafts')
  ) {
    return 'shafts';
  }

  // ─── Case sub-categories ───
  if (normalizedName.includes('legacy cue cases')) {
    return 'cases-legacy';
  }
  if (normalizedName.includes('urbain cue cases')) {
    return 'cases-urbain';
  }
  if (normalizedName.includes('metro cue cases')) {
    return 'cases-metro';
  }
  if (normalizedName.includes('roadline cue cases')) {
    return 'cases-roadline';
  }
  if (normalizedName.includes('poison cases')) {
    return 'cases-poison';
  }
  if (normalizedName.includes('carom cue cases')) {
    return 'cases-carom';
  }
  if (normalizedName.includes('1 butt x 1 shaft')) {
    return 'cases-1x1';
  }
  if (normalizedName.includes('2 butts x 4 shafts')) {
    return 'cases-2x4';
  }
  if (normalizedName.includes('3 butts x 4 shafts')) {
    return 'cases-3x4';
  }
  if (normalizedName.includes('3 butts x 5 shafts')) {
    return 'cases-3x5';
  }
  if (normalizedName.includes('3 butts x 6 shafts')) {
    return 'cases-3x6';
  }
  if (normalizedName.includes('4 butts x 8 shafts')) {
    return 'cases-4x8';
  }
  if (
    normalizedName.includes('cue cases') ||
    normalizedName.includes('cases by line') ||
    normalizedName.includes('cases by size') ||
    normalizedName.includes('view all cases') ||
    normalizedName.includes('all cases')
  ) {
    return 'cases';
  }

  // ─── Accessory sub-categories ───
  if (normalizedName.includes('pool ball aerorack') || normalizedName.includes('aerorack')) {
    return 'acc-aerorack';
  }
  if (normalizedName.includes('pool balls') && !normalizedName.includes('aerorack')) {
    return 'acc-pool-balls';
  }
  if (normalizedName.includes('cue balls')) {
    return 'acc-cue-balls';
  }
  if (normalizedName.includes('pool table cloth')) {
    return 'acc-cloth';
  }
  if (normalizedName.includes('pure chalk')) {
    return 'acc-pure-chalk';
  }
  if (normalizedName.includes('billiard chalk')) {
    return 'acc-chalk';
  }
  if (normalizedName.includes('billiard gloves')) {
    return 'acc-gloves';
  }
  if (normalizedName.includes('pool cue extensions')) {
    return 'acc-extensions';
  }
  if (normalizedName.includes('pool cue tips')) {
    return 'acc-tips';
  }
  if (normalizedName.includes('cue maintenance')) {
    return 'acc-maintenance';
  }
  if (normalizedName.includes('pool cue holders')) {
    return 'acc-holders';
  }
  if (normalizedName.includes('weight adjustment')) {
    return 'acc-weight';
  }
  if (normalizedName.includes('joint protectors')) {
    return 'acc-joint-protectors';
  }
  if (normalizedName.includes('cue parts') || normalizedName.includes('spare cue bumpers')) {
    return 'acc-parts';
  }
  if (normalizedName.includes('billiard towel')) {
    return 'acc-towel';
  }
  if (normalizedName.includes('view all table accessories') || normalizedName.includes('table accessories')) {
    return 'acc-table';
  }
  if (normalizedName.includes('view all cue accessories') || normalizedName.includes('cue accessories')) {
    return 'acc-cue';
  }
  if (
    normalizedName.includes('billiard accessories') ||
    normalizedName.includes('view all accessories') ||
    normalizedName.includes('all accessories')
  ) {
    return 'accessories';
  }

  // ─── Table sub-categories ───
  if (normalizedName.includes('apex 9ft') || normalizedName.includes('apex 9 ft')) {
    return 'tables-apex';
  }
  if (normalizedName.includes('apex 7ft') || normalizedName.includes('apex 7 ft') || normalizedName.includes('apex')) {
    return 'tables-apex';
  }
  if (normalizedName.includes('view all arc') || normalizedName.includes('arc pool tables')) {
    return 'tables-arc';
  }
  if (normalizedName.includes('9 foot pool tables') || normalizedName.includes('9ft')) {
    return 'tables-9ft';
  }
  if (normalizedName.includes('8 foot pool tables') || normalizedName.includes('8ft')) {
    return 'tables-8ft';
  }
  if (normalizedName.includes('7 foot pool tables') || normalizedName.includes('7ft')) {
    return 'tables-7ft';
  }
  if (
    normalizedName.includes('billiard tables') ||
    normalizedName.includes('pool tables') ||
    normalizedName.includes('view all pool tables') ||
    normalizedName.includes('view all tables') ||
    normalizedName.includes('all tables')
  ) {
    return 'tables';
  }

  return null;
};
