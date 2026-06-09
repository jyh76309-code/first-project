import withPWA from 'next-pwa'

const nextConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
})({
  devIndicators: false,
  experimental: {
    proxyTimeout: 60_000,
  },
})

export default nextConfig
