import { Op, Order } from 'sequelize';
import { Product, Category } from '../models/index.js';

export interface GetProductsQuery {
  search?: string;
  category?: string;
  sort?: string;
  page?: string | number;
  limit?: string | number;
}

export interface PaginatedProducts {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

const SORT_ALLOWLIST: Record<string, Order> = {
  price_asc: [['price', 'ASC']],
  price_desc: [['price', 'DESC']],
  name_asc: [['name', 'ASC']],
  name_desc: [['name', 'DESC']],
  newest: [['createdAt', 'DESC']],
};

/**
 * Retrieves a paginated and filtered list of active products.
 */
export const getProducts = async (query: GetProductsQuery): Promise<PaginatedProducts> => {
  const { search, category, sort, page, limit } = query;

  // Sanitize and bound pagination
  const rawPage = parseInt(String(page || '1'), 10);
  const rawLimit = parseInt(String(limit || '8'), 10);

  const currentPage = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
  const currentLimit = isNaN(rawLimit) || rawLimit <= 0 ? 8 : Math.min(50, rawLimit);
  const offset = (currentPage - 1) * currentLimit;

  // Search filter across name, brand, model
  const searchFilter = search && search.trim().length > 0
    ? {
        [Op.or]: [
          { name: { [Op.iLike]: `%${search.trim()}%` } },
          { brand: { [Op.iLike]: `%${search.trim()}%` } },
          { model: { [Op.iLike]: `%${search.trim()}%` } },
        ],
      }
    : {};

  // Category filter by slug or ID
  const isUuid = category ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(category.trim()) : false;
  const categoryWhere = category && category.trim().length > 0
    ? isUuid
      ? { [Op.or]: [{ slug: category.trim().toLowerCase() }, { id: category.trim() }] }
      : { slug: category.trim().toLowerCase() }
    : undefined;

  // Sorting with strict allowlist
  const selectedSort = sort && SORT_ALLOWLIST[sort.trim().toLowerCase()]
    ? SORT_ALLOWLIST[sort.trim().toLowerCase()]
    : SORT_ALLOWLIST.newest;

  const { count, rows } = await Product.findAndCountAll({
    where: {
      isActive: true,
      ...searchFilter,
    },
    include: [
      {
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'slug', 'description'],
        required: !!categoryWhere,
        where: categoryWhere,
      },
    ],
    order: selectedSort,
    limit: currentLimit,
    offset,
    distinct: true,
  });

  const totalPages = Math.ceil(count / currentLimit) || 1;

  return {
    products: rows,
    pagination: {
      page: currentPage,
      limit: currentLimit,
      totalItems: count,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
    },
  };
};

/**
 * Retrieves a single active product by UUID or slug including category association.
 */
export const getProductById = async (identifier: string): Promise<Product | null> => {
  if (!identifier || identifier.trim().length === 0) {
    return null;
  }

  const cleanId = identifier.trim();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId);

  const whereClause = isUuid
    ? {
        [Op.or]: [{ id: cleanId }, { slug: cleanId.toLowerCase() }],
        isActive: true,
      }
    : {
        slug: cleanId.toLowerCase(),
        isActive: true,
      };

  const product = await Product.findOne({
    where: whereClause,
    include: [
      {
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'slug', 'description'],
      },
    ],
  });

  return product;
};
