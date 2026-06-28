'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import ProductConfigurator from '@/components/product/ProductConfigurator';

function ConfigureContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const designUrl = searchParams.get('designUrl') || 'https://placehold.co/600x600/e2e8f0/64748b?text=Your+Design';
  const designId = searchParams.get('designId') || '';

  const handleAddToCart = async (config: any, price: number) => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/signin');
      return;
    }

    try {
      const res = await fetch('/api/cart/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          designId: designId || config.designId,
          fabricId: config.fabricId,
          gsmId: config.gsmId,
          sizeId: config.sizeId,
          colorId: config.colorId,
          quantity: config.quantity,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Failed to add to cart');
        return;
      }

      router.push('/cart');
    } catch {
      alert('Failed to add to cart. Please try again.');
    }
  };

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Configure Your T-Shirt</h1>
          <p className="mt-2 text-gray-600">
            Customize your design with fabric, size, and color options
          </p>
        </div>
        <ProductConfigurator
          designUrl={designUrl}
          onAddToCart={handleAddToCart}
        />
      </div>
    </main>
  );
}

export default function ConfigurePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>}>
      <ConfigureContent />
    </Suspense>
  );
}
