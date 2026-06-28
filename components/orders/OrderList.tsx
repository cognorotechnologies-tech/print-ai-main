'use client';

import Link from 'next/link';

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

interface OrderListProps {
  orders: Order[];
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PAID: 'bg-blue-100 text-blue-800',
  ASSIGNED: 'bg-purple-100 text-purple-800',
  IN_PRODUCTION: 'bg-indigo-100 text-indigo-800',
  SHIPPED: 'bg-green-100 text-green-800',
  DELIVERED: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  PENDING: 'Pending Payment',
  PAID: 'Paid',
  ASSIGNED: 'Assigned to Vendor',
  IN_PRODUCTION: 'In Production',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

export default function OrderList({ orders }: OrderListProps) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-24 w-24 text-gray-400 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No orders yet</h2>
        <p className="text-gray-600 mb-6">Start creating your custom designs!</p>
        <Link
          href="/design"
          className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
        >
          Create a Design
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <Link
          key={order.id}
          href={`/orders/${order.id}`}
          className="block bg-white border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Order {order.orderNumber}
              </h3>
              <p className="text-sm text-gray-600">
                Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  statusColors[order.status] || 'bg-gray-100 text-gray-800'
                }`}
              >
                {statusLabels[order.status] || order.status}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            {/* Order Items Preview */}
            <div className="flex gap-2 overflow-x-auto">
              {order.items.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-lg overflow-hidden"
                >
                  <img
                    src={item.design.imageUrl}
                    alt={item.design.prompt}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
              {order.items.length > 3 && (
                <div className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-gray-600 font-medium">
                    +{order.items.length - 3}
                  </span>
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <p className="text-sm text-gray-600">
                  {order.items.reduce((sum, item) => sum + item.quantity, 0)} item
                  {order.items.reduce((sum, item) => sum + item.quantity, 0) !== 1 ? 's' : ''}
                </p>
                {order.estimatedDelivery && order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                  <p className="text-sm text-gray-600">
                    Est. delivery: {new Date(order.estimatedDelivery).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">
                  ₹{order.totalAmount.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
