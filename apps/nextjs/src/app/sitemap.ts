import type { MetadataRoute } from "next";

import { env } from "~/env";

export default function sitemap(): MetadataRoute.Sitemap {
  // TODO: Replace with your production URL and add dynamic routes
  const baseUrl = env.NEXT_PUBLIC_BASE_URL;

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];
}
