import React, { useState, useEffect, useCallback } from 'react';
import { addressService } from '../services/addressService.js';
import type { Address, AddressInput } from '../types/address.js';

interface AddressFormData {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

const initialFormData: AddressFormData = {
  fullName: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'India',
  isDefault: false,
};

export const AddressesPage: React.FC = () => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal / Form state
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<AddressFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof AddressFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchAddresses = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await addressService.getAddresses();
      setAddresses(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load addresses.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const handleOpenAddForm = () => {
    setEditingId(null);
    setFormData({
      ...initialFormData,
      isDefault: addresses.length === 0, // Auto-check if first address
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (addr: Address) => {
    setEditingId(addr.id);
    setFormData({
      fullName: addr.fullName,
      phone: addr.phone,
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2 || '',
      city: addr.city,
      state: addr.state,
      postalCode: addr.postalCode,
      country: addr.country || 'India',
      isDefault: addr.isDefault,
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setFormData(initialFormData);
    setFormErrors({});
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof AddressFormData, string>> = {};

    if (!formData.fullName.trim() || formData.fullName.trim().length < 2) {
      errors.fullName = 'Full name must be at least 2 characters.';
    }

    const cleanPhone = formData.phone.trim().replace(/\s+/g, '');
    if (!/^(\+91[\-\s]?)?[6789]\d{9}$|^[0-9]{10}$/.test(cleanPhone)) {
      errors.phone = 'Please enter a valid 10-digit mobile number.';
    }

    if (!formData.addressLine1.trim() || formData.addressLine1.trim().length < 3) {
      errors.addressLine1 = 'Address Line 1 must be at least 3 characters.';
    }

    if (!formData.city.trim()) {
      errors.city = 'City is required.';
    }

    if (!formData.state.trim()) {
      errors.state = 'State is required.';
    }

    if (!/^[1-9][0-9]{5}$/.test(formData.postalCode.trim())) {
      errors.postalCode = 'Postal code must be a valid 6-digit Indian PIN code.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const payload: AddressInput = {
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        addressLine1: formData.addressLine1.trim(),
        addressLine2: formData.addressLine2.trim() || undefined,
        city: formData.city.trim(),
        state: formData.state.trim(),
        postalCode: formData.postalCode.trim(),
        country: formData.country.trim() || 'India',
        isDefault: formData.isDefault,
      };

      if (editingId) {
        await addressService.updateAddress(editingId, payload);
        setSuccessMessage('Address updated successfully.');
      } else {
        await addressService.createAddress(payload);
        setSuccessMessage('New address saved successfully.');
      }

      handleCloseForm();
      await fetchAddresses();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save address.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this address?')) {
      return;
    }

    setError(null);
    setSuccessMessage(null);
    try {
      await addressService.deleteAddress(id);
      setSuccessMessage('Address deleted successfully.');
      await fetchAddresses();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete address.');
    }
  };

  const handleSetDefault = async (id: string) => {
    setError(null);
    setSuccessMessage(null);
    try {
      await addressService.setDefaultAddress(id);
      setSuccessMessage('Default address updated.');
      await fetchAddresses();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to set default address.');
    }
  };

  return (
    <div className="addresses-container" data-testid="addresses-page">
      <div className="addresses-header">
        <div>
          <h1 className="page-title">Saved Delivery Addresses</h1>
          <p className="page-subtitle">Manage your shipping and billing destinations for rapid checkout.</p>
        </div>
        <button
          type="button"
          onClick={handleOpenAddForm}
          className="btn btn-primary"
          data-testid="add-address-btn"
        >
          + Add New Address
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="alert-banner alert-error" role="alert" data-testid="address-error-banner">
          <span>⚠️ {error}</span>
          <button type="button" className="alert-close-btn" onClick={() => setError(null)}>
            &times;
          </button>
        </div>
      )}

      {successMessage && (
        <div className="alert-banner alert-success" role="status" data-testid="address-success-banner">
          <span>✅ {successMessage}</span>
          <button type="button" className="alert-close-btn" onClick={() => setSuccessMessage(null)}>
            &times;
          </button>
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="loading-container" data-testid="addresses-loading" role="status">
          <div className="spinner" aria-hidden="true"></div>
          <p>Loading your saved addresses...</p>
        </div>
      ) : addresses.length === 0 ? (
        <div className="empty-addresses-card" data-testid="empty-addresses-state">
          <div className="empty-icon" aria-hidden="true">📍</div>
          <h2>No Saved Addresses Found</h2>
          <p>Add your first delivery address to experience one-click checkout.</p>
          <button
            type="button"
            onClick={handleOpenAddForm}
            className="btn btn-primary btn-large"
            data-testid="empty-add-address-btn"
          >
            + Add Delivery Address
          </button>
        </div>
      ) : (
        <div className="address-grid" data-testid="addresses-grid">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`address-card ${addr.isDefault ? 'address-card-default' : ''}`}
              data-testid="address-card"
              data-address-id={addr.id}
            >
              {addr.isDefault && (
                <div className="default-badge" data-testid="default-address-badge">
                  ★ Default Address
                </div>
              )}

              <div className="address-card-content">
                <h3 className="address-name" data-testid="address-full-name">{addr.fullName}</h3>
                <p className="address-phone" data-testid="address-phone">
                  <span className="label">Phone:</span> {addr.phone}
                </p>
                <p className="address-lines" data-testid="address-full-text">
                  {addr.addressLine1}
                  {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                  <br />
                  {addr.city}, {addr.state} - <strong>{addr.postalCode}</strong>
                  <br />
                  {addr.country}
                </p>
              </div>

              <div className="address-card-actions">
                {!addr.isDefault && (
                  <button
                    type="button"
                    onClick={() => handleSetDefault(addr.id)}
                    className="btn btn-sm btn-outline"
                    data-testid="set-default-btn"
                  >
                    Set as Default
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleOpenEditForm(addr)}
                  className="btn btn-sm btn-secondary"
                  data-testid="edit-address-btn"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteAddress(addr.id)}
                  className="btn btn-sm btn-danger"
                  data-testid="delete-address-btn"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Address Form Modal */}
      {isFormOpen && (
        <div className="modal-backdrop" data-testid="address-modal">
          <div className="modal-content" role="dialog" aria-labelledby="modal-title">
            <div className="modal-header">
              <h2 id="modal-title">{editingId ? 'Edit Address' : 'Add New Address'}</h2>
              <button
                type="button"
                className="modal-close-btn"
                onClick={handleCloseForm}
                data-testid="cancel-address-btn"
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="address-form" data-testid="address-form" noValidate>
              <div className="form-row">
                <div className="form-group flex-1">
                  <label htmlFor="fullName">Full Name *</label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className={`form-input ${formErrors.fullName ? 'input-error' : ''}`}
                    placeholder="e.g. John Doe"
                    data-testid="input-full-name"
                    required
                  />
                  {formErrors.fullName && (
                    <span className="error-text" data-testid="error-full-name">{formErrors.fullName}</span>
                  )}
                </div>

                <div className="form-group flex-1">
                  <label htmlFor="phone">10-Digit Mobile Number *</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={`form-input ${formErrors.phone ? 'input-error' : ''}`}
                    placeholder="e.g. 9876543210"
                    data-testid="input-phone"
                    required
                  />
                  {formErrors.phone && (
                    <span className="error-text" data-testid="error-phone">{formErrors.phone}</span>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="addressLine1">Address Line 1 (House No., Building, Street) *</label>
                <input
                  type="text"
                  id="addressLine1"
                  name="addressLine1"
                  value={formData.addressLine1}
                  onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                  className={`form-input ${formErrors.addressLine1 ? 'input-error' : ''}`}
                  placeholder="e.g. Flat 402, Sunshine Heights, MG Road"
                  data-testid="input-address-line1"
                  required
                />
                {formErrors.addressLine1 && (
                  <span className="error-text" data-testid="error-address-line1">{formErrors.addressLine1}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="addressLine2">Address Line 2 (Apartment, Area, Landmark - Optional)</label>
                <input
                  type="text"
                  id="addressLine2"
                  name="addressLine2"
                  value={formData.addressLine2}
                  onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                  className="form-input"
                  placeholder="e.g. Near City Center Mall"
                  data-testid="input-address-line2"
                />
              </div>

              <div className="form-row">
                <div className="form-group flex-1">
                  <label htmlFor="city">City *</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className={`form-input ${formErrors.city ? 'input-error' : ''}`}
                    placeholder="e.g. Mumbai"
                    data-testid="input-city"
                    required
                  />
                  {formErrors.city && (
                    <span className="error-text" data-testid="error-city">{formErrors.city}</span>
                  )}
                </div>

                <div className="form-group flex-1">
                  <label htmlFor="state">State *</label>
                  <input
                    type="text"
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className={`form-input ${formErrors.state ? 'input-error' : ''}`}
                    placeholder="e.g. Maharashtra"
                    data-testid="input-state"
                    required
                  />
                  {formErrors.state && (
                    <span className="error-text" data-testid="error-state">{formErrors.state}</span>
                  )}
                </div>

                <div className="form-group flex-1">
                  <label htmlFor="postalCode">PIN Code *</label>
                  <input
                    type="text"
                    id="postalCode"
                    name="postalCode"
                    maxLength={6}
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    className={`form-input ${formErrors.postalCode ? 'input-error' : ''}`}
                    placeholder="e.g. 400001"
                    data-testid="input-postal-code"
                    required
                  />
                  {formErrors.postalCode && (
                    <span className="error-text" data-testid="error-postal-code">{formErrors.postalCode}</span>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="country">Country</label>
                <input
                  type="text"
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="form-input"
                  data-testid="input-country"
                />
              </div>

              <div className="form-checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="isDefault"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    data-testid="input-is-default"
                  />
                  <span>Make this my default delivery address</span>
                </label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="btn btn-secondary"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  data-testid="save-address-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : editingId ? 'Update Address' : 'Save Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
