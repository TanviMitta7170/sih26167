/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  output: 'export',
  images: {
    unoptimized: true,
  },
  assetPrefix: '',
  transpilePackages: ['leaflet'],
};

export default nextConfig;