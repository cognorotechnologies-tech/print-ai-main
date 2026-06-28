'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PaymentHandler from './PaymentHandler';

interface CartData {
  items: any[];
  totalItems: number;
  totalPrice: number;
}

interface CheckoutFormProps {
  cart: CartData;
}

interface ShippingAddress {
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export default function CheckoutForm({ cart }: CheckoutFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<ShippingAddress>({
    name: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof ShippingAddress, string>>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name as keyof ShippingAddress]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ShippingAddress, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[6-9]\d{9}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid 10-digit mobile number';
    }

    if (!formData.addressLine1.trim()) {
      newErrors.addressLine1 = 'Address is required';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }

    if (!formData.pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
    } else if (!/^\d{6}$/.test(formData.pincode)) {
      newErrors.pincode = 'Please enter a valid 6-digit pincode';
    }

    if (!formData.country.trim()) {
      newErrors.country = 'Country is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Create order
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          shippingAddress: formData,
        }),
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(errorData.error || 'Failed to create order');
      }

      const { order } = await orderResponse.json();
      setOrderId(order.id);

      // Order created successfully, now trigger payment
      // The PaymentHandler component will handle the payment flow
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create order');
      setLoading(false);
    }
  };

  // If order is created, show payment handler
  if (orderId) {
    return (
      <PaymentHandler
        orderId={orderId}
        amount={cart.totalPrice}
        onSuccess={(confirmedOrderId: string) => {
          router.push(`/orders/confirmation/${confirmedOrderId}`);
        }}
        onFailure={(errorMessage: string) => {
          setError(errorMessage);
          setOrderId(null);
          setLoading(false);
        }}
      />
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h2 className="text-xl font-bold mb-6">Shipping Address</h2>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="John Doe"
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
              errors.phone ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="9876543210"
          />
          {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
        </div>

        {/* Address Line 1 */}
        <div>
          <label htmlFor="addressLine1" className="block text-sm font-medium text-gray-700 mb-1">
            Address Line 1 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="addressLine1"
            name="addressLine1"
            value={formData.addressLine1}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
              errors.addressLine1 ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="House/Flat No., Building Name"
          />
          {errors.addressLine1 && <p className="mt-1 text-sm text-red-600">{errors.addressLine1}</p>}
        </div>

        {/* Address Line 2 */}
        <div>
          <label htmlFor="addressLine2" className="block text-sm font-medium text-gray-700 mb-1">
            Address Line 2 (Optional)
          </label>
          <input
            type="text"
            id="addressLine2"
            name="addressLine2"
            value={formData.addressLine2}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Street, Area, Landmark"
          />
        </div>

        {/* City and State */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
              City <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.city ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Mumbai"
            />
            {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
          </div>

          <div>
            <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
              State <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="state"
              name="state"
              value={formData.state}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.state ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Maharashtra"
            />
            {errors.state && <p className="mt-1 text-sm text-red-600">{errors.state}</p>}
          </div>
        </div>

        {/* Pincode and Country */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="pincode" className="block text-sm font-medium text-gray-700 mb-1">
              Pincode <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="pincode"
              name="pincode"
              value={formData.pincode}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.pincode ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="400001"
              maxLength={6}
            />
            {errors.pincode && <p className="mt-1 text-sm text-red-600">{errors.pincode}</p>}
          </div>

          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
              Country <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="country"
              name="country"
              value={formData.country}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.country ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="India"
            />
            {errors.country && <p className="mt-1 text-sm text-red-600">{errors.country}</p>}
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              'Proceed to Payment'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
