/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['monaco-editor']
  },
  // Fix font loading issues
  optimizeFonts: true,
  // Fix static file serving
  trailingSlash: false,
  // Monaco Editor configuration
  webpack: (config, { isServer }) => {
    // Fix for Monaco Editor
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }
    return config;
  },
  // Fix for development server
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  }
}

module.exports = nextConfig