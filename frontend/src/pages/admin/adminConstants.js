export const LINE_TYPE_OPTIONS = [
  { value: 'truesplice', label: 'True Splice' },
  { value: 'p3', label: 'P3' },
  { value: 'poison-maelith', label: 'Poison Maelith' },
  { value: 'poison-candy', label: 'Poison Candy' },
  { value: 'break-jump', label: 'Break & Jump' },
  { value: 'limited', label: 'Limited Edition' },
  { value: 'shaft', label: 'Shafts' },
  { value: 'case', label: 'Cases' },
  { value: 'accessory', label: 'Accessories' },
  { value: 'table', label: 'Tables' }
];

export const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', color: '#f59e0b' },
  { value: 'paid', label: 'Paid', color: '#3b82f6' },
  { value: 'packing', label: 'Packing', color: '#8b5cf6' },
  { value: 'shipped', label: 'Shipped', color: '#06b6d4' },
  { value: 'delivered', label: 'Delivered', color: '#10b981' },
  { value: 'cancelled', label: 'Cancelled', color: '#ef4444' },
  { value: 'returned', label: 'Returned', color: '#f97316' }
];

export const NEXT_STATUS = {
  pending: 'paid',
  paid: 'packing',
  packing: 'shipped',
  shipped: 'delivered'
};

export const PAYMENT_METHOD_LABELS = {
  cod: 'COD (Cash)',
  'bank-transfer': 'Bank Transfer',
  'bank-account': 'Bank Transfer',
  vnpay: 'VNPAY'
};

export const formatCurrency = (value) => {
  return `$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const formatShortDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit' });
};
