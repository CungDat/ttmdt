/**
 * Advanced Search & Filter API
 * Tìm kiếm nâng cao theo tên, dòng cơ (shaft), loại ren, giá, tồn kho, phiên bản giới hạn
 */
const express = require('express');

const createSearchRouter = ({ ADMIN_LINE_MODELS, Inventory, ProductVariant }) => {
  const router = express.Router();

  // Normalize text for search
  const normalizeText = (value) =>
    String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();

  // ─── UNIFIED SEARCH ENDPOINT ───
  router.get('/', async (req, res) => {
    try {
      const query = normalizeText(req.query.q || '');
      const shaft = normalizeText(req.query.shaft || '');
      const thread = normalizeText(req.query.thread || '');
      const minPrice = Number(req.query.minPrice) || 0;
      const maxPrice = Number(req.query.maxPrice) || Infinity;
      const inStockOnly = req.query.inStock === 'true';
      const limitedOnly = req.query.limited === 'true';
      const lineType = String(req.query.lineType || '').trim().toLowerCase();
      const sortBy = String(req.query.sortBy || 'relevance').trim();
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));

      // Collect all products from all line models
      const allProducts = [];

      for (const [type, config] of Object.entries(ADMIN_LINE_MODELS)) {
        // Apply lineType filter if specified
        if (lineType && type !== lineType) continue;

        // Apply limited filter
        if (limitedOnly && type !== 'limited') continue;

        const items = await config.model.find({ isActive: true }).lean();

        items.forEach((item) => {
          const searchableText = normalizeText(
            [
              item.name,
              item.description,
              item.specs?.shaft,
              item.specs?.joint,
              item.specs?.tip,
              item.specs?.weight,
              item.specs?.thread,
              item.specs?.wrap,
              config.label,
              type
            ]
              .filter(Boolean)
              .join(' ')
          );

          allProducts.push({
            _id: item._id,
            name: item.name,
            price: Number(item.price || 0),
            image: item.image || (Array.isArray(item.images) && item.images[0]) || '',
            images: Array.isArray(item.images) ? item.images : item.image ? [item.image] : [],
            lineType: type,
            lineLabel: config.label,
            currencySymbol: item.currencySymbol || '$',
            isActive: item.isActive !== false,
            link: item.link || '/',
            order: item.order || 0,
            specs: item.specs || {},
            description: item.description || '',
            searchableText,
            lineSeriesImage: item.lineSeriesImage || '',
            isLimited: type === 'limited'
          });
        });
      }

      // Apply filters
      let filtered = allProducts;

      // Text search
      if (query) {
        const queryTokens = query.split(' ').filter(Boolean);
        filtered = filtered.filter((p) =>
          queryTokens.every((token) => p.searchableText.includes(token))
        );
      }

      // Shaft filter
      if (shaft) {
        const shaftTokens = shaft.split(' ').filter(Boolean);
        filtered = filtered.filter((p) => {
          const shaftText = normalizeText(p.specs?.shaft || '');
          return shaftTokens.every((token) => shaftText.includes(token));
        });
      }

      // Thread filter
      if (thread) {
        const threadTokens = thread.split(' ').filter(Boolean);
        filtered = filtered.filter((p) => {
          const threadText = normalizeText(
            [p.specs?.joint, p.specs?.thread].filter(Boolean).join(' ')
          );
          return threadTokens.every((token) => threadText.includes(token));
        });
      }

      // Price range filter
      if (minPrice > 0 || maxPrice < Infinity) {
        filtered = filtered.filter((p) => p.price >= minPrice && p.price <= maxPrice);
      }

      // Stock check
      if (inStockOnly) {
        // Get inventory data for remaining products
        const productIds = filtered.map((p) => p._id);
        const inventoryDocs = await Inventory.find({
          productId: { $in: productIds },
          quantity: { $gt: 0 }
        })
          .select('productId quantity reserved')
          .lean();

        const inStockIds = new Set(
          inventoryDocs
            .filter((doc) => Number(doc.quantity || 0) - Number(doc.reserved || 0) > 0)
            .map((doc) => String(doc.productId))
        );

        filtered = filtered.filter((p) => inStockIds.has(String(p._id)));
      }

      // Sorting
      switch (sortBy) {
        case 'price-asc':
          filtered.sort((a, b) => a.price - b.price);
          break;
        case 'price-desc':
          filtered.sort((a, b) => b.price - a.price);
          break;
        case 'name-asc':
          filtered.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
          break;
        case 'name-desc':
          filtered.sort((a, b) => b.name.localeCompare(a.name, 'vi'));
          break;
        case 'relevance':
        default:
          // Keep original order for relevance (query match already sorted)
          if (query) {
            const queryLower = query.toLowerCase();
            filtered.sort((a, b) => {
              const aExact = a.name.toLowerCase().includes(queryLower);
              const bExact = b.name.toLowerCase().includes(queryLower);
              if (aExact !== bExact) return aExact ? -1 : 1;
              return a.order - b.order;
            });
          }
          break;
      }

      // Pagination
      const totalResults = filtered.length;
      const totalPages = Math.ceil(totalResults / limit);
      const startIndex = (page - 1) * limit;
      const paginatedResults = filtered.slice(startIndex, startIndex + limit);

      // Clean up searchable text from response
      const results = paginatedResults.map(({ searchableText, ...rest }) => rest);

      // Available line types for filter sidebar
      const availableLineTypes = [...new Set(allProducts.map((p) => p.lineType))].map((type) => ({
        value: type,
        label: ADMIN_LINE_MODELS[type]?.label || type
      }));

      // Price range info
      const priceRange = {
        min: allProducts.length > 0 ? Math.min(...allProducts.map((p) => p.price)) : 0,
        max: allProducts.length > 0 ? Math.max(...allProducts.map((p) => p.price)) : 0
      };

      return res.json({
        results,
        totalResults,
        totalPages,
        currentPage: page,
        limit,
        filters: {
          availableLineTypes,
          priceRange
        }
      });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  });

  // ─── SEARCH SUGGESTIONS (autocomplete) ───
  router.get('/suggest', async (req, res) => {
    try {
      const query = normalizeText(req.query.q || '');
      if (!query || query.length < 2) {
        return res.json({ suggestions: [] });
      }

      const queryTokens = query.split(' ').filter(Boolean);
      const suggestions = [];

      for (const [type, config] of Object.entries(ADMIN_LINE_MODELS)) {
        const items = await config.model
          .find({ isActive: true })
          .select('name price image images')
          .lean();

        items.forEach((item) => {
          const nameText = normalizeText(item.name);
          if (queryTokens.every((token) => nameText.includes(token))) {
            suggestions.push({
              _id: item._id,
              name: item.name,
              price: Number(item.price || 0),
              image: item.image || (Array.isArray(item.images) && item.images[0]) || '',
              lineType: type,
              lineLabel: config.label
            });
          }
        });

        if (suggestions.length >= 8) break;
      }

      return res.json({ suggestions: suggestions.slice(0, 8) });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  });

  return router;
};

module.exports = createSearchRouter;
