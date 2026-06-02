const nextConfig = {
  experimental: {
    proxyClientMaxBodySize: '25mb',
    serverActions: {
      bodySizeLimit: '25mb',
    },
  },
}

export default nextConfig
