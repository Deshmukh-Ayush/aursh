import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/dashboard/",
        "/projects/",
        "/onboarding",
        "/invite/",
        "/docs/",
        "/test-timeline",
      ],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
