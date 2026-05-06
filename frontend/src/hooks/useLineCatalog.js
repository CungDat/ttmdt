import { useMemo } from 'react';
import { createLineSlug, parseLineRoute } from '../utils/lineUtils';

const normalize = (value) => String(value || '').toLowerCase();

const filterByKeywords = (items, keywords) =>
  items.filter((item) => {
    const itemName = normalize(item?.name);
    return keywords.every((keyword) => itemName.includes(keyword));
  });

const filterByAnyKeyword = (items, keywords) =>
  items.filter((item) => {
    const itemName = normalize(item?.name);
    return keywords.some((keyword) => itemName.includes(keyword));
  });

export const useLineCatalog = ({
  pathname,
  products,
  trueSpliceLines,
  p3Lines,
  limitedEditions,
  poisonMaeliths,
  poisonCandies,
  breakJumpLines,
  shaftLines = [],
  caseLines = [],
  accessoryLines = [],
  tableLines = []
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

    // ─── Break & Jump sub-collections ───
    const breakJumpSource = Array.isArray(breakJumpLines) ? breakJumpLines : [];

    const bkRushBreak = breakJumpSource.filter((item) => {
      const n = normalize(item?.name);
      return n.includes('bk rush') && !n.includes('jump');
    });
    const bkRushJumpBreak = breakJumpSource.filter((item) => {
      const n = normalize(item?.name);
      return n.includes('bk rush') && n.includes('jump');
    });
    const poisonVxBreakJump = breakJumpSource.filter((item) => {
      const n = normalize(item?.name);
      return n.includes('poison vx') || (n.includes('vx') && (n.includes('break') || n.includes('jump')));
    });
    const bk4Break = filterByKeywords(breakJumpSource, ['bk4']);
    const airRushJump = filterByKeywords(breakJumpSource, ['air rush']);
    const airIiJump = breakJumpSource.filter((item) => {
      const n = normalize(item?.name);
      return n.includes('air ii') || n.includes('air 2') || n.includes('air2');
    });

    // ─── Shaft sub-collections ───
    const shaftSource = Array.isArray(shaftLines) ? shaftLines : [];
    const shaftsRevo = filterByAnyKeyword(shaftSource, ['revo']);
    const shaftsCentro = filterByAnyKeyword(shaftSource, ['centro']);
    const shafts314 = filterByAnyKeyword(shaftSource, ['314']);
    const shaftsZ3 = filterByAnyKeyword(shaftSource, ['z-3', 'z3']);
    const shaftsVantage = filterByAnyKeyword(shaftSource, ['vantage']);
    const shaftsBk2 = filterByAnyKeyword(shaftSource, ['bk-r', 'bk2', 'bk rush']);
    const shaftsCarbonFiber = filterByAnyKeyword(shaftSource, ['revo', 'carbon fiber']);
    const shaftsMaple = shaftSource.filter((item) => {
      const n = normalize(item?.name);
      return !n.includes('revo') && !n.includes('carbon fiber');
    });

    // ─── Case sub-collections ───
    const caseSource = Array.isArray(caseLines) ? caseLines : [];
    const casesLegacy = filterByAnyKeyword(caseSource, ['legacy']);
    const casesUrbain = filterByAnyKeyword(caseSource, ['urbain']);
    const casesMetro = filterByAnyKeyword(caseSource, ['metro']);
    const casesRoadline = filterByAnyKeyword(caseSource, ['roadline']);
    const casesPoison = filterByAnyKeyword(caseSource, ['poison']);
    const casesCarom = filterByAnyKeyword(caseSource, ['carom']);
    const cases1x1 = filterByAnyKeyword(caseSource, ['1 butt x 1 shaft', '1b1s', '1 butt 1 shaft']);
    const cases2x4 = filterByAnyKeyword(caseSource, ['2 butts x 4 shafts', '2b4s', '2x4']);
    const cases3x4 = filterByAnyKeyword(caseSource, ['3 butts x 4 shafts', '3b4s']);
    const cases3x5 = filterByAnyKeyword(caseSource, ['3 butts x 5 shafts', '3b5s', '3x5']);
    const cases3x6 = filterByAnyKeyword(caseSource, ['3 butts x 6 shafts', '3b6s', '3x6']);
    const cases4x8 = filterByAnyKeyword(caseSource, ['4 butts x 8 shafts', '4b8s', '4x8']);

    // ─── Accessory sub-collections ───
    const accSource = Array.isArray(accessoryLines) ? accessoryLines : [];
    const accAerorack = filterByAnyKeyword(accSource, ['aerorack', 'aero rack']);
    const accPoolBalls = filterByAnyKeyword(accSource, ['arcos', 'pool ball']);
    const accCueBalls = filterByAnyKeyword(accSource, ['cue ball']);
    const accCloth = filterByAnyKeyword(accSource, ['cloth', 'arcadia']);
    const accChalk = filterByAnyKeyword(accSource, ['chalk', 'pure chalk']);
    const accPureChalk = filterByKeywords(accSource, ['pure chalk']);
    const accGloves = filterByAnyKeyword(accSource, ['glove']);
    const accExtensions = filterByAnyKeyword(accSource, ['extension']);
    const accTips = filterByAnyKeyword(accSource, ['tip']);
    const accMaintenance = filterByAnyKeyword(accSource, ['maintenance', 'clean', 'cue silk']);
    const accHolders = filterByAnyKeyword(accSource, ['holder']);
    const accWeight = filterByAnyKeyword(accSource, ['weight']);
    const accJointProtectors = filterByAnyKeyword(accSource, ['joint protector']);
    const accParts = filterByAnyKeyword(accSource, ['parts', 'ferrule', 'bumper']);
    const accTowel = filterByAnyKeyword(accSource, ['towel']);
    const accTableAccessories = [...accAerorack, ...accPoolBalls, ...accCueBalls, ...accCloth, ...accChalk];
    const accCueAccessories = [...accGloves, ...accExtensions, ...accTips, ...accMaintenance, ...accHolders, ...accWeight, ...accJointProtectors, ...accParts, ...accTowel];

    // ─── Table sub-collections ───
    const tableSource = Array.isArray(tableLines) ? tableLines : [];
    const tablesApex = filterByAnyKeyword(tableSource, ['apex']);
    const tablesArc = filterByAnyKeyword(tableSource, ['arc']);
    const tables9ft = tableSource.filter((item) => {
      const n = normalize(item?.name);
      return n.includes('9ft') || n.includes('9-foot') || n.includes('9 ft');
    });
    const tables8ft = tableSource.filter((item) => {
      const n = normalize(item?.name);
      return n.includes('8ft') || n.includes('8-foot') || n.includes('8 ft');
    });
    const tables7ft = tableSource.filter((item) => {
      const n = normalize(item?.name);
      return n.includes('7ft') || n.includes('7-foot') || n.includes('7 ft');
    });

    // ─── Map all collections ───
    const productItems = mapCollection(products, 'Products', 'product', 'section-products');
    const truespliceItems = mapCollection(trueSpliceLines, 'TrueSplice Collection', 'truesplice', 'section-truesplice');
    const p3Items = mapCollection(p3Lines, 'Predator P3 Series', 'p3', 'section-p3');
    const maelithItems = mapCollection(poisonMaeliths, 'Poison Maelith Series', 'maelith', 'section-maelith');
    const candyItems = mapCollection(poisonCandies, 'Poison Candy Series', 'candy', 'section-candy');
    const breakjumpItems = mapCollection(breakJumpSource, 'Break & Jump Cues', 'breakjump', 'section-break-jump');
    const bkRushBreakItems = mapCollection(bkRushBreak, 'BK RUSH Break Cues', 'bk-rush-break', 'section-break-jump');
    const bkRushJumpBreakItems = mapCollection(bkRushJumpBreak, 'BK RUSH Jump/Break Cues', 'bk-rush-jump-break', 'section-break-jump');
    const poisonVxItems = mapCollection(poisonVxBreakJump, 'Poison VX Break & Jump Cues', 'poison-vx-break-jump', 'section-break-jump');
    const bk4BreakItems = mapCollection(bk4Break, 'BK4 Break Cues', 'bk4-break', 'section-break-jump');
    const airRushJumpItems = mapCollection(airRushJump, 'AIR RUSH Jump Cues', 'air-rush-jump', 'section-break-jump');
    const airIiJumpItems = mapCollection(airIiJump, 'AIR II Jump Cues', 'air-ii-jump', 'section-break-jump');
    const limitedItems = mapCollection(limitedEditions, 'Limited Editions', 'limited', 'section-limited');

    // Shaft collections
    const shaftItems = mapCollection(shaftSource, 'Pool Cue Shafts', 'shafts', 'section-shafts');
    const shaftsRevoItems = mapCollection(shaftsRevo, 'REVO Carbon Fiber Shafts', 'shafts-revo', 'section-shafts');
    const shaftsCentroItems = mapCollection(shaftsCentro, 'Centro Hybrid Shafts', 'shafts-centro', 'section-shafts');
    const shafts314Items = mapCollection(shafts314, '314-3 Shafts', 'shafts-314', 'section-shafts');
    const shaftsZ3Items = mapCollection(shaftsZ3, 'Z-3 Shafts', 'shafts-z3', 'section-shafts');
    const shaftsVantageItems = mapCollection(shaftsVantage, 'Vantage Shafts', 'shafts-vantage', 'section-shafts');
    const shaftsBk2Items = mapCollection(shaftsBk2, 'BK2 Break Shafts', 'shafts-bk2', 'section-shafts');
    const shaftsCarbonItems = mapCollection(shaftsCarbonFiber, 'Carbon Fiber Shafts', 'shafts-carbon', 'section-shafts');
    const shaftsMapleItems = mapCollection(shaftsMaple, 'Maple Wood Shafts', 'shafts-maple', 'section-shafts');

    // Case collections
    const caseItems = mapCollection(caseSource, 'Cue Cases', 'cases', 'section-cases');
    const casesLegacyItems = mapCollection(casesLegacy, 'Legacy Cue Cases', 'cases-legacy', 'section-cases');
    const casesUrbainItems = mapCollection(casesUrbain, 'Urbain Cue Cases', 'cases-urbain', 'section-cases');
    const casesMetroItems = mapCollection(casesMetro, 'Metro Cue Cases', 'cases-metro', 'section-cases');
    const casesRoadlineItems = mapCollection(casesRoadline, 'Roadline Cue Cases', 'cases-roadline', 'section-cases');
    const casesPoisonItems = mapCollection(casesPoison, 'Poison Cases', 'cases-poison', 'section-cases');
    const casesCaromItems = mapCollection(casesCarom, 'Carom Cue Cases', 'cases-carom', 'section-cases');
    const cases1x1Items = mapCollection(cases1x1, '1 Butt x 1 Shaft Cases', 'cases-1x1', 'section-cases');
    const cases2x4Items = mapCollection(cases2x4, '2 Butts x 4 Shafts Cases', 'cases-2x4', 'section-cases');
    const cases3x4Items = mapCollection(cases3x4, '3 Butts x 4 Shafts Cases', 'cases-3x4', 'section-cases');
    const cases3x5Items = mapCollection(cases3x5, '3 Butts x 5 Shafts Cases', 'cases-3x5', 'section-cases');
    const cases3x6Items = mapCollection(cases3x6, '3 Butts x 6 Shafts Cases', 'cases-3x6', 'section-cases');
    const cases4x8Items = mapCollection(cases4x8, '4 Butts x 8 Shafts Cases', 'cases-4x8', 'section-cases');

    // Accessory collections
    const accessoryItems = mapCollection(accSource, 'Billiard Accessories', 'accessories', 'section-accessories');
    const accAerorackItems = mapCollection(accAerorack, 'Pool Ball AeroRack', 'acc-aerorack', 'section-accessories');
    const accPoolBallsItems = mapCollection(accPoolBalls, 'Pool Balls', 'acc-pool-balls', 'section-accessories');
    const accCueBallsItems = mapCollection(accCueBalls, 'Cue Balls', 'acc-cue-balls', 'section-accessories');
    const accClothItems = mapCollection(accCloth, 'Pool Table Cloth', 'acc-cloth', 'section-accessories');
    const accChalkItems = mapCollection(accChalk, 'Billiard Chalk', 'acc-chalk', 'section-accessories');
    const accPureChalkItems = mapCollection(accPureChalk, 'Pure Chalk', 'acc-pure-chalk', 'section-accessories');
    const accGlovesItems = mapCollection(accGloves, 'Billiard Gloves', 'acc-gloves', 'section-accessories');
    const accExtensionsItems = mapCollection(accExtensions, 'Pool Cue Extensions', 'acc-extensions', 'section-accessories');
    const accTipsItems = mapCollection(accTips, 'Pool Cue Tips', 'acc-tips', 'section-accessories');
    const accMaintenanceItems = mapCollection(accMaintenance, 'Cue Maintenance', 'acc-maintenance', 'section-accessories');
    const accHoldersItems = mapCollection(accHolders, 'Pool Cue Holders', 'acc-holders', 'section-accessories');
    const accWeightItems = mapCollection(accWeight, 'Weight Adjustment', 'acc-weight', 'section-accessories');
    const accJointProtectorsItems = mapCollection(accJointProtectors, 'Joint Protectors', 'acc-joint-protectors', 'section-accessories');
    const accPartsItems = mapCollection(accParts, 'Cue Parts & Accessories', 'acc-parts', 'section-accessories');
    const accTowelItems = mapCollection(accTowel, 'Billiard Towel', 'acc-towel', 'section-accessories');
    const accTableItems = mapCollection(accTableAccessories, 'Table Accessories', 'acc-table', 'section-accessories');
    const accCueItems = mapCollection(accCueAccessories, 'Cue Accessories', 'acc-cue', 'section-accessories');

    // Table collections
    const tableItems = mapCollection(tableSource, 'Billiard Tables', 'tables', 'section-tables');
    const tablesApexItems = mapCollection(tablesApex, 'Apex Pool Tables', 'tables-apex', 'section-tables');
    const tablesArcItems = mapCollection(tablesArc, 'Arc Pool Tables', 'tables-arc', 'section-tables');
    const tables9ftItems = mapCollection(tables9ft, '9-Foot Pool Tables', 'tables-9ft', 'section-tables');
    const tables8ftItems = mapCollection(tables8ft, '8-Foot Pool Tables', 'tables-8ft', 'section-tables');
    const tables7ftItems = mapCollection(tables7ft, '7-Foot Pool Tables', 'tables-7ft', 'section-tables');

    // ─── All Cues deduped ───
    const allCuesDeduped = [];
    const seenSlugs = new Set();
    const allSourceArrays = [
      productItems, truespliceItems, p3Items, maelithItems, candyItems,
      limitedItems, breakjumpItems
    ];
    for (const arr of allSourceArrays) {
      for (const item of arr) {
        if (!seenSlugs.has(item.lineSlug)) {
          seenSlugs.add(item.lineSlug);
          allCuesDeduped.push({ ...item, seriesTitle: 'All Pool Cues', seriesKey: 'allcues' });
        }
      }
    }

    return {
      product: productItems,
      truesplice: truespliceItems,
      p3: p3Items,
      maelith: maelithItems,
      candy: candyItems,
      breakjump: breakjumpItems,
      'bk-rush-break': bkRushBreakItems,
      'bk-rush-jump-break': bkRushJumpBreakItems,
      'poison-vx-break-jump': poisonVxItems,
      'bk4-break': bk4BreakItems,
      'air-rush-jump': airRushJumpItems,
      'air-ii-jump': airIiJumpItems,
      limited: limitedItems,
      allcues: allCuesDeduped,
      // Shafts
      shafts: shaftItems,
      'shafts-revo': shaftsRevoItems,
      'shafts-centro': shaftsCentroItems,
      'shafts-314': shafts314Items,
      'shafts-z3': shaftsZ3Items,
      'shafts-vantage': shaftsVantageItems,
      'shafts-bk2': shaftsBk2Items,
      'shafts-carbon': shaftsCarbonItems,
      'shafts-maple': shaftsMapleItems,
      // Cases
      cases: caseItems,
      'cases-legacy': casesLegacyItems,
      'cases-urbain': casesUrbainItems,
      'cases-metro': casesMetroItems,
      'cases-roadline': casesRoadlineItems,
      'cases-poison': casesPoisonItems,
      'cases-carom': casesCaromItems,
      'cases-1x1': cases1x1Items,
      'cases-2x4': cases2x4Items,
      'cases-3x4': cases3x4Items,
      'cases-3x5': cases3x5Items,
      'cases-3x6': cases3x6Items,
      'cases-4x8': cases4x8Items,
      // Accessories
      accessories: accessoryItems,
      'acc-aerorack': accAerorackItems,
      'acc-pool-balls': accPoolBallsItems,
      'acc-cue-balls': accCueBallsItems,
      'acc-cloth': accClothItems,
      'acc-chalk': accChalkItems,
      'acc-pure-chalk': accPureChalkItems,
      'acc-gloves': accGlovesItems,
      'acc-extensions': accExtensionsItems,
      'acc-tips': accTipsItems,
      'acc-maintenance': accMaintenanceItems,
      'acc-holders': accHoldersItems,
      'acc-weight': accWeightItems,
      'acc-joint-protectors': accJointProtectorsItems,
      'acc-parts': accPartsItems,
      'acc-towel': accTowelItems,
      'acc-table': accTableItems,
      'acc-cue': accCueItems,
      // Tables
      tables: tableItems,
      'tables-apex': tablesApexItems,
      'tables-arc': tablesArcItems,
      'tables-9ft': tables9ftItems,
      'tables-8ft': tables8ftItems,
      'tables-7ft': tables7ftItems
    };
  }, [p3Lines, poisonCandies, poisonMaeliths, breakJumpLines, products, trueSpliceLines, limitedEditions, shaftLines, caseLines, accessoryLines, tableLines]);

  const productLineItems = useMemo(
    () => [
      ...lineCollections.product,
      ...lineCollections.truesplice,
      ...lineCollections.p3,
      ...lineCollections.maelith,
      ...lineCollections.candy,
      ...lineCollections.breakjump,
      ...lineCollections['bk-rush-break'],
      ...lineCollections['bk-rush-jump-break'],
      ...lineCollections['poison-vx-break-jump'],
      ...lineCollections['bk4-break'],
      ...lineCollections['air-rush-jump'],
      ...lineCollections['air-ii-jump'],
      ...lineCollections.limited,
      ...lineCollections.shafts,
      ...lineCollections.cases,
      ...lineCollections.accessories,
      ...lineCollections.tables
    ],
    [lineCollections]
  );

  const lineLookup = useMemo(() => {
    const map = new Map();
    // Include items from ALL collections (parent AND sub-collections)
    // so that lineSlug resolution works for sub-collection detail pages
    const allCollectionKeys = Object.keys(lineCollections);
    for (const key of allCollectionKeys) {
      const items = lineCollections[key];
      if (Array.isArray(items)) {
        for (const item of items) {
          if (item.lineSlug && !map.has(item.lineSlug)) {
            map.set(item.lineSlug, item);
          }
        }
      }
    }
    return map;
  }, [lineCollections]);

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
