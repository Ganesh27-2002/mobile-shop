/**
 * Formats a numeric price into Indian Rupee (INR) currency format.
 * Example: 69999 -> ₹69,999
 */
export const formatPrice = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0';
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatINR = formatPrice;

/**
 * Returns human-readable stock status and corresponding CSS class name.
 */
export const getStockInfo = (stock: number) => {
  if (stock <= 0) {
    return {
      status: 'Out of Stock',
      labelClass: 'stock-out',
      isAvailable: false,
    };
  }
  if (stock <= 10) {
    return {
      status: `Only ${stock} left`,
      labelClass: 'stock-low',
      isAvailable: true,
    };
  }
  return {
    status: 'In Stock',
    labelClass: 'stock-in',
    isAvailable: true,
  };
};

/**
 * Formats an ISO date string into a friendly localized date representation.
 */
export const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'N/A';
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return dateString;
  }
};

