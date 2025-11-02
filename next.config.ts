import type { NextConfig } from "next";
import { config } from "dotenv";
import { resolve } from "path";
import { readFileSync } from "fs";

// Manually load and parse .env.local to work around Turbopack env loading issues
const envPath = resolve(process.cwd(), ".env.local");
const envConfig = config({ path: envPath });

// Force environment variables to be set
if (envConfig.parsed) {
  Object.assign(process.env, envConfig.parsed);
}

const nextConfig: NextConfig = {
  env: {
    // Explicitly expose environment variables
    ...envConfig.parsed,
  },
};

export default nextConfig;
