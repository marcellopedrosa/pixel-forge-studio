/** @type {import('next').NextConfig} */
const isGithubPages = process.env.GITHUB_PAGES === 'true';
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
  ...(isGithubPages ? {
    basePath: '/pixel-forge-studio',
    assetPrefix: '/pixel-forge-studio/',
  } : {}),
};
export default nextConfig;
