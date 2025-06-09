import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**", // allow all paths
      },
      {
        protocol: "https",
        hostname: "tutorji.s3.us-east-1.amazonaws.com",
        pathname: "/**", // allow all paths from S3 bucket
      },
    ],
  },
};

export default nextConfig;
