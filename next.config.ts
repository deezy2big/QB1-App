import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  serverExternalPackages: ["sharp", "@imgly/background-removal-node", "onnxruntime-node"],
};

export default nextConfig;
