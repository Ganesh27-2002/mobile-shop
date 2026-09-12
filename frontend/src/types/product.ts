export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  brand: string;
  model: string;
  description: string;
  price: number;
  originalPrice: number;
  discountPercentage: number;
  stock: number;
  image: string;
  categoryId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category?: Category;
}

export interface ProductPagination {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ProductListResponse {
  success: boolean;
  data: {
    products: Product[];
    pagination: ProductPagination;
  };
}

export interface ProductDetailResponse {
  success: boolean;
  data: {
    product: Product;
  };
}

export interface CategoryListResponse {
  success: boolean;
  data: {
    categories: Category[];
  };
}

export interface ProductQueryParams {
  search?: string;
  category?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc';
