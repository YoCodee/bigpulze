/** @type {import('next').NextConfig} */
const nextConfig = {
  // msedge-tts uses the `ws` WebSocket library, which must stay a real Node
  // module (it depends on bufferUtil internals). Bundling it for the
  // /api/tts route handler breaks with "bufferUtil.mask is not a function".
  experimental: {
    serverComponentsExternalPackages: ['msedge-tts'],
  },
};

export default nextConfig;
