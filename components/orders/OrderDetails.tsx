'use client';

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
}

interface OrderDetailsProps {
  order: Order;
}

export default function OrderDetails({ order }: OrderDetailsProps) {
  return (
    <div className="space-y-6">
      {/* Order Items */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
        <div className="space-y-4">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row gap-4 pb-4 border-b border-gray-200 last:border-0 last:pb-0"
            >
              {/* Design Preview */}
              <div className="flex-shrink-0">
                <div className="w-full sm:w-32 h-32 bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={item.design.imageUrl}
                    alt={item.design.prompt}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Item Details */}
              <div className="flex-1 min-w-0">
                <h4 className="text-base font-semibold text-gray-900 mb-2 truncate">
                  {item.design.prompt}
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm text-gray-600 mb-3">
                  <div>
                    <span className="font-medium">Fabric:</span> {item.fabric.name}
                  </div>
                  <div>
                    <span className="font-medium">GSM:</span> {item.gsm.value}
                  </div>
                  <div>
                    <span className="font-medium">Size:</span> {item.size.name}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Color:</span>
                    <div
                      className="w-4 h-4 rounded border border-gray-300"
                      style={{ backgroundColor: item.color.hexCode }}
                      title={item.color.name}
                    />
                    <span>{item.color.name}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Quantity: <span className="font-medium">{item.quantity}</span>
                  </p>
                  <p className="text-base font-bold text-gray-900">
                    ₹{item.price.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Total */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
            <span className="text-2xl font-bold text-primary-600">
              ₹{order.totalAmount.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Shipping Information */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipping Information</h3>
        <div className="space-y-2 text-sm">
          <p className="font-medium text-gray-900">{order.shippingAddress.name}</p>
          <p className="text-gray-600">{order.shippingAddress.phone}</p>
          <p className="text-gray-600">{order.shippingAddress.addressLine1}</p>
          {order.shippingAddress.addressLine2 && (
            <p className="text-gray-600">{order.shippingAddress.addressLine2}</p>
          )}
          <p className="text-gray-600">
            {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}
          </p>
          <p className="text-gray-600">{order.shippingAddress.country}</p>
        </div>

        {order.trackingNumber && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Tracking Number:</p>
            <p className="text-base font-mono font-semibold text-gray-900">
              {order.trackingNumber}
            </p>
          </div>
        )}

        {order.estimatedDelivery && order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Estimated Delivery:</p>
            <p className="text-base font-semibold text-gray-900">
              {new Date(order.estimatedDelivery).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        )}
      </div>

      {/* Payment Information */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Order Number:</span>
            <span className="text-sm font-mono font-semibold text-gray-900">
              {order.orderNumber}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Payment Status:</span>
            <span
              className={`text-sm font-medium px-2 py-1 rounded ${
                order.paymentStatus === 'SUCCESS'
                  ? 'bg-green-100 text-green-800'
                  : order.paymentStatus === 'PENDING'
                  ? 'bg-yellow-100 text-yellow-800'
                  : order.paymentStatus === 'FAILED'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {order.paymentStatus}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Order Date:</span>
            <span className="text-sm font-medium text-gray-900">
              {new Date(order.createdAt).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
