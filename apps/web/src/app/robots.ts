import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/c/"]
    },
    sitemap: "https://mesreltime.example.com/sitemap.xml"
  };
}