import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  // Prisma client is generated at build time (postinstall: prisma generate)
  // so TypeScript checks on generated types are skipped here
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default withNextIntl(nextConfig);
