/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  reactStrictMode: false, // Disable to prevent duplicate API calls in development
  // React Compiler configuration (moved from experimental)
  reactCompiler: false, // Disable React Compiler for now (can be enabled later)
  // Ensure compatibility with React 19
  transpilePackages: [],
}

export default nextConfig
