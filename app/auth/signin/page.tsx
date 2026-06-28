'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignInPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const endpoint = mode === 'login'
        ? 'http://localhost:4000/api/v1/auth/login'
        : 'http://localhost:4000/api/v1/auth/register';

      const body = mode === 'login'
        ? { email: form.email, password: form.password }
        : { email: form.email, password: form.password, name: form.name };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.details?.[0]?.message || 'Something went wrong');
      }

      if (mode === 'register') {
        setSuccess('Account created! Please sign in.');
        setMode('login');
        setForm(prev => ({ ...prev, password: '' }));
      } else {
        // Store token from Express API
        const token = data.data?.token || data.token;
        if (token) {
          localStorage.setItem('token', token);
        }
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-md p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="text-2xl">🎨</span>
            <span className="text-xl font-bold text-gray-900">PrintAI</span>
          </Link>
          <p className="text-gray-500 mt-2 text-sm">
            {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
          </p>
        </div>

        {/* Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
          <button
            onClick={() => { setMode('login'); setError(null); setSuccess(null); }}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              mode === 'login' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setMode('register'); setError(null); setSuccess(null); }}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              mode === 'register' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="John Doe"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="you@example.com"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={8}
              placeholder="Min. 8 characters"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
