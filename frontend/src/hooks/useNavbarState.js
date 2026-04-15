import { useEffect, useState } from 'react';

const navItems = [
  { label: 'Cues', type: 'cues' },
  { label: 'Shafts', type: 'shafts' },
  { label: 'Cases', type: 'cases' },
  { label: 'Accessories', type: 'accessories' },
  { label: 'Tables', type: 'tables' },
  { label: 'Support', type: null }
];

export const useNavbarState = ({
  cueCategories,
  tableCategories,
  shaftCategories,
  caseCategories,
  accessoryCategories
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 24);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const getCategoriesByType = (type) => {
    switch (type) {
      case 'cues':
        return cueCategories;
      case 'shafts':
        return shaftCategories;
      case 'cases':
        return caseCategories;
      case 'accessories':
        return accessoryCategories;
      case 'tables':
        return tableCategories;
      default:
        return [];
    }
  };

  return {
    isScrolled,
    activeMenu,
    setActiveMenu,
    navItems,
    getCategoriesByType
  };
};
