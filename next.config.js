/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'camo-generator.vercel.app'],
    unoptimized: true,
  }
}

module.exports = nextConfig 