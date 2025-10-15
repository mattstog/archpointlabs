// app/sitemap.ts
import type { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.archpointlabs.com"
  return [
    {
      url: `${base}/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    // Add other top-level pages if/when they exist:
    // { url: `${base}/about`, changeFrequency: "monthly", priority: 0.8 },
    // { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.2 },
  ]
}