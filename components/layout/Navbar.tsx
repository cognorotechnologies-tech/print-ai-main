'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('token'));
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    router.push('/');
  };

  // Hide navbar on auth pages
  if (pathname?.startsWith('/auth')) return null;

  const links = [
    { href: '/design', label: '🎨 Design' },
    { href: '/configure', label: '👕 Configure' },
    { href: '/cart', label: '🛒 Cart' },
    { href: '/orders', label: '📦 Orders' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2">
        <span className="text-xl">🎨</span>
        <span className="text-lg font-bold text-gray-900">PrintAI</span>
      </Link>
      <div className="flex items-center gap-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname === link.href
                ? 'bg-primary-50 text-primary-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            {link.label}
          </Link>
        ))}
        {isLoggedIn ? (
          <button
            onClick={handleLogout}
            className="ml-2 border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Sign Out
          </button>
        ) : (
          <Link
            href="/auth/signin"
            className="ml-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            Sign In
          </Link>
        )}
      </div>
    </nav>
  );
}
