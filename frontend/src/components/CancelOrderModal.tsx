import React, { useState } from 'react';

interface CancelOrderModalProps {
  isOpen: boolean;
  orderNumber: string;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  isSubmitting: boolean;
}

export const CancelOrderModal: React.FC<CancelOrderModalProps> = ({
  isOpen,
  orderNumber,
  onClose,
  onConfirm,
  isSubmitting,
}) => {
  const [reason, setReason] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      await onConfirm(reason);
      setReason('');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to cancel order.');
      }
    }
  };

  return (
    <div className="modal-backdrop" data-testid="cancel-order-modal">
      <div className="modal-card">
        <div className="modal-header">
          <div>
            <h2>Cancel Order?</h2>
            <p className="text-sm text-muted">Order: <strong className="font-mono">{orderNumber}</strong></p>
          </div>
          <button type="button" className="modal-close" onClick={onClose} disabled={isSubmitting}>
            ✕
          </button>
        </div>

        {error && (
          <div className="alert-banner alert-error mb-4" role="alert" data-testid="cancel-error-banner">
            <span>⚠️ {error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p className="mb-3 text-sm">
              Are you sure you want to cancel this order? Once cancelled, this action cannot be undone and your inventory items will be immediately restored.
            </p>

            <div className="form-group">
              <label htmlFor="cancel-reason" className="form-label">
                Reason for cancellation <span className="text-muted text-xs">(optional)</span>
              </label>
              <textarea
                id="cancel-reason"
                className="form-textarea"
                rows={3}
                placeholder="e.g. Changed my mind, found better deal, ordered by mistake..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={500}
                disabled={isSubmitting}
                data-testid="cancel-reason-input"
              />
              <span className="text-xs text-muted text-right block">{reason.length}/500</span>
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
              disabled={isSubmitting}
              data-testid="keep-order-btn"
            >
              Keep Order
            </button>
            <button
              type="submit"
              className="btn btn-danger"
              disabled={isSubmitting}
              data-testid="confirm-cancel-order-btn"
            >
              {isSubmitting ? 'Cancelling...' : 'Cancel Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
