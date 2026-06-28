'use client';

import { useRouter } from 'next/navigation';
import ShoppingCart from '@/components/cart/ShoppingCart';

export default function CartPage() {
  const router = useRouter();

  const handleCheckout = () => {
    // Navigate to checkout page
    router.push('/checkout');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <ShoppingCart onCheckout={handleCheckout} />
    </div>
  );
}
