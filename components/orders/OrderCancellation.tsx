'use client';

import { useState } from 'react';

interface OrderCancellationProps {
  orderId: string;
  orderNumber: string;
  status: string;
  onCancel: () => void;
}

export default function OrderCancellation({
  orderId,
  orderNumber,
  status,
  onCancel,
}: OrderCancellationProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only allow cancellation for certain statuses
  const canCancel = !['DELIVERED', 'CANCELLED'].includes(status);

  if (!canCancel) {
    return null;
  }

  const handleCancel = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ reason: reason.trim() || undefined }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel order');
      }

      // Success - notify parent and close dialog
      onCancel();
      setShowDialog(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Cancel Button */}
      <button
        onClick={() => setShowDialog(true)}
        className="w-full sm:w-auto px-6 py-2 border border-red-600 text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors"
      >
        Cancel Order
      </button>

      {/* Cancellation Dialog */}
      {showDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Cancel Order
            </h3>

            <p className="text-gray-600 mb-4">
              Are you sure you want to cancel order <span className="font-mono font-semibold">{orderNumber}</span>?
            </p>

            {status === 'PAID' || status === 'ASSIGNED' ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-800">
                  Your payment will be refunded within 5-7 business days.
                </p>
              </div>
            ) : null}

            {/* Reason Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for cancellation (optional)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Let us know why you're cancelling..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                disabled={loading}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <button
                onClick={() => {
                  setShowDialog(false);
                  setReason('');
                  setError(null);
                }}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Keep Order
              </button>
              <button
                onClick={handleCancel}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Cancelling...
                  </span>
                ) : (
                  'Cancel Order'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
