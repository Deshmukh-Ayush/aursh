import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/dashboard/", "/projects/"],
    },
    sitemap: "https://www.scrunity.com/sitemap.xml",
  };
}
