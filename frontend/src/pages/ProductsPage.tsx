import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productService } from '../services/productService.js';
import { ProductCard } from '../components/ProductCard.js';
import type { Product, Category, ProductPagination } from '../types/product.js';
import { getApiErrorMessage } from '../services/api.js';

export const ProductsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL state query values
  const urlSearch = searchParams.get('search') || '';
  const urlCategory = searchParams.get('category') || '';
  const urlSort = searchParams.get('sort') || 'newest';
  const urlPage = parseInt(searchParams.get('page') || '1', 10);

  // Local form state for search input
  const [searchInput, setSearchInput] = useState(urlSearch);

  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState<ProductPagination>({
    page: 1,
    limit: 8,
    totalItems: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  // UI status
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Sync search input when URL changes (e.g. back/forward navigation or clear filters)
  useEffect(() => {
    setSearchInput(urlSearch);
  }, [urlSearch]);

  // Load categories once on mount
  useEffect(() => {
    let isMounted = true;
    const loadCategories = async () => {
      try {
        const catList = await productService.getCategories();
        if (isMounted) {
          setCategories(catList);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    loadCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch products whenever URL parameters change
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await productService.getProducts({
        search: urlSearch || undefined,
        category: urlCategory || undefined,
        sort: urlSort || undefined,
        page: urlPage,
        limit: 8,
      });

      setProducts(data.products);
      setPagination(data.pagination);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [urlSearch, urlCategory, urlSort, urlPage]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Update URL helper
  const updateParams = (newParams: Record<string, string | null>) => {
    const updated = new URLSearchParams(searchParams);

    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null || value === '' || (key === 'page' && value === '1')) {
        updated.delete(key);
      } else {
        updated.set(key, value);
      }
    });

    setSearchParams(updated);
  };

  // Search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams({
      search: searchInput.trim() || null,
      page: '1',
    });
  };

  // Category select
  const handleCategoryChange = (slug: string) => {
    updateParams({
      category: slug || null,
      page: '1',
    });
  };

  // Sort change
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateParams({
      sort: e.target.value === 'newest' ? null : e.target.value,
      page: '1',
    });
  };

  // Pagination navigation
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    updateParams({ page: String(newPage) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchInput('');
    setSearchParams(new URLSearchParams());
  };

  return (
    <div className="products-page-container">
      {/* Page Header */}
      <section className="products-header">
        <h1 className="products-title">Smartphone Catalog</h1>
        <p className="products-subtitle">
          Explore our collection of the latest flagship smartphones and best mobile deals.
        </p>
      </section>

      {/* Filter and Search Bar Controls */}
      <section className="catalog-controls-card">
        <form onSubmit={handleSearchSubmit} className="search-form">
          <div className="search-input-wrap">
            <span className="search-icon" aria-hidden="true">🔍</span>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search mobiles by name, brand, or model..."
              aria-label="Search mobiles"
              data-testid="product-search"
              className="search-input"
            />
            {searchInput && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => {
                  setSearchInput('');
                  updateParams({ search: null, page: '1' });
                }}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
          <button type="submit" className="btn btn-primary search-submit-btn">
            Search
          </button>
        </form>

        {/* Filter Row: Categories + Sort */}
        <div className="filter-sort-row">
          {/* Category Dropdown */}
          <div className="control-group">
            <label htmlFor="category-select" className="control-label">
              Brand / Category:
            </label>
            <select
              id="category-select"
              value={urlCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              data-testid="category-filter"
              className="control-select"
              aria-label="Filter by category"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="control-group">
            <label htmlFor="sort-select" className="control-label">
              Sort By:
            </label>
            <select
              id="sort-select"
              value={urlSort}
              onChange={handleSortChange}
              data-testid="sort-products"
              className="control-select"
              aria-label="Sort products"
            >
              <option value="newest">Featured / Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name_asc">Name: A to Z</option>
              <option value="name_desc">Name: Z to A</option>
            </select>
          </div>
        </div>

        {/* Active Filters Summary Pill */}
        {(urlSearch || urlCategory) && (
          <div className="active-filters-bar">
            <span className="active-filter-label">Active Filters:</span>
            {urlSearch && (
              <span className="filter-pill">
                Search: &ldquo;{urlSearch}&rdquo;
                <button
                  type="button"
                  onClick={() => updateParams({ search: null, page: '1' })}
                  aria-label="Remove search filter"
                >
                  ✕
                </button>
              </span>
            )}
            {urlCategory && (
              <span className="filter-pill">
                Brand: {categories.find((c) => c.slug === urlCategory)?.name || urlCategory}
                <button
                  type="button"
                  onClick={() => updateParams({ category: null, page: '1' })}
                  aria-label="Remove category filter"
                >
                  ✕
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={handleClearFilters}
              className="clear-all-btn"
            >
              Clear All
            </button>
          </div>
        )}
      </section>

      {/* Main Content Area: Loading / Error / Empty / Grid */}
      {isLoading ? (
        <div className="loading-container" data-testid="product-loading" role="status" aria-live="polite">
          <div className="spinner" aria-hidden="true"></div>
          <p>Loading products...</p>
        </div>
      ) : error ? (
        <div className="error-card" data-testid="product-error" role="alert">
          <div className="error-icon" aria-hidden="true">⚠️</div>
          <h3>Unable to load products</h3>
          <p>{error}</p>
          <button type="button" onClick={fetchProducts} className="btn btn-primary retry-btn">
            Retry
          </button>
        </div>
      ) : products.length === 0 ? (
        <div className="empty-catalog-card" data-testid="product-empty">
          <div className="empty-icon" aria-hidden="true">🔍</div>
          <h2>No products found</h2>
          <p>We couldn&apos;t find any smartphones matching your criteria.</p>
          <button
            type="button"
            onClick={handleClearFilters}
            className="btn btn-primary clear-filters-btn"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <>
          {/* Results Counter */}
          <div className="results-counter-bar">
            <span>
              Showing {products.length} of {pagination.totalItems} smartphones
            </span>
          </div>

          {/* Product Cards Grid */}
          <div className="product-grid" data-testid="product-grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <nav className="pagination-nav" aria-label="Catalog pagination">
              <button
                type="button"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={!pagination.hasPreviousPage}
                data-testid="pagination-previous"
                className="btn btn-secondary pagination-btn"
                aria-label="Previous Page"
              >
                &larr; Previous
              </button>

              <span className="pagination-info" aria-current="page">
                Page {pagination.page} of {pagination.totalPages}
              </span>

              <button
                type="button"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={!pagination.hasNextPage}
                data-testid="pagination-next"
                className="btn btn-secondary pagination-btn"
                aria-label="Next Page"
              >
                Next &rarr;
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
};
