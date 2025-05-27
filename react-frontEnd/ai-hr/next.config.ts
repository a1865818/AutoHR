import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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

export default nextConfig;
