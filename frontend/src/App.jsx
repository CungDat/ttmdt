import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import CartDrawer from './components/CartDrawer';
import BankTransferModal from './components/BankTransferModal';
import OrdersDrawer from './components/OrdersDrawer';
import HomePage from './pages/HomePage';
import LineSeriesPage from './pages/LineSeriesPage';
import LineDetailPage from './pages/LineDetailPage';
import AdminPage from './pages/AdminPage';
import { useCatalogData } from './hooks/useCatalogData';
import { useProductSearch } from './hooks/useProductSearch';
import { useLineCatalog } from './hooks/useLineCatalog';
import { useNavbarState } from './hooks/useNavbarState';
import { getMenuSeriesKey } from './utils/lineUtils';
import './App.css';

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('lab_billiard_token') || '');
  const [currentUser, setCurrentUser] = useState(() => {
    const cached = localStorage.getItem('lab_billiard_user');
    return cached ? JSON.parse(cached) : null;
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccessMessage, setAuthSuccessMessage] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [isBankTransferOpen, setIsBankTransferOpen] = useState(false);
  const [pendingTransferReference, setPendingTransferReference] = useState('');
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);
  const [isCheckoutSubmitting, setIsCheckoutSubmitting] = useState(false);
  const [orders, setOrders] = useState([]);
  const [cartError, setCartError] = useState('');
  const [shippingInfo, setShippingInfo] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    city: '',
    country: 'Vietnam',
    postalCode: ''
  });
  const [paymentInfo, setPaymentInfo] = useState({
    method: 'cod',
    bankName: '',
    accountNumber: '',
    accountHolder: ''
  });
  const [cartItems, setCartItems] = useState(() => {
    const cached = localStorage.getItem('lab_billiard_cart');
    return cached ? JSON.parse(cached) : [];
  });

  const {
    isLoading,
    banners,
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
  } = useCatalogData();

  const poisonMaelithVideoSrc = encodeURI(
    '/Every player has their Poison.Candy 🍬 Maelith 🌒 VX Break ⚡️Which world are you stepping into.mp4'
  );

  const {
    isScrolled,
    activeMenu,
    setActiveMenu,
    navItems,
    getCategoriesByType
  } = useNavbarState({
    cueCategories,
    tableCategories,
    shaftCategories,
    caseCategories,
    accessoryCategories
  });

  const {
    lineRoute,
    lineCollections,
    productLineItems,
    selectedLine,
    selectedSeriesItems,
    selectedSeriesTitle
  } = useLineCatalog({
    pathname: location.pathname,
    products,
    trueSpliceLines,
    p3Lines,
    limitedEditions,
    poisonMaeliths,
    poisonCandies
  });

  const openLineDetailPageBase = useCallback((lineItem) => {
    navigate(`/line/${lineItem.seriesKey}/${lineItem.lineSlug}`);
  }, [navigate]);

  const {
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
  } = useProductSearch({
    productLineItems,
    onOpenLineDetailPage: openLineDetailPageBase
  });

  const openLineDetailPage = (lineItem) => {
    resetSearchPanel();
    openLineDetailPageBase(lineItem);
  };

  const openLineSeriesPage = (seriesKey) => {
    navigate(`/line/${seriesKey}`);
    resetSearchPanel();
  };

  const openAdminPage = () => {
    navigate('/admin');
  };

  useEffect(() => {
    if (!authToken) {
      return;
    }

    let cancelled = false;

    const syncAuthUser = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/auth/me', {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        });

        if (cancelled) {
          return;
        }

        setCurrentUser(response.data.user);
        localStorage.setItem('lab_billiard_user', JSON.stringify(response.data.user));
      } catch (error) {
        if (cancelled) {
          return;
        }

        setAuthToken('');
        setCurrentUser(null);
        localStorage.removeItem('lab_billiard_token');
        localStorage.removeItem('lab_billiard_user');
      }
    };

    syncAuthUser();

    return () => {
      cancelled = true;
    };
  }, [authToken]);

  useEffect(() => {
    if (!authSuccessMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setAuthSuccessMessage('');
    }, 3000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [authSuccessMessage]);

  useEffect(() => {
    localStorage.setItem('lab_billiard_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    if (currentUser?.name) {
      setShippingInfo((prev) => (prev.fullName ? prev : { ...prev, fullName: currentUser.name }));
    }
  }, [currentUser]);

  useEffect(() => {
    setIsCartOpen(false);
    setIsOrdersOpen(false);
  }, [location.pathname]);

  const cartItemCount = cartItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  const createTransferReference = () => {
    const stamp = Date.now().toString().slice(-6);
    const rand = Math.floor(Math.random() * 900 + 100);
    return `LAB-${stamp}-${rand}`;
  };

  const handleAuthSubmit = async ({ mode, name, email, password }) => {
    setIsAuthSubmitting(true);
    setAuthError('');

    if (mode === 'register' && /\d/.test((name || '').trim())) {
      setAuthError('Name cannot contain numbers.');
      setIsAuthSubmitting(false);
      return;
    }

    try {
      const endpoint = mode === 'login' ? 'login' : 'register';
      const payload = mode === 'login' ? { email, password } : { name, email, password };

      const response = await axios.post(`http://localhost:5000/api/auth/${endpoint}`, payload);

      setAuthToken(response.data.token);
      setCurrentUser(response.data.user);
      setShippingInfo((prev) => ({
        ...prev,
        fullName: response.data.user?.name || prev.fullName
      }));
      localStorage.setItem('lab_billiard_token', response.data.token);
      localStorage.setItem('lab_billiard_user', JSON.stringify(response.data.user));
      if (mode === 'register') {
        setAuthSuccessMessage('Sign up successful. Welcome to Lab Billiard!');
      }
      setIsAuthModalOpen(false);
    } catch (error) {
      setAuthError(error?.response?.data?.message || 'Authentication failed. Please try again.');
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleAddToCart = (lineItem) => {
    if (!currentUser) {
      setAuthError('Please log in to buy this product.');
      setIsAuthModalOpen(true);
      return;
    }

    setCartError('');

    const itemId = lineItem.lineSlug || lineItem._id || lineItem.slug || lineItem.name;

    setCartItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === itemId);

      if (existingIndex !== -1) {
        return prev.map((item, index) => (
          index === existingIndex
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      }

      return [
        ...prev,
        {
          id: itemId,
          name: lineItem.name,
          seriesTitle: lineItem.seriesTitle,
          price: Number(lineItem.price || 0),
          image: lineItem.image || (Array.isArray(lineItem.images) ? lineItem.images[0] : ''),
          quantity: 1
        }
      ];
    });

    setAuthSuccessMessage(`${lineItem.name} added to cart.`);
    setIsCartOpen(true);
  };

  const handleIncreaseCartItem = (itemId) => {
    setCartItems((prev) => prev.map((item) => (
      item.id === itemId ? { ...item, quantity: item.quantity + 1 } : item
    )));
  };

  const handleDecreaseCartItem = (itemId) => {
    setCartItems((prev) => prev
      .map((item) => (
        item.id === itemId ? { ...item, quantity: item.quantity - 1 } : item
      ))
      .filter((item) => item.quantity > 0));
  };

  const handleRemoveCartItem = (itemId) => {
    setCartItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handleOpenOrders = async () => {
    if (!currentUser || !authToken) {
      setAuthError('Please log in to view your orders.');
      setIsAuthModalOpen(true);
      return;
    }

    setIsOrdersOpen(true);
    setIsOrdersLoading(true);

    try {
      const response = await axios.get('http://localhost:5000/api/orders/my', {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });

      setOrders(Array.isArray(response.data?.orders) ? response.data.orders : []);
    } catch (error) {
      setAuthError(error?.response?.data?.message || 'Unable to load orders. Please try again.');
      setIsOrdersOpen(false);
    } finally {
      setIsOrdersLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!currentUser) {
      setAuthError('Please log in to complete checkout.');
      setIsAuthModalOpen(true);
      return;
    }

    if (cartItems.length === 0) {
      setAuthSuccessMessage('Your cart is empty.');
      return;
    }

    const shippingFields = {
      fullName: shippingInfo.fullName.trim(),
      phone: shippingInfo.phone.trim(),
      addressLine1: shippingInfo.addressLine1.trim(),
      city: shippingInfo.city.trim(),
      country: shippingInfo.country.trim(),
      postalCode: shippingInfo.postalCode.trim()
    };
    const paymentFields = {
      method: paymentInfo.method,
      bankName: paymentInfo.bankName.trim(),
      accountNumber: paymentInfo.accountNumber.trim(),
      accountHolder: paymentInfo.accountHolder.trim()
    };

    if (Object.values(shippingFields).some((value) => !value)) {
      setCartError('Please fill in the shipping address details.');
      return;
    }

    if (paymentFields.method === 'bank-transfer') {
      setCartError('');
      setPendingTransferReference(createTransferReference());
      setIsBankTransferOpen(true);
      return;
    }

    const createOrder = async (method) => {
      const response = await axios.post(
        'http://localhost:5000/api/orders',
        {
          items: cartItems,
          currencySymbol: '$',
          shippingAddress: shippingFields,
          payment: { method }
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );

      const createdOrder = response.data?.order;
      setOrders((prev) => (createdOrder ? [createdOrder, ...prev] : prev));
      setCartItems([]);
      setIsCartOpen(false);
      setIsBankTransferOpen(false);
      setAuthSuccessMessage(`Order placed successfully. Order #${String(createdOrder?._id || '').slice(-8).toUpperCase()}`);
    };

    setIsCheckoutSubmitting(true);
    setCartError('');

    try {
      await createOrder('cod');
    } catch (error) {
      setAuthError(error?.response?.data?.message || 'Checkout failed. Please try again.');
      setIsAuthModalOpen(true);
    } finally {
      setIsCheckoutSubmitting(false);
    }
  };

  const handleConfirmBankTransferPaid = async () => {
    const shippingFields = {
      fullName: shippingInfo.fullName.trim(),
      phone: shippingInfo.phone.trim(),
      addressLine1: shippingInfo.addressLine1.trim(),
      city: shippingInfo.city.trim(),
      country: shippingInfo.country.trim(),
      postalCode: shippingInfo.postalCode.trim()
    };

    if (Object.values(shippingFields).some((value) => !value)) {
      setCartError('Please fill in the shipping address details.');
      setIsBankTransferOpen(false);
      return;
    }

    setIsCheckoutSubmitting(true);
    setCartError('');

    try {
      const response = await axios.post(
        'http://localhost:5000/api/orders',
        {
          items: cartItems,
          currencySymbol: '$',
          shippingAddress: shippingFields,
          payment: { method: 'bank-transfer', reference: pendingTransferReference }
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );

      const createdOrder = response.data?.order;
      setOrders((prev) => (createdOrder ? [createdOrder, ...prev] : prev));
      setCartItems([]);
      setIsCartOpen(false);
      setIsBankTransferOpen(false);
      setPendingTransferReference('');
      setAuthSuccessMessage(`Order placed successfully. Order #${String(createdOrder?._id || '').slice(-8).toUpperCase()}`);
    } catch (error) {
      setAuthError(error?.response?.data?.message || 'Checkout failed. Please try again.');
      setIsAuthModalOpen(true);
    } finally {
      setIsCheckoutSubmitting(false);
    }
  };

  const handleLogout = () => {
    setAuthToken('');
    setCurrentUser(null);
    setCartItems([]);
    setIsCartOpen(false);
    setIsOrdersOpen(false);
    setIsBankTransferOpen(false);
    setPendingTransferReference('');
    setOrders([]);
    setCartError('');
    localStorage.removeItem('lab_billiard_token');
    localStorage.removeItem('lab_billiard_user');
    localStorage.removeItem('lab_billiard_cart');
  };

  const navbarNode = (
    <Navbar
      isScrolled={isScrolled}
      activeMenu={activeMenu}
      setActiveMenu={setActiveMenu}
      isSearchOpen={isSearchOpen}
      setIsSearchOpen={setIsSearchOpen}
      navItems={navItems}
      getCategoriesByType={getCategoriesByType}
      getMenuSeriesKey={getMenuSeriesKey}
      openLineSeriesPage={openLineSeriesPage}
      searchPanelRef={searchPanelRef}
      closeSearchPanel={closeSearchPanel}
      searchInputRef={searchInputRef}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      handleSearchKeyDown={handleSearchKeyDown}
      searchResults={searchResults}
      handleSearchResultSelect={handleSearchResultSelect}
      onCartClick={() => setIsCartOpen((prev) => !prev)}
      cartItemCount={cartItemCount}
      onAuthClick={() => {
        if (currentUser) {
          return;
        }

        setAuthError('');
        setIsAuthModalOpen(true);
      }}
      currentUser={currentUser}
      onLogout={handleLogout}
      onViewOrders={handleOpenOrders}
      onOpenAdmin={openAdminPage}
    />
  );

  const cartDrawerNode = (
    <CartDrawer
      isOpen={isCartOpen}
      onClose={() => setIsCartOpen(false)}
      items={cartItems}
      onIncrease={handleIncreaseCartItem}
      onDecrease={handleDecreaseCartItem}
      onRemove={handleRemoveCartItem}
      onClear={handleClearCart}
      onCheckout={handleCheckout}
      isCheckoutSubmitting={isCheckoutSubmitting}
      shippingInfo={shippingInfo}
      onShippingChange={setShippingInfo}
      paymentInfo={paymentInfo}
      onPaymentChange={setPaymentInfo}
      errorMessage={cartError}
    />
  );

  const cartSubtotal = cartItems.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);
  const sellerBankInfo = {
    bankCode: 'TPB',
    bankName: 'TPBank',
    accountNumber: '04232073801',
    accountHolder: 'CUNG QUOC DAT'
  };

  const bankTransferModalNode = (
    <BankTransferModal
      isOpen={isBankTransferOpen}
      onClose={() => {
        setIsBankTransferOpen(false);
        setPendingTransferReference('');
      }}
      onConfirmPaid={handleConfirmBankTransferPaid}
      isSubmitting={isCheckoutSubmitting}
      sellerBank={sellerBankInfo}
      amount={cartSubtotal}
      transferNote={pendingTransferReference}
    />
  );

  const ordersDrawerNode = (
    <OrdersDrawer
      isOpen={isOrdersOpen}
      onClose={() => setIsOrdersOpen(false)}
      orders={orders}
      isLoading={isOrdersLoading}
    />
  );

  const authModalNode = (
    <AuthModal
      isOpen={isAuthModalOpen}
      onClose={() => setIsAuthModalOpen(false)}
      onSubmit={handleAuthSubmit}
      isSubmitting={isAuthSubmitting}
      errorMessage={authError}
    />
  );

  const authSuccessToastNode = authSuccessMessage ? (
    <div className="auth-success-toast" role="status" aria-live="polite">
      {authSuccessMessage}
    </div>
  ) : null;

  const pathname = location.pathname.toLowerCase();
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');

  if (isAdminRoute) {
    return (
      <div className="page-container">
        {navbarNode}
        {authSuccessToastNode}
        <AdminPage
          currentUser={currentUser}
          authToken={authToken}
          onRequireLogin={() => {
            setAuthError('Please log in with an admin account.');
            setIsAuthModalOpen(true);
          }}
        />
        {authModalNode}
      </div>
    );
  }

  const detailSeriesAliases = {
    product: 'product',
    truesplice: 'truesplice',
    p3: 'p3',
    maelith: 'maelith',
    candy: 'candy',
    limited: 'limited',
    limitededition: 'limited'
  };

  const detailFallbackSeriesKey =
    lineRoute?.type === 'detail'
      ? detailSeriesAliases[(lineRoute?.lineSlug || '').toLowerCase()] || null
      : null;

  if (lineRoute) {
    if (isLoading) {
      return (
        <div className="page-container">
          {navbarNode}
          {authSuccessToastNode}
          <main className="line-detail-main">
            <section className="line-detail-empty" aria-label="Loading catalog">
              <h2 className="line-detail-empty-title">Loading catalog</h2>
              <p className="line-detail-empty-text">
                We are loading the product catalog. Please wait a moment.
              </p>
            </section>
          </main>
          {cartDrawerNode}
          {bankTransferModalNode}
          {ordersDrawerNode}
          {authModalNode}
        </div>
      );
    }

    if (lineRoute.type === 'series') {
      return (
        <div className="page-container">
          {navbarNode}
          {authSuccessToastNode}
          <LineSeriesPage
            banners={banners}
            selectedSeriesKey={lineRoute.seriesKey}
            selectedSeriesItems={selectedSeriesItems}
            selectedSeriesTitle={selectedSeriesTitle}
            openLineDetailPage={openLineDetailPage}
          />
          {cartDrawerNode}
          {bankTransferModalNode}
          {ordersDrawerNode}
          {authModalNode}
        </div>
      );
    }

    if (detailFallbackSeriesKey) {
      return (
        <div className="page-container">
          {navbarNode}
          {authSuccessToastNode}
          <LineSeriesPage
            banners={banners}
            selectedSeriesKey={detailFallbackSeriesKey}
            selectedSeriesItems={lineCollections[detailFallbackSeriesKey] || []}
            selectedSeriesTitle={(lineCollections[detailFallbackSeriesKey] || [])[0]?.seriesTitle || 'Product Line'}
            openLineDetailPage={openLineDetailPage}
          />
          {cartDrawerNode}
          {bankTransferModalNode}
          {ordersDrawerNode}
          {authModalNode}
        </div>
      );
    }

    return (
      <div className="page-container">
        {navbarNode}
        {authSuccessToastNode}
        <LineDetailPage
          selectedLine={selectedLine}
          onAddToCart={handleAddToCart}
          isAuthenticated={Boolean(currentUser)}
        />
        {cartDrawerNode}
        {bankTransferModalNode}
        {ordersDrawerNode}
        {authModalNode}
      </div>
    );
  }

  return (
    <div className="page-container">
      {navbarNode}
      {authSuccessToastNode}
      <HomePage
        banners={banners}
        lineCollections={lineCollections}
        poisonMaelithVideoSrc={poisonMaelithVideoSrc}
        openLineDetailPage={openLineDetailPage}
      />
      {cartDrawerNode}
      {bankTransferModalNode}
      {ordersDrawerNode}
      {authModalNode}
    </div>
  );
}

export default App;