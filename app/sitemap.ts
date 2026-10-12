import type { MetadataRoute } from "next";
import { lineasDeServicio } from "@/content/servicios";
import { urlDelSitio } from "@/content/sitio";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = urlDelSitio();
  const fecha = new Date("2026-10-12");
  return [
    { url: `${base}/`, lastModified: fecha, changeFrequency: "monthly", priority: 1 },
    ...lineasDeServicio.map((l) => ({
      url: `${base}/servicios/${l.slug}`,
      lastModified: fecha,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
    { url: `${base}/nosotros`, lastModified: fecha, changeFrequency: "yearly", priority: 0.6 },
    { url: `${base}/contacto`, lastModified: fecha, changeFrequency: "yearly", priority: 0.8 },
    {
      url: `${base}/politica-de-privacidad`,
      lastModified: fecha,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];
}
