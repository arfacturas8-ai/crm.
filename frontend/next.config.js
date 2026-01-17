/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_GRAPHQL_ENDPOINT: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT,
    NEXT_PUBLIC_WHATSAPP_PHONE_ID: process.env.NEXT_PUBLIC_WHATSAPP_PHONE_ID,
  },
}

module.exports = nextConfig
