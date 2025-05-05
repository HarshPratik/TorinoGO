
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // No longer needed for picsum.photos
  // images: {
  //   remotePatterns: [
  //     {
  //       protocol: 'https',
  //       hostname: 'picsum.photos',
  //       port: '',
  //       pathname: '/**',
  //     },
  //   ],
  // },
};

export default nextConfig;
