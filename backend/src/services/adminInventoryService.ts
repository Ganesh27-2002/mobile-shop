import { Op, Order as SeqOrder } from 'sequelize';
import { Product, Category } from '../models/index.js';
import { LOW_STOCK_THRESHOLD, DEFAULT_PAGE_LIMIT } from '../config/constants.js';

export interface AdminInventoryQuery {
  search?: string;
  status?: string; // 'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'
  category?: string;
  sort?: string;
  page?: string | number;
  limit?: string | number;
}

export interface InventoryItem {
  id: string;
  name: string;
  brand: string;
  model: string;
  image: string;
  category: {
    id: string;
    name: string;
  } | null;
  currentStock: number;
  lowStockThreshold: number;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  lastUpdated: string;
}

export interface PaginatedAdminInventory {
  items: InventoryItem[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export const getAdminInventory = async (query: AdminInventoryQuery): Promise<PaginatedAdminInventory> => {
  const { search, status, category, sort, page, limit } = query;

  const rawPage = parseInt(String(page || '1'), 10);
  const rawLimit = parseInt(String(limit || DEFAULT_PAGE_LIMIT), 10);

  const currentPage = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
  const currentLimit = isNaN(rawLimit) || rawLimit <= 0 ? DEFAULT_PAGE_LIMIT : Math.min(100, rawLimit);
  const offset = (currentPage - 1) * currentLimit;

  // Search filter
  const searchFilter = search && search.trim().length > 0
    ? {
        [Op.or]: [
          { name: { [Op.iLike]: `%${search.trim()}%` } },
          { brand: { [Op.iLike]: `%${search.trim()}%` } },
          { model: { [Op.iLike]: `%${search.trim()}%` } },
        ],
      }
    : {};

  // Status filter based on stock thresholds
  let stockWhere = {};
  if (status === 'OUT_OF_STOCK') {
    stockWhere = { stock: 0 };
  } else if (status === 'LOW_STOCK') {
    stockWhere = {
      stock: {
        [Op.lte]: LOW_STOCK_THRESHOLD,
        [Op.gt]: 0,
      },
    };
  } else if (status === 'IN_STOCK') {
    stockWhere = {
      stock: {
        [Op.gt]: LOW_STOCK_THRESHOLD,
      },
    };
  }

  // Category filter
  const isUuid = category ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(category.trim()) : false;
  const categoryWhere = category && category.trim().length > 0
    ? isUuid
      ? { [Op.or]: [{ slug: category.trim().toLowerCase() }, { id: category.trim() }] }
      : { slug: category.trim().toLowerCase() }
    : undefined;

  let selectedSort: SeqOrder = [['stock', 'ASC']];
  if (sort === 'stock_desc') {
    selectedSort = [['stock', 'DESC']];
  } else if (sort === 'name_asc') {
    selectedSort = [['name', 'ASC']];
  } else if (sort === 'updated_desc') {
    selectedSort = [['updatedAt', 'DESC']];
  }

  const { count, rows } = await Product.findAndCountAll({
    where: {
      ...stockWhere,
      ...searchFilter,
    },
    include: [
      {
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'slug'],
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

  const items: InventoryItem[] = rows.map((product) => {
    let stockStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' = 'IN_STOCK';
    if (product.stock === 0) {
      stockStatus = 'OUT_OF_STOCK';
    } else if (product.stock <= LOW_STOCK_THRESHOLD) {
      stockStatus = 'LOW_STOCK';
    }

    return {
      id: product.id,
      name: product.name,
      brand: product.brand,
      model: product.model,
      image: product.image,
      category: product.category
        ? {
            id: product.category.id,
            name: product.category.name,
          }
        : null,
      currentStock: product.stock,
      lowStockThreshold: LOW_STOCK_THRESHOLD,
      status: stockStatus,
      lastUpdated: product.updatedAt?.toISOString() || new Date().toISOString(),
    };
  });

  return {
    items,
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
