/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [
      // Add existing domains here if any
      'ui-avatars.com',
      'brandlogos.net',
      'upload.wikimedia.org',
      'encrypted-tbn0.gstatic.com',
      'www.geotechmining.com',
      // You might want to add common image hosting domains
      'amazonaws.com',
      'cloudinary.com',
      'githubusercontent.com',
      'googleusercontent.com'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'brandlogos.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'encrypted-tbn0.gstatic.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.geotechmining.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5189';
    
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/:path*`, // Proxy to Backend using env variable
      }
    ]
  }
};

module.exports = nextConfig
