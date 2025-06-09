/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [
      // Add existing domains here if any
      'ui-avatars.com',
      // You might want to add common image hosting domains
      'amazonaws.com',
      'cloudinary.com',
      'githubusercontent.com',
      'googleusercontent.com'
    ],
  },
}

module.exports = nextConfig
