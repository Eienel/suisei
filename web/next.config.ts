import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // The MCP route imports the published package's built server, which uses
  // Node built-ins. Keep it on the Node runtime (the route sets this too).
  serverExternalPackages: ['@suisei-mcp/mcp'],
  // Brand logos are loaded as plain <img> from Simple Icons; no next/image
  // remote config needed. Kept here as a note for future use.
};

export default nextConfig;
