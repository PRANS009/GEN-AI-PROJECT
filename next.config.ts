import type { NextConfig } from "next";

const sqliteTraceFiles = [
  "./workers/*.mjs",
  "./content/*.json",
  "./node_modules/@sqlite.org/sqlite-wasm/dist/**/*",
];

const config: NextConfig = {
  poweredByHeader: false,
  outputFileTracingRoot: process.cwd(),
  turbopack: { root: process.cwd() },
  serverExternalPackages: ["@sqlite.org/sqlite-wasm"],
  outputFileTracingIncludes: {
    "/api/preview": sqliteTraceFiles,
    "/api/v1/execute": sqliteTraceFiles,
    "/api/v1/challenges/submit": sqliteTraceFiles,
    "/api/v1/lessons/check": sqliteTraceFiles,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};
export default config;
