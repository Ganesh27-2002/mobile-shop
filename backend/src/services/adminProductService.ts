import { Op, Order as SeqOrder } from 'sequelize';
import { Product, Category, OrderItem } from '../models/index.js';
import { AppError } from './authService.js';
import { ALLOWED_PRODUCT_IMAGES, DEFAULT_PAGE_LIMIT } from '../config/constants.js';
import {
  CreateProductInput,
  createProductSchema,
  UpdateProductInput,
  updateProductSchema,
  updateStockSchema,
} from '../validators/adminValidator.js';

export interface AdminProductQuery {
  search?: string;
  category?: string;
  status?: string; // 'all' | 'active' | 'inactive'
  sort?: string;
  page?: string | number;
  limit?: string | number;
}

export interface PaginatedAdminProducts {
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

const SORT_ALLOWLIST: Record<string, SeqOrder> = {
  newest: [['createdAt', 'DESC']],
  oldest: [['createdAt', 'ASC']],
  price_asc: [['price', 'ASC']],
  price_desc: [['price', 'DESC']],
  stock_asc: [['stock', 'ASC']],
  stock_desc: [['stock', 'DESC']],
  name_asc: [['name', 'ASC']],
  name_desc: [['name', 'DESC']],
};

export const getAdminProducts = async (query: AdminProductQuery): Promise<PaginatedAdminProducts> => {
  const { search, category, status, sort, page, limit } = query;

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

  // Status filter: 'active', 'inactive', or 'all'
  let statusFilter = {};
  if (status === 'active') {
    statusFilter = { isActive: true };
  } else if (status === 'inactive') {
    statusFilter = { isActive: false };
  }

  // Category filter
  const isUuid = category ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(category.trim()) : false;
  const categoryWhere = category && category.trim().length > 0
    ? isUuid
      ? { [Op.or]: [{ slug: category.trim().toLowerCase() }, { id: category.trim() }] }
      : { slug: category.trim().toLowerCase() }
    : undefined;

  const selectedSort = sort && SORT_ALLOWLIST[sort.trim().toLowerCase()]
    ? SORT_ALLOWLIST[sort.trim().toLowerCase()]
    : SORT_ALLOWLIST.newest;

  const { count, rows } = await Product.findAndCountAll({
    where: {
      ...statusFilter,
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

export const getAdminProductById = async (id: string): Promise<Product> => {
  const product = await Product.findByPk(id, {
    include: [
      {
        model: Category,
        as: 'category',
      },
    ],
  });

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  return product;
};

const generateSlug = (name: string, model: string): string => {
  const base = `${name}-${model}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
  const randomSuffix = Math.random().toString(36).substring(2, 6);
  return `${base}-${randomSuffix}`;
};

export const createProduct = async (input: unknown): Promise<Product> => {
  const parseResult = createProductSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMsg = parseResult.error.issues.map((e) => e.message).join(', ');
    throw new AppError(errorMsg, 400);
  }

  const data: CreateProductInput = parseResult.data;

  // Validate category
  const category = await Category.findByPk(data.categoryId);
  if (!category) {
    throw new AppError('Specified category does not exist', 404);
  }

  const slug = generateSlug(data.name, data.model);
  const originalPrice = data.originalPrice || data.price;
  const discountPercentage = data.discountPercentage || 0;

  const product = await Product.create({
    name: data.name,
    slug,
    brand: data.brand,
    model: data.model,
    description: data.description || '',
    price: data.price,
    originalPrice,
    discountPercentage,
    stock: data.stock,
    image: data.image,
    categoryId: data.categoryId,
    isActive: data.isActive !== undefined ? data.isActive : true,
  });

  return await getAdminProductById(product.id);
};

export const updateProduct = async (id: string, input: unknown): Promise<Product> => {
  const parseResult = updateProductSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMsg = parseResult.error.issues.map((e) => e.message).join(', ');
    throw new AppError(errorMsg, 400);
  }

  const data: UpdateProductInput = parseResult.data;
  const product = await Product.findByPk(id);
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  if (data.categoryId) {
    const category = await Category.findByPk(data.categoryId);
    if (!category) {
      throw new AppError('Specified category does not exist', 404);
    }
  }

  if (data.name !== undefined) product.name = data.name;
  if (data.brand !== undefined) product.brand = data.brand;
  if (data.model !== undefined) product.model = data.model;
  if (data.description !== undefined) product.description = data.description;
  if (data.price !== undefined) product.price = data.price;
  if (data.originalPrice !== undefined) product.originalPrice = data.originalPrice;
  if (data.discountPercentage !== undefined) product.discountPercentage = data.discountPercentage;
  if (data.stock !== undefined) product.stock = data.stock;
  if (data.image !== undefined) product.image = data.image;
  if (data.categoryId !== undefined) product.categoryId = data.categoryId;
  if (data.isActive !== undefined) product.isActive = data.isActive;

  await product.save();
  return await getAdminProductById(product.id);
};

export const updateProductStatus = async (id: string, isActive: boolean): Promise<Product> => {
  const product = await Product.findByPk(id);
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  product.isActive = isActive;
  await product.save();
  return await getAdminProductById(product.id);
};

export const updateProductStock = async (
  id: string,
  input: unknown
): Promise<{ previousStock: number; newStock: number; stockDifference: number; product: Product }> => {
  const parseResult = updateStockSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMsg = parseResult.error.issues.map((e) => e.message).join(', ');
    throw new AppError(errorMsg, 400);
  }

  const { stock } = parseResult.data;
  const product = await Product.findByPk(id);
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  const previousStock = product.stock;
  const newStock = stock;
  const stockDifference = newStock - previousStock;

  product.stock = newStock;
  await product.save();

  const updatedProduct = await getAdminProductById(product.id);
  return {
    previousStock,
    newStock,
    stockDifference,
    product: updatedProduct,
  };
};

export const deleteProduct = async (id: string): Promise<void> => {
  const product = await Product.findByPk(id);
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  // Check if product is referenced in historical OrderItems
  const orderItemCount = await OrderItem.count({
    where: { productId: id },
  });

  if (orderItemCount > 0) {
    throw new AppError(
      'Cannot delete product because it is referenced in historical orders. Please deactivate the product instead.',
      400
    );
  }

  await product.destroy();
};

export const getAllowedImages = (): string[] => {
  return [...ALLOWED_PRODUCT_IMAGES];
};
