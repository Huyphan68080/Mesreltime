import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://mesreltime.example.com";

  return [
    {
      url: `${base}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1
    },
    {
      url: `${base}/g/general`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.8
    }
  ];
}