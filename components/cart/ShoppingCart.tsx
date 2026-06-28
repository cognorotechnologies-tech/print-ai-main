'use client';

import { useState, useEffect } from 'react';

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

interface CartItem {
  id: string;
  userId: string;
  designId: string;
  fabricId: string;
  gsmId: string;
  sizeId: string;
  colorId: string;
  quantity: number;
  price: number;
  createdAt: string;
  updatedAt: string;
  design: Design;
  fabric: CatalogOption;
  gsm: CatalogOption;
  size: CatalogOption;
  color: CatalogOption;
}

interface CartData {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
}

interface ShoppingCartProps {
  onCheckout?: () => void;
}

export default function ShoppingCart({ onCheckout }: ShoppingCartProps) {
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());
  const [removingItems, setRemovingItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/cart', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please log in to view your cart');
        }
        throw new Error('Failed to load cart');
      }

      const data = await response.json();
      setCart(data.cart);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    try {
      setUpdatingItems(prev => new Set(prev).add(itemId));

      const response = await fetch(`/api/cart/items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ quantity: newQuantity }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update quantity');
      }

      // Refresh cart to get updated totals
      await fetchCart();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update quantity');
    } finally {
      setUpdatingItems(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const removeItem = async (itemId: string) => {
    if (!confirm('Remove this item from your cart?')) return;

    try {
      setRemovingItems(prev => new Set(prev).add(itemId));

      const response = await fetch(`/api/cart/items/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove item');
      }

      // Refresh cart
      await fetchCart();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to remove item');
    } finally {
      setRemovingItems(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const clearCart = async () => {
    if (!confirm('Remove all items from your cart?')) return;

    try {
      setLoading(true);

      const response = await fetch('/api/cart', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to clear cart');
      }

      await fetchCart();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to clear cart');
      setLoading(false);
    }
  };

  const handleCheckout = () => {
    if (onCheckout) {
      onCheckout();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your cart...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800 mb-4">{error}</p>
        <button
          onClick={fetchCart}
          className="text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  // Empty cart state
  if (!cart || cart.items.length === 0) {
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
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
          />
        </svg>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-gray-600 mb-6">Add some awesome designs to get started!</p>
        <a
          href="/design"
          className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
        >
          Create a Design
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Cart Items */}
        <div className="flex-1">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Shopping Cart</h1>
            {cart.items.length > 0 && (
              <button
                onClick={clearCart}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Clear Cart
              </button>
            )}
          </div>

          <div className="space-y-4">
            {cart.items.map((item) => (
              <div
                key={item.id}
                className={`bg-white border border-gray-200 rounded-lg p-4 sm:p-6 transition-opacity ${
                  removingItems.has(item.id) ? 'opacity-50' : ''
                }`}
              >
                <div className="flex flex-col sm:flex-row gap-4">
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
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">
                      {item.design.prompt}
                    </h3>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm text-gray-600 mb-4">
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

                    {/* Quantity and Price Controls */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-3">
                        <label className="text-sm font-medium text-gray-700">Quantity:</label>
                        <div className="flex items-center border border-gray-300 rounded-lg">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1 || updatingItems.has(item.id)}
                            className="px-3 py-1 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            −
                          </button>
                          <span className="px-4 py-1 min-w-[3rem] text-center font-medium">
                            {updatingItems.has(item.id) ? '...' : item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={updatingItems.has(item.id)}
                            className="px-3 py-1 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Price and Remove */}
                      <div className="flex items-center justify-between sm:justify-end gap-4">
                        <div className="text-right">
                          <div className="text-sm text-gray-600">
                            ₹{(item.price / item.quantity).toFixed(2)} each
                          </div>
                          <div className="text-lg font-bold text-gray-900">
                            ₹{item.price.toFixed(2)}
                          </div>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          disabled={removingItems.has(item.id)}
                          className="text-red-600 hover:text-red-800 p-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Remove item"
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
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:w-96">
          <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-4">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Items ({cart.totalItems}):</span>
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

            <button
              onClick={handleCheckout}
              className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-700 transition-colors mb-3"
            >
              Proceed to Checkout
            </button>

            <a
              href="/design"
              className="block w-full text-center text-primary-600 hover:text-primary-800 py-2 font-medium"
            >
              Continue Shopping
            </a>

            {/* Trust Badges */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Secure checkout</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Free shipping on all orders</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>High-quality printing guaranteed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
