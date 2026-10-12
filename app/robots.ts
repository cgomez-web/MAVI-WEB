import type { MetadataRoute } from "next";
import { urlDelSitio } from "@/content/sitio";

export default function robots(): MetadataRoute.Robots {
  const base = urlDelSitio();
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/"] }],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
