'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import OrderList from '@/components/orders/OrderList';

interface Design {
  id: string;
  imageUrl: string;
  prompt: string;
}

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  design: Design;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  estimatedDelivery: string | null;
  items: OrderItem[];
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/signin');
        return;
      }

      const response = await fetch('/api/orders', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/auth/signin');
          return;
        }
        throw new Error('Failed to load orders');
      }

      const data = await response.json();
      setOrders(data.orders || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your orders...</p>
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
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-800 mb-4">{error}</p>
            <button
              onClick={fetchOrders}
              className="text-red-600 hover:text-red-800 underline"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Orders</h1>
          <p className="text-gray-600">
            Track and manage your orders
          </p>
        </div>

        {/* Orders List */}
        <OrderList orders={orders} />
      </div>
    </div>
  );
}
