import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout.js';
import {
  getAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  updateAdminProductStatus,
  updateAdminProductStock,
  deleteAdminProduct,
  getAdminAllowedImages,
} from '../../services/adminProductService.js';
import { getAdminCategories } from '../../services/adminCategoryService.js';
import type { AdminProduct, AdminCategory, AdminPagination } from '../../types/admin.js';
import { formatINR } from '../../utils/formatters.js';
import { getApiErrorMessage } from '../../services/api.js';

export const AdminProductsPage: React.FC = () => {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [allowedImages, setAllowedImages] = useState<string[]>([]);
  const [pagination, setPagination] = useState<AdminPagination>({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<string>('newest');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [isStockModalOpen, setIsStockModalOpen] = useState<boolean>(false);
  const [stockProduct, setStockProduct] = useState<AdminProduct | null>(null);
  const [newStockValue, setNewStockValue] = useState<number>(0);
  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState<AdminProduct | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    model: '',
    categoryId: '',
    price: 0,
    originalPrice: 0,
    discountPercentage: 0,
    stock: 0,
    description: '',
    image: '',
    isActive: true,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchCategoriesAndImages = async () => {
    try {
      const [cats, imgs] = await Promise.all([
        getAdminCategories(),
        getAdminAllowedImages(),
      ]);
      setCategories(cats);
      setAllowedImages(imgs);
      if (imgs.length > 0 && !formData.image) {
        setFormData((prev) => ({ ...prev, image: imgs[0] }));
      }
      if (cats.length > 0 && !formData.categoryId) {
        setFormData((prev) => ({ ...prev, categoryId: cats[0].id }));
      }
    } catch {
      // Ignore background fetch error
    }
  };

  const fetchProducts = async (page = pagination.page) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await getAdminProducts({
        search,
        category: categoryFilter,
        status: statusFilter,
        sort: sortOrder,
        page,
        limit: 10,
      });
      setProducts(res.products);
      setPagination(res.pagination);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategoriesAndImages();
  }, []);

  useEffect(() => {
    fetchProducts(1);
  }, [categoryFilter, statusFilter, sortOrder]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts(1);
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      brand: '',
      model: '',
      categoryId: categories.length > 0 ? categories[0].id : '',
      price: 0,
      originalPrice: 0,
      discountPercentage: 0,
      stock: 10,
      description: '',
      image: allowedImages.length > 0 ? allowedImages[0] : '/images/products/iphone-15-pro-max.jpg',
      isActive: true,
    });
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = (product: AdminProduct) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      brand: product.brand,
      model: product.model,
      categoryId: product.categoryId,
      price: product.price,
      originalPrice: product.originalPrice || product.price,
      discountPercentage: product.discountPercentage || 0,
      stock: product.stock,
      description: product.description || '',
      image: product.image,
      isActive: product.isActive,
    });
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const openStockModal = (product: AdminProduct) => {
    setStockProduct(product);
    setNewStockValue(product.stock);
    setIsStockModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setFormError(null);

      const payload = {
        ...formData,
        originalPrice: formData.originalPrice && formData.originalPrice > 0 ? formData.originalPrice : undefined,
        discountPercentage: formData.discountPercentage || 0,
        categoryId: formData.categoryId || (categories.length > 0 ? categories[0].id : ''),
        image: formData.image || (allowedImages.length > 0 ? allowedImages[0] : '/images/products/iphone-15-pro-max.jpg'),
      };

      if (editingProduct) {
        await updateAdminProduct(editingProduct.id, payload);
        setSuccessMessage(`Product "${formData.name}" updated successfully.`);
      } else {
        await createAdminProduct(payload);
        setSuccessMessage(`Product "${formData.name}" created successfully.`);
      }

      setIsFormModalOpen(false);
      fetchProducts(pagination.page);
    } catch (err) {
      setFormError(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockProduct) return;
    try {
      setIsSubmitting(true);
      await updateAdminProductStock(stockProduct.id, newStockValue);
      setSuccessMessage(`Stock updated to ${newStockValue} for "${stockProduct.name}".`);
      setIsStockModalOpen(false);
      fetchProducts(pagination.page);
    } catch (err) {
      alert(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (product: AdminProduct) => {
    try {
      const updated = await updateAdminProductStatus(product.id, !product.isActive);
      setSuccessMessage(`Product "${product.name}" ${updated.isActive ? 'activated' : 'deactivated'}.`);
      fetchProducts(pagination.page);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmProduct) return;
    try {
      await deleteAdminProduct(deleteConfirmProduct.id);
      setSuccessMessage(`Product "${deleteConfirmProduct.name}" deleted.`);
      setDeleteConfirmProduct(null);
      fetchProducts(pagination.page);
    } catch (err) {
      setError(getApiErrorMessage(err));
      setDeleteConfirmProduct(null);
    }
  };

  return (
    <AdminLayout activeSection="Product Catalog Management">
      <div className="admin-products-page" data-testid="admin-products-page">
        {/* Header & Add Button */}
        <div className="admin-page-header">
          <div>
            <h1 className="admin-heading">Smartphone Products</h1>
            <p className="admin-subheading">Create, edit, toggle visibility, and control stock inventories.</p>
          </div>
          <button
            type="button"
            className="btn-primary"
            onClick={openCreateModal}
            data-testid="add-product-btn"
          >
            ➕ Add New Smartphone
          </button>
        </div>

        {/* Success/Error Banners */}
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

        {/* Filter Toolbar */}
        <div className="admin-toolbar" data-testid="admin-products-toolbar">
          <form onSubmit={handleSearchSubmit} className="admin-search-form">
            <input
              type="text"
              placeholder="Search by name, brand, model..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="admin-search-input"
              data-testid="search-product-input"
            />
            <button type="submit" className="btn-secondary" data-testid="search-product-btn">
              Search
            </button>
          </form>

          <div className="admin-filters-group">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="admin-select"
              data-testid="category-filter-select"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="admin-select"
              data-testid="status-filter-select"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>

            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="admin-select"
              data-testid="sort-order-select"
            >
              <option value="newest">Newest Added</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="stock_asc">Stock: Low to High</option>
              <option value="stock_desc">Stock: High to Low</option>
              <option value="name_asc">Name: A to Z</option>
            </select>
          </div>
        </div>

        {/* Products Table */}
        <div className="admin-card">
          {isLoading && products.length === 0 ? (
            <div className="loading-container" role="status" aria-live="polite">
              <div className="spinner" aria-hidden="true"></div>
              <p>Loading smartphone catalog...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="admin-empty-state" data-testid="no-products-state">
              <p>No products found matching the criteria.</p>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setSearch('');
                  setCategoryFilter('');
                  setStatusFilter('all');
                  fetchProducts(1);
                }}
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="admin-table-responsive">
              <table className="admin-table" data-testid="admin-products-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Product & Model</th>
                    <th>Brand</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} data-testid={`product-row-${p.id}`}>
                      <td>
                        <img
                          src={p.image}
                          alt={p.name}
                          className="admin-table-thumbnail"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>';
                          }}
                        />
                      </td>
                      <td>
                        <div className="product-cell-name font-bold">{p.name}</div>
                        <div className="product-cell-brand">{p.model}</div>
                      </td>
                      <td>{p.brand}</td>
                      <td>{p.category?.name || 'Uncategorized'}</td>
                      <td>
                        <div className="font-bold">{formatINR(p.price)}</div>
                        {p.originalPrice > p.price && (
                          <div className="text-muted line-through text-xs">
                            {formatINR(p.originalPrice)}
                          </div>
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          className={`stock-badge ${p.stock <= 5 ? (p.stock === 0 ? 'stock-out' : 'stock-low') : 'stock-ok'}`}
                          onClick={() => openStockModal(p)}
                          title="Click to quickly adjust stock"
                          data-testid={`quick-stock-btn-${p.id}`}
                        >
                          {p.stock} units ✏️
                        </button>
                      </td>
                      <td>
                        <button
                          type="button"
                          className={`status-toggle-btn ${p.isActive ? 'active-pill' : 'inactive-pill'}`}
                          onClick={() => handleToggleStatus(p)}
                          data-testid={`toggle-status-btn-${p.id}`}
                        >
                          {p.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td>
                        <div className="table-actions-group">
                          <button
                            type="button"
                            className="btn-action-edit"
                            onClick={() => openEditModal(p)}
                            data-testid={`edit-product-btn-${p.id}`}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            type="button"
                            className="btn-action-delete"
                            onClick={() => setDeleteConfirmProduct(p)}
                            data-testid={`delete-product-btn-${p.id}`}
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

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="admin-pagination" data-testid="admin-pagination">
              <button
                type="button"
                className="btn-pagination"
                disabled={!pagination.hasPreviousPage}
                onClick={() => fetchProducts(pagination.page - 1)}
                data-testid="pagination-prev-btn"
              >
                ← Previous
              </button>
              <span className="pagination-info">
                Page {pagination.page} of {pagination.totalPages} ({pagination.totalItems} total)
              </span>
              <button
                type="button"
                className="btn-pagination"
                disabled={!pagination.hasNextPage}
                onClick={() => fetchProducts(pagination.page + 1)}
                data-testid="pagination-next-btn"
              >
                Next →
              </button>
            </div>
          )}
        </div>

        {/* Add / Edit Product Modal */}
        {isFormModalOpen && (
          <div className="modal-backdrop" data-testid="product-form-modal">
            <div className="modal-card">
              <div className="modal-header">
                <h2>{editingProduct ? 'Edit Smartphone Product' : 'Add New Smartphone'}</h2>
                <button type="button" className="modal-close" onClick={() => setIsFormModalOpen(false)}>✕</button>
              </div>

              {formError && (
                <div className="alert-error" role="alert" data-testid="form-error">
                  {formError}
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="admin-modal-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="p-name">Product Name *</label>
                    <input
                      id="p-name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. iPhone 15 Pro Max"
                      data-testid="input-product-name"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="p-brand">Brand *</label>
                    <input
                      id="p-brand"
                      type="text"
                      required
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      placeholder="e.g. Apple"
                      data-testid="input-product-brand"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="p-model">Model *</label>
                    <input
                      id="p-model"
                      type="text"
                      required
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      placeholder="e.g. 256GB Titanium"
                      data-testid="input-product-model"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="p-category">Category *</label>
                    <select
                      id="p-category"
                      required
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      data-testid="select-product-category"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="p-price">Selling Price (₹) *</label>
                    <input
                      id="p-price"
                      type="number"
                      required
                      min="1"
                      step="0.01"
                      value={formData.price || ''}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                      data-testid="input-product-price"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="p-orig-price">Original Price (₹)</label>
                    <input
                      id="p-orig-price"
                      type="number"
                      min="1"
                      step="0.01"
                      value={formData.originalPrice || ''}
                      onChange={(e) => setFormData({ ...formData, originalPrice: parseFloat(e.target.value) || 0 })}
                      data-testid="input-product-original-price"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="p-stock">Stock Quantity *</label>
                    <input
                      id="p-stock"
                      type="number"
                      required
                      min="0"
                      step="1"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value, 10) || 0 })}
                      data-testid="input-product-stock"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="p-image">Product Image (Local Asset) *</label>
                  <select
                    id="p-image"
                    required
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    data-testid="select-product-image"
                  >
                    {allowedImages.map((img) => (
                      <option key={img} value={img}>
                        {img}
                      </option>
                    ))}
                  </select>
                  {formData.image && (
                    <div className="image-preview-container">
                      <img
                        src={formData.image}
                        alt="Selected preview"
                        className="image-preview"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>';
                        }}
                      />
                      <span className="text-xs text-muted">Preview: {formData.image}</span>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="p-desc">Description</label>
                  <textarea
                    id="p-desc"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Key specifications, display details, camera features..."
                    data-testid="input-product-desc"
                  />
                </div>

                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      data-testid="checkbox-product-active"
                    />
                    Product is Active and visible on Storefront
                  </label>
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setIsFormModalOpen(false)}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isSubmitting}
                    data-testid="submit-product-form-btn"
                  >
                    {isSubmitting ? 'Saving...' : editingProduct ? 'Save Changes' : 'Create Product'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Quick Stock Update Modal */}
        {isStockModalOpen && stockProduct && (
          <div className="modal-backdrop" data-testid="stock-modal">
            <div className="modal-card modal-card-sm">
              <div className="modal-header">
                <h2>Update Inventory Stock</h2>
                <button type="button" className="modal-close" onClick={() => setIsStockModalOpen(false)}>✕</button>
              </div>
              <form onSubmit={handleStockSubmit}>
                <p className="mb-4">
                  Adjusting live stock units for <strong>{stockProduct.name}</strong>.
                </p>
                <div className="form-group">
                  <label htmlFor="quick-stock-input">New Stock Quantity</label>
                  <input
                    id="quick-stock-input"
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={newStockValue}
                    onChange={(e) => setNewStockValue(parseInt(e.target.value, 10) || 0)}
                    data-testid="modal-stock-input"
                  />
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setIsStockModalOpen(false)}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isSubmitting}
                    data-testid="modal-stock-save-btn"
                  >
                    {isSubmitting ? 'Saving...' : 'Update Stock'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmProduct && (
          <div className="modal-backdrop" data-testid="delete-confirm-modal">
            <div className="modal-card modal-card-sm">
              <div className="modal-header">
                <h2>Confirm Deletion</h2>
                <button type="button" className="modal-close" onClick={() => setDeleteConfirmProduct(null)}>✕</button>
              </div>
              <p>
                Are you sure you want to delete <strong>{deleteConfirmProduct.name}</strong>?
              </p>
              <p className="text-muted text-sm mt-2">
                Note: If this smartphone has ever been ordered, deletion will be blocked to preserve purchase history. Deactivating is recommended instead.
              </p>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setDeleteConfirmProduct(null)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-danger"
                  onClick={handleDeleteConfirm}
                  data-testid="confirm-delete-btn"
                >
                  Delete Product
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
