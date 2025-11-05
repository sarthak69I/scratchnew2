/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.ibb.co', // main CDN domain used for images
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true
  }
};

module.exports = nextConfig;
