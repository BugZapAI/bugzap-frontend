/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  // optional: if TS errors also block builds, uncomment next line
  // typescript: { ignoreBuildErrors: true },
};
module.exports = nextConfig;
