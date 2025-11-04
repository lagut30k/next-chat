import type { NextConfig } from 'next';
import { join } from 'path';

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {
    root: join(__dirname, '../..'),
  },
  webpack: (config) => {
    config.watchOptions = {
      poll: 100,
      aggregateTimeout: 300,
    };
    return config;
  },
  // watchOptions: {
  //   pollIntervalMs: 5000,
  // },
};

export default nextConfig;
