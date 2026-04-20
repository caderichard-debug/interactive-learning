import type { NextConfig } from "next";

/**
 * GitHub project Pages serves this app under https://<owner>.github.io/<repo>/ml-visualizations/
 * Set GITHUB_PAGES_REPO_SLUG to the repo name (e.g. Digital-Products) when building for Pages.
 */
const repoSlug = process.env.GITHUB_PAGES_REPO_SLUG?.trim();
const basePath = repoSlug ? `/${repoSlug}/ml-visualizations` : "";
const isStaticExport = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  env: {
    /** Repo root index (`docs/index.html` on GitHub Pages). Sidebar “Back to home”. */
    NEXT_PUBLIC_LEARNING_HUB_HREF: repoSlug ? `/${repoSlug}/index.html` : "",
  },
  ...(basePath ? { basePath, assetPrefix: basePath } : {}),
  ...(isStaticExport
    ? {
        output: "export" as const,
        images: { unoptimized: true },
      }
    : {}),
};

export default nextConfig;
