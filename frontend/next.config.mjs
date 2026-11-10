/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["192.168.10.147"],
  images: {
    remotePatterns: [
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
        destination: "http://localhost:8081/api/auth/:path*",
      },
      {
        source: "/api/users/:path*",
        destination: "http://localhost:8081/api/users/:path*",
      },
      {
        source: "/api/roles/:path*",
        destination: "http://localhost:8081/api/roles/:path*",
      },
      {
        source: "/api/permissions/:path*",
        destination: "http://localhost:8081/api/permissions/:path*",
      },
      {
        source: "/api/catalog/:path*",
        destination: "http://localhost:8082/api/:path*",
      },
      {
        source: "/api/sales/:path*",
        destination: "http://localhost:8083/api/:path*",
      },
      {
        source: "/api/customers/:path*",
        destination: "http://localhost:8083/api/customers/:path*",
      },
      {
        source: "/api/promotions/:path*",
        destination: "http://localhost:8083/api/promotions/:path*",
      },
      {
        source: "/uploads/:path*",
        destination: "http://localhost:8082/uploads/:path*",
      },
    ];
  },
};

export default nextConfig;
