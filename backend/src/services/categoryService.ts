import { Category } from '../models/index.js';

/**
 * Retrieves all categories sorted alphabetically by name.
 */
export const getCategories = async (): Promise<Category[]> => {
  const categories = await Category.findAll({
    attributes: ['id', 'name', 'slug', 'description'],
    order: [['name', 'ASC']],
  });

  return categories;
};
