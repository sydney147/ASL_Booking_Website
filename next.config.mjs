/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  experimental: {
    // firebase-admin pulls in jwks-rsa which CJS-requires jose v5 (ESM-only).
    // Marking it external prevents Next.js from bundling it, so Node's normal
    // module resolution handles the ESM interop at runtime on Vercel.
    serverComponentsExternalPackages: ['firebase-admin'],
  },
};

export default nextConfig;
