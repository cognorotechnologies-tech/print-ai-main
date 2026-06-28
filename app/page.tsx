import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎨</span>
          <span className="text-xl font-bold text-gray-900">PrintAI</span>
        </div>
        <div className="flex items-center gap-6 text-sm font-medium text-gray-600">
          <Link href="/design" className="hover:text-gray-900 transition-colors">Design</Link>
          <Link href="/configure" className="hover:text-gray-900 transition-colors">Configure</Link>
          <Link href="/cart" className="hover:text-gray-900 transition-colors">Cart</Link>
          <Link href="/orders" className="hover:text-gray-900 transition-colors">Orders</Link>
          <Link href="/checkout" className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
          <span>✨</span> AI-Powered Print on Demand
        </div>
        <h1 className="text-5xl font-extrabold text-gray-900 leading-tight mb-6">
          Design custom T-shirts<br />with the power of AI
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10">
          Describe your idea, let AI generate a unique design, configure your product, and order — all in minutes.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/design"
            className="bg-indigo-600 text-white px-8 py-3.5 rounded-xl font-semibold text-lg hover:bg-indigo-700 transition-colors shadow-md"
          >
            Start Designing
          </Link>
          <Link
            href="/configure"
            className="border border-gray-200 text-gray-700 px-8 py-3.5 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-colors"
          >
            Browse Products
          </Link>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/design" className="group p-6 border border-gray-100 rounded-2xl hover:border-indigo-200 hover:shadow-md transition-all">
            <div className="text-3xl mb-4">🤖</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">AI Design Studio</h3>
            <p className="text-gray-500 text-sm">Type a prompt and generate stunning T-shirt designs using Stability AI and DALL-E 3.</p>
          </Link>

          <Link href="/configure" className="group p-6 border border-gray-100 rounded-2xl hover:border-indigo-200 hover:shadow-md transition-all">
            <div className="text-3xl mb-4">👕</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">Product Configurator</h3>
            <p className="text-gray-500 text-sm">Choose fabric, GSM, size, and color. See real-time pricing and mockup previews.</p>
          </Link>

          <Link href="/cart" className="group p-6 border border-gray-100 rounded-2xl hover:border-indigo-200 hover:shadow-md transition-all">
            <div className="text-3xl mb-4">🛒</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">Cart & Checkout</h3>
            <p className="text-gray-500 text-sm">Manage your cart and checkout securely with Razorpay payment integration.</p>
          </Link>

          <Link href="/orders" className="group p-6 border border-gray-100 rounded-2xl hover:border-indigo-200 hover:shadow-md transition-all">
            <div className="text-3xl mb-4">📦</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">Order Tracking</h3>
            <p className="text-gray-500 text-sm">Track your orders in real-time with a full status timeline and delivery estimates.</p>
          </Link>

          <div className="p-6 border border-gray-100 rounded-2xl bg-gray-50 opacity-60">
            <div className="text-3xl mb-4">🔔</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Notifications</h3>
            <p className="text-gray-500 text-sm">WhatsApp, Email & SMS notifications for every order update. <span className="text-xs text-indigo-500 font-medium">Coming soon</span></p>
          </div>

          <div className="p-6 border border-gray-100 rounded-2xl bg-gray-50 opacity-60">
            <div className="text-3xl mb-4">🏭</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Vendor Portal</h3>
            <p className="text-gray-500 text-sm">Vendor management, order routing, and print file generation. <span className="text-xs text-indigo-500 font-medium">Coming soon</span></p>
          </div>
        </div>
      </section>

      {/* Status Banner */}
      <section className="bg-gray-50 border-t border-gray-100 px-6 py-10">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-lg font-semibold text-gray-700 mb-6 text-center">Platform Status</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {[
              { label: 'Auth System', status: 'live', icon: '🔐' },
              { label: 'AI Design Gen', status: 'live', icon: '🎨' },
              { label: 'Product Catalog', status: 'live', icon: '📋' },
              { label: 'Cart & Orders', status: 'live', icon: '🛒' },
              { label: 'Payments', status: 'live', icon: '💳' },
              { label: 'Notifications', status: 'soon', icon: '🔔' },
              { label: 'Vendor Portal', status: 'soon', icon: '🏭' },
              { label: 'Admin Panel', status: 'soon', icon: '⚙️' },
            ].map((item) => (
              <div key={item.label} className="bg-white rounded-xl p-4 border border-gray-100">
                <div className="text-2xl mb-2">{item.icon}</div>
                <div className="text-sm font-medium text-gray-800">{item.label}</div>
                <div className={`text-xs mt-1 font-semibold ${item.status === 'live' ? 'text-green-600' : 'text-amber-500'}`}>
                  {item.status === 'live' ? '● Live' : '○ Coming Soon'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 px-6 py-6 text-center text-sm text-gray-400">
        PrintAI Platform — AI-Powered Print on Demand · Built with Next.js, Express, PostgreSQL & Redis
      </footer>
    </main>
  );
}
