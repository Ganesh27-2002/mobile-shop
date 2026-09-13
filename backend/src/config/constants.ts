export const LOW_STOCK_THRESHOLD = 5;
export const DEFAULT_PAGE_LIMIT = 20;

export const ORDER_STATUS_TRANSITIONS: Record<string, string[]> = {
  PLACED: ['CONFIRMED', 'CANCELLED'],
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [], // Terminal state
  CANCELLED: [], // Terminal state
};

export const CANCELLABLE_STATUSES: string[] = ['PLACED', 'PENDING', 'CONFIRMED', 'PROCESSING'];

export const ALLOWED_PRODUCT_IMAGES: string[] = [
  '/images/products/iphone-15-pro-max.jpg',
  '/images/products/iphone-15-pro.jpg',
  '/images/products/iphone-15.jpg',
  '/images/products/iphone-14.jpg',
  '/images/products/samsung-s24-ultra.jpg',
  '/images/products/samsung-s24-plus.jpg',
  '/images/products/samsung-z-fold-5.jpg',
  '/images/products/samsung-z-flip-5.jpg',
  '/images/products/oneplus-12.jpg',
  '/images/products/oneplus-12r.jpg',
  '/images/products/oneplus-open.jpg',
  '/images/products/google-pixel-8-pro.jpg',
  '/images/products/google-pixel-8.jpg',
  '/images/products/google-pixel-7a.jpg',
  '/images/products/xiaomi-14-ultra.jpg',
  '/images/products/xiaomi-14.jpg',
];
