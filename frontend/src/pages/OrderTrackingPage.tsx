import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { orderService } from '../services/orderService.js';
import { formatDate } from '../utils/formatters.js';
import { getApiErrorMessage } from '../services/api.js';
import { CancelOrderModal } from '../components/CancelOrderModal.js';
import type { OrderTrackingData } from '../types/order.js';

export const OrderTrackingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [tracking, setTracking] = useState<OrderTrackingData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Cancellation Modal state
  const [isCancelModalOpen, setIsCancelModalOpen] = useState<boolean>(false);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);

  const fetchTracking = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setError(null);
      const data = await orderService.trackOrder(id);
      setTracking(data);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTracking();
  }, [fetchTracking]);

  const handleCancelOrder = async (reason: string) => {
    if (!id) return;
    try {
      setIsCancelling(true);
      await orderService.cancelOrder(id, reason);
      setSuccessMessage('Order cancelled successfully. Inventory has been restored.');
      setIsCancelModalOpen(false);
      await fetchTracking();
    } catch (err) {
      throw err;
    } finally {
      setIsCancelling(false);
    }
  };

  const isCancellable = tracking && ['PLACED', 'PENDING', 'CONFIRMED', 'PROCESSING'].includes(tracking.status);

  if (isLoading) {
    return (
      <div className="tracking-page-container" data-testid="order-tracking-page">
        <div className="loading-container" role="status">
          <div className="spinner" aria-hidden="true"></div>
          <p>Loading order tracking status...</p>
        </div>
      </div>
    );
  }

  if (error || !tracking) {
    return (
      <div className="tracking-page-container" data-testid="order-tracking-page">
        <div className="alert-banner alert-error" role="alert" data-testid="tracking-error-banner">
          <span>⚠️ {error || 'Order tracking not found.'}</span>
        </div>
        <div className="text-center mt-4">
          <Link to="/orders" className="btn btn-primary">
            &larr; Back to My Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="tracking-page-container" data-testid="order-tracking-page">
      <div className="tracking-header">
        <div className="breadcrumbs">
          <Link to="/orders">My Orders</Link>
          <span>/</span>
          <span className="current-crumb">Track Order</span>
        </div>
        <h1 className="page-title">Order Tracking</h1>
        <p className="page-subtitle">
          Real-time fulfillment milestone timeline for Order <strong className="font-mono text-white" data-testid="tracking-order-number">{tracking.orderNumber}</strong>
        </p>
      </div>

      {successMessage && (
        <div className="alert-banner alert-success mb-4" role="status" data-testid="cancellation-success-banner">
          <span>✅ {successMessage}</span>
          <button type="button" className="alert-close-btn" onClick={() => setSuccessMessage(null)}>
            &times;
          </button>
        </div>
      )}

      {/* Main Tracking Card */}
      <div className="tracking-card" data-testid="tracking-card">
        <div className="tracking-card-top">
          <div className="tracking-id-group">
            <span className="label">Order Reference:</span>
            <span className="order-num font-mono" data-testid="order-number">{tracking.orderNumber}</span>
          </div>

          <div className="tracking-status-group">
            <span className="label">Current Status:</span>
            <span
              className={`status-badge status-${tracking.status.toLowerCase()}`}
              data-testid="tracking-current-status"
            >
              {tracking.status}
            </span>
          </div>
        </div>

        {/* Cancelled Notice Banner */}
        {tracking.status === 'CANCELLED' && (
          <div className="cancelled-callout" data-testid="cancelled-banner">
            <div className="cancelled-callout-icon">🚫</div>
            <div className="cancelled-callout-text">
              <h3>This Order has been Cancelled</h3>
              {tracking.cancelledAt && (
                <p className="text-sm">
                  Cancelled on: <strong>{formatDate(tracking.cancelledAt)}</strong>
                </p>
              )}
              {tracking.cancellationReason && (
                <p className="text-sm cancellation-reason-box mt-1">
                  <strong>Reason:</strong> <em>"{tracking.cancellationReason}"</em>
                </p>
              )}
              <p className="text-xs text-muted mt-1">All reserved device inventory items have been restored.</p>
            </div>
          </div>
        )}

        {/* Timeline Stepper */}
        <div className="order-timeline-stepper" data-testid="order-timeline">
          <h2 className="timeline-title">Fulfillment Progress</h2>
          <div className="timeline-steps">
            {tracking.timeline.map((step, idx) => {
              const isLast = idx === tracking.timeline.length - 1;
              const isCancelledStep = step.status === 'CANCELLED';

              let stepClass = 'step-pending';
              if (step.completed) {
                stepClass = isCancelledStep ? 'step-cancelled' : 'step-completed';
              }

              return (
                <div key={step.status} className={`timeline-step-item ${stepClass}`} data-testid={`timeline-step-${step.status.toLowerCase()}`}>
                  <div className="step-marker-col">
                    <div className="step-node" data-testid={`step-node-${step.status.toLowerCase()}`}>
                      {isCancelledStep ? '✕' : step.completed ? '✓' : idx + 1}
                    </div>
                    {!isLast && <div className={`step-line ${step.completed ? 'step-line-active' : ''}`} />}
                  </div>

                  <div className="step-content-col">
                    <div className="step-header-line">
                      <h3 className="step-title" data-testid={`step-title-${step.status.toLowerCase()}`}>
                        {step.title}
                      </h3>
                      <span className="step-status-pill">
                        {step.completed ? (isCancelledStep ? 'CANCELLED' : 'COMPLETED') : 'PENDING'}
                      </span>
                    </div>

                    <div className="step-time-text" data-testid={`step-time-${step.status.toLowerCase()}`}>
                      {step.timestamp ? (
                        <span>{formatDate(step.timestamp)}</span>
                      ) : (
                        <span className="text-muted">Awaiting milestone completion</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="tracking-actions-bar">
          <div className="tracking-actions-left">
            <Link to="/orders" className="btn btn-outline" data-testid="back-to-orders-btn">
              &larr; Back to My Orders
            </Link>
            <Link
              to={`/order-confirmation/${id}`}
              className="btn btn-secondary"
              data-testid="view-receipt-btn"
            >
              View Order Receipt &rarr;
            </Link>
          </div>

          {isCancellable && (
            <div className="tracking-actions-right">
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => setIsCancelModalOpen(true)}
                data-testid="cancel-order-btn"
              >
                Cancel Order
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cancel Order Modal */}
      <CancelOrderModal
        isOpen={isCancelModalOpen}
        orderNumber={tracking.orderNumber}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={handleCancelOrder}
        isSubmitting={isCancelling}
      />
    </div>
  );
};
