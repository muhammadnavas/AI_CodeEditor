/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['monaco-editor']
  }
}

module.exports = nextConfig