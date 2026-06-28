'use client';

interface CartItem {
  id: string;
  quantity: number;
  price: number;
  design: {
    imageUrl: string;
    prompt: string;
  };
  fabric: { name: string };
  gsm: { value: number };
  size: { name: string };
  color: { name: string; hexCode: string };
}

interface CartData {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
}

interface OrderSummaryProps {
  cart: CartData;
}

export default function OrderSummary({ cart }: OrderSummaryProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-4">
      <h2 className="text-xl font-bold mb-4">Order Summary</h2>

      {/* Cart Items */}
      <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
        {cart.items.map((item) => (
          <div key={item.id} className="flex gap-3 pb-4 border-b border-gray-200 last:border-0">
            {/* Thumbnail */}
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden">
                <img
                  src={item.design.imageUrl}
                  alt={item.design.prompt}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Item Details */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate mb-1">
                {item.design.prompt}
              </p>
              <p className="text-xs text-gray-600 mb-1">
                {item.fabric.name} • {item.gsm.value}GSM • {item.size.name}
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <div
                  className="w-3 h-3 rounded border border-gray-300"
                  style={{ backgroundColor: item.color.hexCode }}
                />
                <span>{item.color.name}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-600">Qty: {item.quantity}</span>
                <span className="text-sm font-semibold text-gray-900">
                  ₹{item.price.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Price Breakdown */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal ({cart.totalItems} items):</span>
          <span>₹{cart.totalPrice.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Shipping:</span>
          <span className="text-green-600 font-medium">FREE</span>
        </div>
        <div className="border-t border-gray-200 pt-3 flex justify-between text-lg font-bold">
          <span>Total:</span>
          <span className="text-primary-600">₹{cart.totalPrice.toFixed(2)}</span>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="pt-6 border-t border-gray-200">
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>Secure payment</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>Free shipping</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>Quality guaranteed</span>
          </div>
        </div>
      </div>
    </div>
  );
}
