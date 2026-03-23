import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/"],
      },
    ],
    // TODO: Uncomment and update with your production URL
    // sitemap: "https://example.com/sitemap.xml",
  };
}
