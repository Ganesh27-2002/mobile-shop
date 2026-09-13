import { Op } from 'sequelize';
import { Category, Product } from '../models/index.js';
import { AppError } from './authService.js';
import {
  CreateCategoryInput,
  createCategorySchema,
  UpdateCategoryInput,
  updateCategorySchema,
} from '../validators/adminValidator.js';

export interface AdminCategoryWithCount {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
};

export const getAdminCategories = async (): Promise<AdminCategoryWithCount[]> => {
  const categories = await Category.findAll({
    order: [['name', 'ASC']],
  });

  const categoriesWithCount = await Promise.all(
    categories.map(async (cat) => {
      const productCount = await Product.count({
        where: { categoryId: cat.id },
      });

      return {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        productCount,
        createdAt: cat.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: cat.updatedAt?.toISOString() || new Date().toISOString(),
      };
    })
  );

  return categoriesWithCount;
};

export const getAdminCategoryById = async (id: string): Promise<AdminCategoryWithCount> => {
  const cat = await Category.findByPk(id);
  if (!cat) {
    throw new AppError('Category not found', 404);
  }

  const productCount = await Product.count({
    where: { categoryId: cat.id },
  });

  return {
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    description: cat.description,
    productCount,
    createdAt: cat.createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: cat.updatedAt?.toISOString() || new Date().toISOString(),
  };
};

export const createCategory = async (input: unknown): Promise<AdminCategoryWithCount> => {
  const parseResult = createCategorySchema.safeParse(input);
  if (!parseResult.success) {
    const errorMsg = parseResult.error.issues.map((e) => e.message).join(', ');
    throw new AppError(errorMsg, 400);
  }

  const data: CreateCategoryInput = parseResult.data;
  const slug = data.slug && data.slug.trim().length > 0 ? generateSlug(data.slug) : generateSlug(data.name);

  // Check duplicate slug or name
  const existingCategory = await Category.findOne({
    where: {
      [Op.or]: [{ slug }, { name: { [Op.iLike]: data.name.trim() } }],
    },
  });

  if (existingCategory) {
    throw new AppError('Category with this name or slug already exists', 409);
  }

  const created = await Category.create({
    name: data.name.trim(),
    slug,
    description: data.description || '',
  });

  return await getAdminCategoryById(created.id);
};

export const updateCategory = async (id: string, input: unknown): Promise<AdminCategoryWithCount> => {
  const parseResult = updateCategorySchema.safeParse(input);
  if (!parseResult.success) {
    const errorMsg = parseResult.error.issues.map((e) => e.message).join(', ');
    throw new AppError(errorMsg, 400);
  }

  const data: UpdateCategoryInput = parseResult.data;
  const category = await Category.findByPk(id);
  if (!category) {
    throw new AppError('Category not found', 404);
  }

  const newSlug = data.slug !== undefined ? generateSlug(data.slug) : data.name ? generateSlug(data.name) : category.slug;

  if (newSlug !== category.slug) {
    const existingSlug = await Category.findOne({
      where: {
        slug: newSlug,
        id: { [Op.ne]: id },
      },
    });

    if (existingSlug) {
      throw new AppError('Category slug already in use by another category', 409);
    }
    category.slug = newSlug;
  }

  if (data.name !== undefined) category.name = data.name.trim();
  if (data.description !== undefined) category.description = data.description;

  await category.save();
  return await getAdminCategoryById(category.id);
};

export const deleteCategory = async (id: string): Promise<void> => {
  const category = await Category.findByPk(id);
  if (!category) {
    throw new AppError('Category not found', 404);
  }

  const productCount = await Product.count({
    where: { categoryId: id },
  });

  if (productCount > 0) {
    throw new AppError(
      `Cannot delete category "${category.name}" because it contains ${productCount} product(s). Please reassign or delete the products first.`,
      400
    );
  }

  await category.destroy();
};
