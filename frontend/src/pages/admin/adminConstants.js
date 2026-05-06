export const LINE_TYPE_OPTIONS = [
  { value: 'truesplice', label: 'True Splice' },
  { value: 'p3', label: 'P3' },
  { value: 'poison-maelith', label: 'Poison Maelith' },
  { value: 'poison-candy', label: 'Poison Candy' },
  { value: 'break-jump', label: 'Break & Jump' },
  { value: 'limited', label: 'Limited Edition' }
];

export const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending Confirmation' },
  { value: 'paid', label: 'Paid' },
  { value: 'packing', label: 'Packing' },
  { value: 'shipped', label: 'Shipping' },
  { value: 'delivered', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'returned', label: 'Returned' }
];

export const NEXT_STATUS = {
  pending: 'paid',
  paid: 'packing',
  packing: 'shipped',
  shipped: 'delivered'
};
