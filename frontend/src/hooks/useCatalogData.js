import { useEffect, useState } from 'react';
import axios from 'axios';

export const useCatalogData = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [banners, setBanners] = useState([]);
  const [trueSpliceLines, setTrueSpliceLines] = useState([]);
  const [p3Lines, setP3Lines] = useState([]);
  const [poisonMaeliths, setPoisonMaeliths] = useState([]);
  const [poisonCandies, setPoisonCandies] = useState([]);
  const [limitedEditions, setLimitedEditions] = useState([]);
  const [products, setProducts] = useState([]);
  const [cueCategories, setCueCategories] = useState([]);
  const [tableCategories, setTableCategories] = useState([]);
  const [shaftCategories, setShaftCategories] = useState([]);
  const [caseCategories, setCaseCategories] = useState([]);
  const [accessoryCategories, setAccessoryCategories] = useState([]);

  const fetchCollection = async (request, setter, fallbackValue = []) => {
    try {
      const response = await request;
      setter(Array.isArray(response.data) ? response.data : fallbackValue);
    } catch (error) {
      console.error('Loi lay du lieu:', error);
      setter(fallbackValue);
    }
  };

  useEffect(() => {
    const loadCatalog = async () => {
      await Promise.all([
        fetchCollection(axios.get('http://localhost:5000/api/banners'), setBanners),
        fetchCollection(axios.get('http://localhost:5000/api/products'), setProducts),
        fetchCollection(axios.get('http://localhost:5000/api/truesplice-lines'), setTrueSpliceLines),
        fetchCollection(axios.get('http://localhost:5000/api/p3-lines'), setP3Lines),
        fetchCollection(axios.get('http://localhost:5000/api/limited-editions'), setLimitedEditions),
        fetchCollection(axios.get('http://localhost:5000/api/poison-maeliths'), setPoisonMaeliths),
        fetchCollection(axios.get('http://localhost:5000/api/poison-candies'), setPoisonCandies),
        fetchCollection(axios.get('http://localhost:5000/api/cue-categories'), setCueCategories),
        fetchCollection(axios.get('http://localhost:5000/api/table-categories'), setTableCategories),
        fetchCollection(axios.get('http://localhost:5000/api/shaft-categories'), setShaftCategories),
        fetchCollection(axios.get('http://localhost:5000/api/case-categories'), setCaseCategories),
        fetchCollection(axios.get('http://localhost:5000/api/accessory-categories'), setAccessoryCategories)
      ]);

      setIsLoading(false);
    };

    loadCatalog();
  }, []);

  return {
    banners,
    isLoading,
    trueSpliceLines,
    p3Lines,
    poisonMaeliths,
    poisonCandies,
    limitedEditions,
    products,
    cueCategories,
    tableCategories,
    shaftCategories,
    caseCategories,
    accessoryCategories
  };
};
