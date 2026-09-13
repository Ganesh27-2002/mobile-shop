import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout.js';
import {
  getAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
} from '../../services/adminCategoryService.js';
import type { AdminCategory } from '../../types/admin.js';
import { formatDate } from '../../utils/formatters.js';
import { getApiErrorMessage } from '../../services/api.js';

export const AdminCategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<AdminCategory | null>(null);
  const [deleteCategoryItem, setDeleteCategoryItem] = useState<AdminCategory | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getAdminCategories();
      setCategories(data);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData({ name: '', slug: '', description: '' });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (cat: AdminCategory) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setFormError(null);

      const payload = {
        name: formData.name.trim(),
        slug: formData.slug.trim() || undefined,
        description: formData.description.trim() || undefined,
      };

      if (editingCategory) {
        await updateAdminCategory(editingCategory.id, payload);
        setSuccessMessage(`Category "${formData.name}" updated successfully.`);
      } else {
        await createAdminCategory(payload);
        setSuccessMessage(`Category "${formData.name}" created successfully.`);
      }

      setIsModalOpen(false);
      fetchCategories();
    } catch (err) {
      setFormError(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteCategoryItem) return;
    try {
      await deleteAdminCategory(deleteCategoryItem.id);
      setSuccessMessage(`Category "${deleteCategoryItem.name}" deleted.`);
      setDeleteCategoryItem(null);
      fetchCategories();
    } catch (err) {
      setError(getApiErrorMessage(err));
      setDeleteCategoryItem(null);
    }
  };

  return (
    <AdminLayout activeSection="Category Management">
      <div className="admin-categories-page" data-testid="admin-categories-page">
        <div className="admin-page-header">
          <div>
            <h1 className="admin-heading">Product Categories & Brands</h1>
            <p className="admin-subheading">Organize smartphone catalogs, manage URLs/slugs, and brand taxonomies.</p>
          </div>
          <button
            type="button"
            className="btn-primary"
            onClick={openCreateModal}
            data-testid="add-category-btn"
          >
            ➕ Add Category
          </button>
        </div>

        {successMessage && (
          <div className="alert-success" role="status" data-testid="admin-success-banner">
            <span>✅ {successMessage}</span>
            <button type="button" onClick={() => setSuccessMessage(null)} className="alert-close">✕</button>
          </div>
        )}

        {error && (
          <div className="alert-error" role="alert" data-testid="admin-error-banner">
            <span>⚠️ {error}</span>
            <button type="button" onClick={() => setError(null)} className="alert-close">✕</button>
          </div>
        )}

        <div className="admin-card">
          {isLoading ? (
            <div className="loading-container" role="status" aria-live="polite">
              <div className="spinner" aria-hidden="true"></div>
              <p>Loading categories...</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="admin-empty-state">
              <p>No categories found.</p>
            </div>
          ) : (
            <div className="admin-table-responsive">
              <table className="admin-table" data-testid="admin-categories-table">
                <thead>
                  <tr>
                    <th>Category Name</th>
                    <th>Slug</th>
                    <th>Description</th>
                    <th>Products Count</th>
                    <th>Created Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat) => (
                    <tr key={cat.id} data-testid={`category-row-${cat.id}`}>
                      <td className="font-bold">{cat.name}</td>
                      <td className="font-mono text-muted">{cat.slug}</td>
                      <td>{cat.description || '—'}</td>
                      <td>
                        <span className="badge-info">{cat.productCount} products</span>
                      </td>
                      <td>{formatDate(cat.createdAt)}</td>
                      <td>
                        <div className="table-actions-group">
                          <button
                            type="button"
                            className="btn-action-edit"
                            onClick={() => openEditModal(cat)}
                            data-testid={`edit-category-btn-${cat.id}`}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            type="button"
                            className="btn-action-delete"
                            onClick={() => setDeleteCategoryItem(cat)}
                            data-testid={`delete-category-btn-${cat.id}`}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create / Edit Category Modal */}
        {isModalOpen && (
          <div className="modal-backdrop" data-testid="category-form-modal">
            <div className="modal-card modal-card-sm">
              <div className="modal-header">
                <h2>{editingCategory ? 'Edit Category' : 'Add New Category'}</h2>
                <button type="button" className="modal-close" onClick={() => setIsModalOpen(false)}>✕</button>
              </div>

              {formError && (
                <div className="alert-error" role="alert" data-testid="form-error">
                  {formError}
                </div>
              )}

              <form onSubmit={handleFormSubmit}>
                <div className="form-group">
                  <label htmlFor="cat-name">Category Name *</label>
                  <input
                    id="cat-name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Motorola"
                    data-testid="input-category-name"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="cat-slug">Slug (URL identifier)</label>
                  <input
                    id="cat-slug"
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="Leave blank to auto-generate"
                    data-testid="input-category-slug"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="cat-desc">Description</label>
                  <textarea
                    id="cat-desc"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brand details and category overview..."
                    data-testid="input-category-desc"
                  />
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isSubmitting}
                    data-testid="submit-category-btn"
                  >
                    {isSubmitting ? 'Saving...' : editingCategory ? 'Save Changes' : 'Create Category'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteCategoryItem && (
          <div className="modal-backdrop" data-testid="delete-category-modal">
            <div className="modal-card modal-card-sm">
              <div className="modal-header">
                <h2>Confirm Deletion</h2>
                <button type="button" className="modal-close" onClick={() => setDeleteCategoryItem(null)}>✕</button>
              </div>
              <p>
                Are you sure you want to delete category <strong>{deleteCategoryItem.name}</strong>?
              </p>
              {deleteCategoryItem.productCount > 0 && (
                <div className="alert-warning mt-2">
                  ⚠️ This category contains {deleteCategoryItem.productCount} product(s). You must reassign or remove them first.
                </div>
              )}
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setDeleteCategoryItem(null)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-danger"
                  onClick={handleDeleteConfirm}
                  data-testid="confirm-delete-category-btn"
                >
                  Delete Category
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
