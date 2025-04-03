/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Add rewrites to redirect /output requests to /public/output
  async rewrites() {
    return [
      {
        source: '/output/:path*',
        destination: '/public/output/:path*',
      },
    ];
  },
}

module.exports = nextConfig 