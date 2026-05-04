import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['motion'],
  output: 'standalone',
  distDir: 'dist',
};

export default nextConfig;
