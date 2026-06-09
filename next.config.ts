import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  devIndicators: false,
  experimental: {
    proxyTimeout: 60_000,
  },
}

export default nextConfig
