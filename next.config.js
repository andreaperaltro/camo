/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Basic settings to make it work with Vercel
  swcMinify: true,
  trailingSlash: false,
  // We're not using static export for Vercel
  // output: 'export',
  images: {
    domains: ['localhost', 'camo-generator.vercel.app'],
    // Don't set unoptimized when deploying to Vercel
    // unoptimized: true,
  }
}

module.exports = nextConfig 