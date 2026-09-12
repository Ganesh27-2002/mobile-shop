import { api } from './api.js';
import type {
  Product,
  Category,
  ProductListResponse,
  ProductDetailResponse,
  CategoryListResponse,
  ProductQueryParams,
  ProductPagination,
} from '../types/product.js';

export const productService = {
  /**
   * Fetch paginated and filtered product list.
   */
  async getProducts(params?: ProductQueryParams): Promise<{ products: Product[]; pagination: ProductPagination }> {
    const response = await api.get<ProductListResponse>('/products', { params });
    if (!response.data.data) {
      throw new Error('Failed to retrieve products.');
    }
    return response.data.data;
  },

  /**
   * Fetch a single product by UUID or slug.
   */
  async getProductById(id: string): Promise<Product> {
    const response = await api.get<ProductDetailResponse>(`/products/${encodeURIComponent(id)}`);
    if (!response.data.data?.product) {
      throw new Error('Product not found.');
    }
    return response.data.data.product;
  },

  /**
   * Fetch all categories.
   */
  async getCategories(): Promise<Category[]> {
    const response = await api.get<CategoryListResponse>('/categories');
    if (!response.data.data?.categories) {
      throw new Error('Failed to retrieve categories.');
    }
    return response.data.data.categories;
  },
};
