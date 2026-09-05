import type { NextConfig } from 'next';
const nextConfig: NextConfig = {
  output: 'export',
  assetPrefix: process.env.TOOLBOX_ASSET_PREFIX || '',
};
export default nextConfig;
