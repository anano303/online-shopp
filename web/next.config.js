/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Enable Next.js Image Optimization
    formats: ["image/webp", "image/avif"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "via.placeholder.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
        pathname: "/**",
      },
    ],
    // Enable lazy loading by default
    loader: "default",
    // Enable blur placeholder
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Enable compression
  compress: true,
  // Enable webpack bundle analyzer in development
  webpack: (config, { dev, isServer }) => {
    // Bundle analyzer for development
    if (dev && !isServer && process.env.ANALYZE === "true") {
      config.plugins.push(
        new (require("webpack-bundle-analyzer").BundleAnalyzerPlugin)({
          analyzerMode: "server",
          openAnalyzer: false,
        }),
      );
    }
    return config;
  },
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ["@tanstack/react-query", "framer-motion"],
    turbo: {
      resolveAlias: {
        canvas: "./empty-module.js",
      },
    },
  },
  // Headers for caching
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/api/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=300, s-maxage=300",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
