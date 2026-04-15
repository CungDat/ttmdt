import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { normalizeSearchText } from '../utils/lineUtils';

export const useProductSearch = ({ productLineItems, onOpenLineDetailPage }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchPanelRef = useRef(null);
  const searchInputRef = useRef(null);

  const searchEntries = useMemo(
    () =>
      productLineItems.map((item) => ({
        id: `${item.sectionId}-${item.lineSlug}`,
        kind: 'product',
        title: item.name,
        subtitle: item.seriesTitle,
        seriesKey: item.seriesKey,
        sectionId: item.sectionId,
        lineSlug: item.lineSlug,
        searchText: normalizeSearchText(
          [
            item.name,
            item.brand,
            item.category,
            item.description,
            item.price,
            item.countInStock,
            item.specs?.joint,
            item.specs?.shaft,
            item.specs?.tip,
            item.specs?.weight
          ]
            .filter(Boolean)
            .join(' ')
        ),
        rank: 0
      })),
    [productLineItems]
  );

  const searchResults = useMemo(() => {
    const query = normalizeSearchText(searchQuery);

    if (!query) {
      return [];
    }

    const queryTokens = query.split(' ').filter(Boolean);
    const normalizedQuery = searchQuery.toLowerCase().trim();

    return searchEntries
      .filter((entry) => queryTokens.every((token) => entry.searchText.includes(token)))
      .sort((left, right) => {
        const leftExact = left.title.toLowerCase() === normalizedQuery;
        const rightExact = right.title.toLowerCase() === normalizedQuery;

        if (leftExact !== rightExact) {
          return leftExact ? -1 : 1;
        }

        const leftTokenHits = queryTokens.filter((token) => left.searchText.includes(token)).length;
        const rightTokenHits = queryTokens.filter((token) => right.searchText.includes(token)).length;

        if (leftTokenHits !== rightTokenHits) {
          return rightTokenHits - leftTokenHits;
        }

        if (left.seriesKey !== right.seriesKey) {
          if (left.seriesKey === 'product') {
            return -1;
          }

          if (right.seriesKey === 'product') {
            return 1;
          }
        }

        const rankDelta = left.rank - right.rank;

        if (rankDelta !== 0) {
          return rankDelta;
        }

        const titleDelta = left.title.localeCompare(right.title, 'vi');

        if (titleDelta !== 0) {
          return titleDelta;
        }

        return left.subtitle.localeCompare(right.subtitle, 'vi');
      })
      .slice(0, 12);
  }, [searchEntries, searchQuery]);

  const closeSearchPanel = useCallback(() => {
    setIsSearchOpen(false);
  }, []);

  const resetSearchPanel = useCallback(() => {
    setSearchQuery('');
    setIsSearchOpen(false);
  }, []);

  const handleSearchResultSelect = useCallback(
    (result) => {
      if (result.lineSlug) {
        onOpenLineDetailPage(result);
      }

      resetSearchPanel();
    },
    [onOpenLineDetailPage, resetSearchPanel]
  );

  const handleSearchKeyDown = useCallback(
    (event) => {
      if (event.key === 'Escape') {
        resetSearchPanel();
        return;
      }

      if (event.key === 'Enter' && searchResults.length > 0) {
        event.preventDefault();
        handleSearchResultSelect(searchResults[0]);
      }
    },
    [handleSearchResultSelect, resetSearchPanel, searchResults]
  );

  useEffect(() => {
    if (!isSearchOpen) {
      return;
    }

    searchInputRef.current?.focus();
    window.addEventListener('keydown', handleSearchKeyDown);

    return () => {
      window.removeEventListener('keydown', handleSearchKeyDown);
    };
  }, [handleSearchKeyDown, isSearchOpen]);

  return {
    isSearchOpen,
    setIsSearchOpen,
    searchQuery,
    setSearchQuery,
    searchPanelRef,
    searchInputRef,
    searchResults,
    handleSearchResultSelect,
    handleSearchKeyDown,
    closeSearchPanel,
    resetSearchPanel
  };
};
