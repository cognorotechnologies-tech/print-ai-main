'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import OrderDetails from '@/components/orders/OrderDetails';
import OrderStatusTimeline from '@/components/orders/OrderStatusTimeline';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  paymentStatus: string;
  shippingAddress: any;
  trackingNumber: string | null;
  estimatedDelivery: string | null;
  createdAt: string;
  items: any[];
}

export default function OrderConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Order not found');
        }
        if (response.status === 401) {
          throw new Error('Please log in to view this order');
        }
        throw new Error('Failed to load order details');
      }

      const data = await response.json();
      setOrder(data.order);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <p className="text-red-800 mb-4">{error || 'Order not found'}</p>
          <button
            onClick={() => router.push('/orders')}
            className="text-red-600 hover:text-red-800 underline"
          >
            View all orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Success Message */}
        <div className="bg-white border border-green-200 rounded-lg p-8 mb-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <svg
                className="h-10 w-10 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
            <p className="text-lg text-gray-600 mb-4">
              Thank you for your order. We've received your payment and will start processing your order soon.
            </p>
            <p className="text-sm text-gray-500">
              Order Number: <span className="font-mono font-semibold">{order.orderNumber}</span>
            </p>
            <p className="text-sm text-gray-500 mt-1">
              A confirmation email has been sent to your registered email address.
            </p>
          </div>
        </div>

        {/* Order Status Timeline */}
        <div className="mb-6">
          <OrderStatusTimeline currentStatus={order.status} createdAt={order.createdAt} />
        </div>

        {/* Order Details */}
        <OrderDetails order={order} />

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => router.push('/orders')}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
          >
            View All Orders
          </button>
          <button
            onClick={() => router.push('/design')}
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            Create Another Design
          </button>
        </div>
      </div>
    </div>
  );
}
