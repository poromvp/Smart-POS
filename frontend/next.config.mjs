/** @type {import('next').NextConfig} */
const GATEWAY_URL = process.env.API_GATEWAY_URL || "http://localhost:8088";

const nextConfig = {
  allowedDevOrigins: ["192.168.10.147"],
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8088",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8082",
        pathname: "/**",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/auth/:path*",
        destination: `${GATEWAY_URL}/api/auth/:path*`,
      },
      {
        source: "/api/users/:path*",
        destination: `${GATEWAY_URL}/api/users/:path*`,
      },
      {
        source: "/api/roles/:path*",
        destination: `${GATEWAY_URL}/api/roles/:path*`,
      },
      {
        source: "/api/permissions/:path*",
        destination: `${GATEWAY_URL}/api/permissions/:path*`,
      },
      {
        source: "/api/catalog/:path*",
        destination: `${GATEWAY_URL}/api/catalog/:path*`,
      },
      {
        source: "/api/sales/:path*",
        destination: `${GATEWAY_URL}/api/sales/:path*`,
      },
      {
        source: "/api/customers/:path*",
        destination: `${GATEWAY_URL}/api/customers/:path*`,
      },
      {
        source: "/api/promotions/:path*",
        destination: `${GATEWAY_URL}/api/promotions/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${GATEWAY_URL}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
