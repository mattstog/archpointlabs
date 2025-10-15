// app/robots.ts
import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://www.archpointlabs.com/sitemap.xml",
    host: "https://www.archpointlabs.com",
  }
}