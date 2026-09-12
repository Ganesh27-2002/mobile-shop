export interface CartProduct {
  id: string;
  name: string;
  slug: string;
  brand: string;
  model: string;
  image: string;
  price: number;
  originalPrice: number;
  discountPercentage: number;
  stock: number;
  isActive: boolean;
}

export interface CartItem {
  id: string;
  product: CartProduct;
  quantity: number;
  unitPrice: number;
  itemTotal: number;
}

export interface Cart {
  id: string;
  items: CartItem[];
  itemCount: number;
  subtotal: number;
}

export interface CartResponse {
  success: boolean;
  message?: string;
  data: {
    cart: Cart;
  };
}
