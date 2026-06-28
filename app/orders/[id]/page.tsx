'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import OrderDetails from '@/components/orders/OrderDetails';
import OrderStatusTimeline from '@/components/orders/OrderStatusTimeline';
import OrderCancellation from '@/components/orders/OrderCancellation';

interface Design {
  id: string;
  imageUrl: string;
  prompt: string;
}

interface CatalogOption {
  id: string;
  name?: string;
  value?: number;
  hexCode?: string;
}

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  design: Design;
  fabric: CatalogOption;
  gsm: CatalogOption;
  size: CatalogOption;
  color: CatalogOption;
}

interface ShippingAddress {
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

interface StatusHistoryEntry {
  status: string;
  createdAt: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  paymentStatus: string;
  shippingAddress: ShippingAddress;
  trackingNumber: string | null;
  estimatedDelivery: string | null;
  createdAt: string;
  items: OrderItem[];
  statusHistory?: StatusHistoryEntry[];
}

export default function OrderDetailsPage() {
  const router = useRouter();
  const params = useParams();
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

      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/signin');
        return;
      }

      const response = await fetch(`/api/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/auth/signin');
          return;
        }
        if (response.status === 404) {
          throw new Error('Order not found');
        }
        if (response.status === 403) {
          throw new Error('You do not have permission to view this order');
        }
        throw new Error('Failed to load order details');
      }

      const data = await response.json();
      setOrder(data.order);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleOrderCancelled = () => {
    // Refresh order data after cancellation
    fetchOrder();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading order details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <Link
              href="/orders"
              className="text-primary-600 hover:text-primary-800 font-medium flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Orders
            </Link>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-800 mb-4">{error}</p>
            <button
              onClick={fetchOrder}
              className="text-red-600 hover:text-red-800 underline"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/orders"
            className="text-primary-600 hover:text-primary-800 font-medium flex items-center gap-2 mb-4"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Orders
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Order {order.orderNumber}
              </h1>
              <p className="text-gray-600">
                Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <OrderCancellation
              orderId={order.id}
              orderNumber={order.orderNumber}
              status={order.status}
              onCancel={handleOrderCancelled}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Order Details */}
          <div className="lg:col-span-2">
            <OrderDetails order={order} />
          </div>

          {/* Right Column - Status Timeline */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <OrderStatusTimeline
                currentStatus={order.status}
                createdAt={order.createdAt}
                statusHistory={order.statusHistory}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
