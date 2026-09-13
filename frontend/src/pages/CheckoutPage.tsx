import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { checkoutService } from '../services/checkoutService.js';
import { addressService } from '../services/addressService.js';
import { orderService } from '../services/orderService.js';
import { useCart } from '../hooks/useCart.js';
import { formatPrice } from '../utils/formatters.js';
import { getApiErrorMessage } from '../services/api.js';
import type { CheckoutSummary, CardDetails, OrderPlacementInput } from '../types/checkout.js';
import type { Address, AddressInput } from '../types/address.js';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { refreshCart } = useCart();

  const [summary, setSummary] = useState<CheckoutSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState<boolean>(false);

  // Selected State
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'CARD'>('COD');

  // Card Form State
  const [cardDetails, setCardDetails] = useState<CardDetails>({
    cardNumber: '',
    cardHolder: '',
    expiry: '',
    cvv: '',
  });
  const [cardErrors, setCardErrors] = useState<Partial<Record<keyof CardDetails, string>>>({});

  // Inline New Address Form State
  const [showNewAddressForm, setShowNewAddressForm] = useState<boolean>(false);
  const [newAddress, setNewAddress] = useState<AddressInput>({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    isDefault: false,
  });
  const [newAddressErrors, setNewAddressErrors] = useState<Partial<Record<keyof AddressInput, string>>>({});
  const [isSavingAddress, setIsSavingAddress] = useState<boolean>(false);

  const fetchCheckoutData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await checkoutService.getCheckoutSummary();
      setSummary(data);

      if (data.defaultAddress) {
        setSelectedAddressId(data.defaultAddress.id);
      } else if (data.addresses.length > 0) {
        setSelectedAddressId(data.addresses[0].id);
      }
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCheckoutData();
  }, [fetchCheckoutData]);

  // Card formatting helpers
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, '').slice(0, 19);
    const formatted = rawVal.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardDetails({ ...cardDetails, cardNumber: formatted });
    if (cardErrors.cardNumber) {
      setCardErrors({ ...cardErrors, cardNumber: undefined });
    }
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (val.length >= 3) {
      val = `${val.slice(0, 2)}/${val.slice(2)}`;
    }
    setCardDetails({ ...cardDetails, expiry: val });
    if (cardErrors.expiry) {
      setCardErrors({ ...cardErrors, expiry: undefined });
    }
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setCardDetails({ ...cardDetails, cvv: val });
    if (cardErrors.cvv) {
      setCardErrors({ ...cardErrors, cvv: undefined });
    }
  };

  // Inline address submission
  const handleSaveInlineAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Partial<Record<keyof AddressInput, string>> = {};

    if (!newAddress.fullName.trim()) errs.fullName = 'Full name is required.';
    if (!/^[0-9]{10}$/.test(newAddress.phone.replace(/\s+/g, ''))) errs.phone = 'Enter valid 10-digit mobile number.';
    if (!newAddress.addressLine1.trim()) errs.addressLine1 = 'Address line 1 is required.';
    if (!newAddress.city.trim()) errs.city = 'City is required.';
    if (!newAddress.state.trim()) errs.state = 'State is required.';
    if (!/^[1-9][0-9]{5}$/.test(newAddress.postalCode.trim())) errs.postalCode = 'Enter valid 6-digit PIN code.';

    if (Object.keys(errs).length > 0) {
      setNewAddressErrors(errs);
      return;
    }

    try {
      setIsSavingAddress(true);
      setError(null);
      const created = await addressService.createAddress(newAddress);
      setShowNewAddressForm(false);
      setNewAddress({
        fullName: '',
        phone: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India',
        isDefault: false,
      });
      // Refresh summary to get new addresses
      const refreshed = await checkoutService.getCheckoutSummary();
      setSummary(refreshed);
      setSelectedAddressId(created.id);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsSavingAddress(false);
    }
  };

  // Validate Card Details
  const validateCard = (): boolean => {
    const errs: Partial<Record<keyof CardDetails, string>> = {};
    const cleanNum = cardDetails.cardNumber.replace(/\s+/g, '');

    if (!cleanNum || cleanNum.length < 13 || cleanNum.length > 19) {
      errs.cardNumber = 'Please enter a valid card number (13-19 digits).';
    }
    if (!cardDetails.cardHolder.trim() || cardDetails.cardHolder.trim().length < 2) {
      errs.cardHolder = 'Cardholder name is required.';
    }
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(cardDetails.expiry)) {
      errs.expiry = 'Invalid expiry format (MM/YY).';
    }
    if (!/^\d{3,4}$/.test(cardDetails.cvv)) {
      errs.cvv = 'CVV must be 3 or 4 digits.';
    }

    setCardErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Place Order Handler
  const handlePlaceOrder = async () => {
    setError(null);

    if (!selectedAddressId) {
      setError('Please select or add a delivery address.');
      return;
    }

    if (paymentMethod === 'CARD') {
      if (!validateCard()) {
        setError('Please correct the invalid card details below.');
        return;
      }
    }

    try {
      setIsPlacingOrder(true);
      const payload: OrderPlacementInput = {
        addressId: selectedAddressId,
        paymentMethod,
        cardDetails:
          paymentMethod === 'CARD'
            ? {
                cardNumber: cardDetails.cardNumber.replace(/\s+/g, ''),
                cardHolder: cardDetails.cardHolder.trim(),
                expiry: cardDetails.expiry.trim(),
                cvv: cardDetails.cvv.trim(),
              }
            : undefined,
      };

      const createdOrder = await orderService.createOrder(payload);
      await refreshCart();
      navigate(`/order-confirmation/${createdOrder.id}`, { state: { order: createdOrder } });
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
      // Refresh summary to catch any stock updates
      try {
        const refreshed = await checkoutService.getCheckoutSummary();
        setSummary(refreshed);
      } catch {
        // ignore
      }
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (isLoading) {
    return (
      <div className="checkout-container" data-testid="checkout-page">
        <div className="loading-container" data-testid="checkout-loading" role="status">
          <div className="spinner" aria-hidden="true"></div>
          <p>Preparing secure checkout...</p>
        </div>
      </div>
    );
  }

  const items = summary?.cart.items || [];

  if (!summary || items.length === 0) {
    return (
      <div className="checkout-container" data-testid="checkout-page">
        <div className="empty-checkout-card" data-testid="empty-checkout-state">
          <div className="empty-icon" aria-hidden="true">🛒</div>
          <h2>Your Cart is Empty</h2>
          <p>You cannot proceed to checkout without any smartphones in your cart.</p>
          <Link to="/products" className="btn btn-primary btn-large">
            Browse Smartphones
          </Link>
        </div>
      </div>
    );
  }

  const addresses = summary.addresses || [];
  const pricing = summary.pricing;

  return (
    <div className="checkout-container" data-testid="checkout-page">
      <div className="checkout-header">
        <h1 className="page-title">Secure Checkout</h1>
        <div className="checkout-step-indicators">
          <span className="step-badge active">1. Delivery</span>
          <span className="step-badge-sep">&rarr;</span>
          <span className="step-badge active">2. Payment</span>
          <span className="step-badge-sep">&rarr;</span>
          <span className="step-badge active">3. Confirmation</span>
        </div>
      </div>

      {error && (
        <div className="alert-banner alert-error" role="alert" data-testid="checkout-error-banner">
          <span>⚠️ {error}</span>
          <button type="button" className="alert-close-btn" onClick={() => setError(null)}>
            &times;
          </button>
        </div>
      )}

      {summary.stockIssues && summary.stockIssues.length > 0 && (
        <div className="alert-banner alert-warning" role="alert" data-testid="stock-warning-banner">
          <div>
            <strong>Inventory Notice:</strong>
            <ul>
              {summary.stockIssues.map((issue, idx) => (
                <li key={idx}>{issue}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="checkout-grid">
        {/* Left Column: Delivery & Payment Options */}
        <div className="checkout-main-column">
          {/* Section 1: Delivery Address */}
          <section className="checkout-section-card" data-testid="section-address">
            <div className="section-header">
              <div className="section-icon-badge">1</div>
              <div>
                <h2 className="section-title">Delivery Address</h2>
                <p className="section-subtitle">Select where you would like your order delivered.</p>
              </div>
            </div>

            {addresses.length === 0 && !showNewAddressForm ? (
              <div className="no-address-prompt" data-testid="no-address-prompt">
                <p>You have no saved delivery addresses.</p>
                <button
                  type="button"
                  onClick={() => setShowNewAddressForm(true)}
                  className="btn btn-primary"
                  data-testid="checkout-add-address-btn"
                >
                  + Add Delivery Address
                </button>
              </div>
            ) : (
              <div className="address-select-list" data-testid="address-select-list">
                {addresses.map((addr: Address) => (
                  <label
                    key={addr.id}
                    className={`address-select-card ${selectedAddressId === addr.id ? 'selected' : ''}`}
                    data-testid={`address-option-${addr.id}`}
                  >
                    <div className="radio-control">
                      <input
                        type="radio"
                        name="selectedAddress"
                        value={addr.id}
                        checked={selectedAddressId === addr.id}
                        onChange={() => setSelectedAddressId(addr.id)}
                        data-testid="radio-address"
                      />
                    </div>
                    <div className="address-details">
                      <div className="address-recipient">
                        <strong>{addr.fullName}</strong>
                        {addr.isDefault && <span className="default-pill">Default</span>}
                        <span className="address-phone-text">📞 {addr.phone}</span>
                      </div>
                      <p className="address-text">
                        {addr.addressLine1}
                        {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}, {addr.city}, {addr.state} - {addr.postalCode}
                      </p>
                    </div>
                  </label>
                ))}

                {!showNewAddressForm && (
                  <div className="add-address-action">
                    <button
                      type="button"
                      onClick={() => setShowNewAddressForm(true)}
                      className="btn btn-outline"
                      data-testid="checkout-new-address-toggle"
                    >
                      + Deliver to a Different Address
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Inline New Address Form */}
            {showNewAddressForm && (
              <div className="inline-address-form-box" data-testid="inline-address-form">
                <h3>Add New Delivery Address</h3>
                <form onSubmit={handleSaveInlineAddress}>
                  <div className="form-row">
                    <div className="form-group flex-1">
                      <label>Full Name *</label>
                      <input
                        type="text"
                        value={newAddress.fullName}
                        onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
                        className={`form-input ${newAddressErrors.fullName ? 'input-error' : ''}`}
                        placeholder="John Doe"
                        data-testid="inline-name"
                      />
                      {newAddressErrors.fullName && <span className="error-text">{newAddressErrors.fullName}</span>}
                    </div>
                    <div className="form-group flex-1">
                      <label>Mobile Number *</label>
                      <input
                        type="tel"
                        value={newAddress.phone}
                        onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                        className={`form-input ${newAddressErrors.phone ? 'input-error' : ''}`}
                        placeholder="9876543210"
                        data-testid="inline-phone"
                      />
                      {newAddressErrors.phone && <span className="error-text">{newAddressErrors.phone}</span>}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Address Line 1 *</label>
                    <input
                      type="text"
                      value={newAddress.addressLine1}
                      onChange={(e) => setNewAddress({ ...newAddress, addressLine1: e.target.value })}
                      className={`form-input ${newAddressErrors.addressLine1 ? 'input-error' : ''}`}
                      placeholder="Flat, House No., Street"
                      data-testid="inline-line1"
                    />
                    {newAddressErrors.addressLine1 && <span className="error-text">{newAddressErrors.addressLine1}</span>}
                  </div>

                  <div className="form-group">
                    <label>Address Line 2 (Optional)</label>
                    <input
                      type="text"
                      value={newAddress.addressLine2 || ''}
                      onChange={(e) => setNewAddress({ ...newAddress, addressLine2: e.target.value })}
                      className="form-input"
                      placeholder="Area, Landmark"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group flex-1">
                      <label>City *</label>
                      <input
                        type="text"
                        value={newAddress.city}
                        onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                        className={`form-input ${newAddressErrors.city ? 'input-error' : ''}`}
                        data-testid="inline-city"
                      />
                      {newAddressErrors.city && <span className="error-text">{newAddressErrors.city}</span>}
                    </div>
                    <div className="form-group flex-1">
                      <label>State *</label>
                      <input
                        type="text"
                        value={newAddress.state}
                        onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                        className={`form-input ${newAddressErrors.state ? 'input-error' : ''}`}
                        data-testid="inline-state"
                      />
                      {newAddressErrors.state && <span className="error-text">{newAddressErrors.state}</span>}
                    </div>
                    <div className="form-group flex-1">
                      <label>PIN Code *</label>
                      <input
                        type="text"
                        maxLength={6}
                        value={newAddress.postalCode}
                        onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                        className={`form-input ${newAddressErrors.postalCode ? 'input-error' : ''}`}
                        data-testid="inline-pin"
                      />
                      {newAddressErrors.postalCode && <span className="error-text">{newAddressErrors.postalCode}</span>}
                    </div>
                  </div>

                  <div className="inline-form-actions">
                    <button
                      type="button"
                      onClick={() => setShowNewAddressForm(false)}
                      className="btn btn-secondary"
                      disabled={isSavingAddress}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      data-testid="inline-save-address-btn"
                      disabled={isSavingAddress}
                    >
                      {isSavingAddress ? 'Saving...' : 'Use This Address'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </section>

          {/* Section 2: Payment Method */}
          <section className="checkout-section-card" data-testid="section-payment">
            <div className="section-header">
              <div className="section-icon-badge">2</div>
              <div>
                <h2 className="section-title">Payment Method</h2>
                <p className="section-subtitle">Select your preferred transaction channel.</p>
              </div>
            </div>

            <div className="payment-options-list" data-testid="payment-methods">
              {/* Option 1: Cash on Delivery */}
              <label
                className={`payment-method-card ${paymentMethod === 'COD' ? 'selected' : ''}`}
                data-testid="payment-method-cod"
              >
                <div className="radio-control">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="COD"
                    checked={paymentMethod === 'COD'}
                    onChange={() => setPaymentMethod('COD')}
                    data-testid="radio-cod"
                  />
                </div>
                <div className="payment-info">
                  <div className="payment-title-row">
                    <span className="payment-icon">💵</span>
                    <strong>Cash on Delivery (COD)</strong>
                  </div>
                  <p className="payment-desc">Pay with cash or UPI upon delivery to your doorstep.</p>
                </div>
              </label>

              {/* Option 2: Credit / Debit Card Simulation */}
              <label
                className={`payment-method-card ${paymentMethod === 'CARD' ? 'selected' : ''}`}
                data-testid="payment-method-card"
              >
                <div className="radio-control">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="CARD"
                    checked={paymentMethod === 'CARD'}
                    onChange={() => setPaymentMethod('CARD')}
                    data-testid="radio-card"
                  />
                </div>
                <div className="payment-info">
                  <div className="payment-title-row">
                    <span className="payment-icon">💳</span>
                    <strong>Credit / Debit Card (Instant Simulation)</strong>
                    <span className="secure-badge">Simulated & Safe</span>
                  </div>
                  <p className="payment-desc">Supports Visa, MasterCard, RuPay, and American Express.</p>
                </div>
              </label>
            </div>

            {/* Card Details Form */}
            {paymentMethod === 'CARD' && (
              <div className="card-form-box" data-testid="card-details-form">
                <div className="demo-card-hint" data-testid="demo-card-hint">
                  💡 <strong>Demo Testing Card:</strong> <code>4111 1111 1111 1111</code> | Expiry: <code>12/28</code> | CVV: <code>123</code>
                </div>

                <div className="form-group">
                  <label htmlFor="cardHolder">Cardholder Name *</label>
                  <input
                    type="text"
                    id="cardHolder"
                    value={cardDetails.cardHolder}
                    onChange={(e) => setCardDetails({ ...cardDetails, cardHolder: e.target.value })}
                    className={`form-input ${cardErrors.cardHolder ? 'input-error' : ''}`}
                    placeholder="e.g. John Doe"
                    data-testid="input-card-holder"
                  />
                  {cardErrors.cardHolder && <span className="error-text" data-testid="error-card-holder">{cardErrors.cardHolder}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="cardNumber">Card Number *</label>
                  <input
                    type="text"
                    id="cardNumber"
                    value={cardDetails.cardNumber}
                    onChange={handleCardNumberChange}
                    className={`form-input ${cardErrors.cardNumber ? 'input-error' : ''}`}
                    placeholder="4111 1111 1111 1111"
                    data-testid="input-card-number"
                  />
                  {cardErrors.cardNumber && <span className="error-text" data-testid="error-card-number">{cardErrors.cardNumber}</span>}
                </div>

                <div className="form-row">
                  <div className="form-group flex-1">
                    <label htmlFor="expiry">Expiry (MM/YY) *</label>
                    <input
                      type="text"
                      id="expiry"
                      maxLength={5}
                      value={cardDetails.expiry}
                      onChange={handleExpiryChange}
                      className={`form-input ${cardErrors.expiry ? 'input-error' : ''}`}
                      placeholder="12/28"
                      data-testid="input-card-expiry"
                    />
                    {cardErrors.expiry && <span className="error-text" data-testid="error-card-expiry">{cardErrors.expiry}</span>}
                  </div>

                  <div className="form-group flex-1">
                    <label htmlFor="cvv">CVV (3 or 4 digits) *</label>
                    <input
                      type="password"
                      id="cvv"
                      maxLength={4}
                      value={cardDetails.cvv}
                      onChange={handleCvvChange}
                      className={`form-input ${cardErrors.cvv ? 'input-error' : ''}`}
                      placeholder="123"
                      data-testid="input-card-cvv"
                    />
                    {cardErrors.cvv && <span className="error-text" data-testid="error-card-cvv">{cardErrors.cvv}</span>}
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Order Items & Pricing Summary */}
        <aside className="checkout-summary-column">
          <div className="order-summary-card" data-testid="checkout-summary-card">
            <h2 className="summary-title">Order Review ({items.length} {items.length === 1 ? 'item' : 'items'})</h2>

            {/* Cart Items List */}
            <div className="checkout-items-preview" data-testid="checkout-items-list">
              {items.map((it) => (
                <div key={it.id} className="checkout-item-row" data-testid="checkout-item">
                  <img
                    src={it.product.image}
                    alt={it.product.name}
                    className="item-preview-img"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>';
                    }}
                  />
                  <div className="item-preview-info">
                    <div className="item-preview-name">{it.product.name}</div>
                    <div className="item-preview-qty">
                      Qty: <strong>{it.quantity}</strong> &times; {formatPrice(it.unitPrice)}
                    </div>
                  </div>
                  <div className="item-preview-total" data-testid="checkout-item-total">
                    {formatPrice(it.itemTotal)}
                  </div>
                </div>
              ))}
            </div>

            <div className="summary-divider"></div>

            {/* Price Calculations */}
            <div className="summary-row">
              <span>Subtotal</span>
              <strong data-testid="checkout-subtotal">{formatPrice(pricing.subtotal)}</strong>
            </div>

            <div className="summary-row">
              <span>Standard Shipping</span>
              {pricing.isFreeShipping ? (
                <span className="text-success-badge" data-testid="checkout-shipping">FREE</span>
              ) : (
                <span data-testid="checkout-shipping">{formatPrice(pricing.shippingAmount)}</span>
              )}
            </div>

            <div className="summary-row">
              <span>GST (18% Estimated)</span>
              <span data-testid="checkout-tax">{formatPrice(pricing.taxAmount)}</span>
            </div>

            <div className="summary-divider"></div>

            <div className="summary-total-row">
              <span>Grand Total</span>
              <span className="grand-total-val" data-testid="checkout-total">{formatPrice(pricing.totalAmount)}</span>
            </div>

            {/* Place Order CTA */}
            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={isPlacingOrder || addresses.length === 0}
              className="btn btn-primary btn-block btn-checkout"
              data-testid="place-order-btn"
            >
              {isPlacingOrder ? 'Processing Order...' : `Place Order • ${formatPrice(pricing.totalAmount)}`}
            </button>

            <div className="checkout-trust-badges">
              <span className="trust-badge-item">🔒 256-Bit SSL Checkout</span>
              <span className="trust-badge-item">🛡️ 100% Genuine Device Guarantee</span>
              <span className="trust-badge-item">📦 Fast Express Dispatch</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
