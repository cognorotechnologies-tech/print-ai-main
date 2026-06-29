/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: {
    domains: ['res.cloudinary.com', 'via.placeholder.com', 'placehold.co'],
  },
  async rewrites() {
    return {
      // These run before checking file-system routes
      beforeFiles: [],
      // These run after checking file-system routes but before dynamic routes
      afterFiles: [
        {
          source: '/api/:path*',
          destination: 'http://localhost:4000/api/v1/:path*',
        },
      ],
      // Fallback rewrites
      fallback: [],
    };
  },
}

module.exports = nextConfig
