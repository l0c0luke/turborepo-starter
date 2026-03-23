import type { Metadata } from "next";

interface CreateMetadataOptions {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  siteName?: string;
}

const defaultMeta = {
  title: "Example App",
  description: "A starter template for your next project",
  siteName: "Example App",
};

export function createMetadata({
  title,
  description,
  image,
  url,
  siteName,
}: CreateMetadataOptions = {}): Metadata {
  const resolvedTitle = title ?? defaultMeta.title;
  const resolvedDescription = description ?? defaultMeta.description;
  const resolvedSiteName = siteName ?? defaultMeta.siteName;

  const metadata: Metadata = {
    title: resolvedTitle,
    description: resolvedDescription,
    openGraph: {
      title: resolvedTitle,
      description: resolvedDescription,
      siteName: resolvedSiteName,
      type: "website",
      ...(url && { url }),
      ...(image && {
        images: [{ url: image, width: 1200, height: 630, alt: resolvedTitle }],
      }),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: resolvedTitle,
      description: resolvedDescription,
      ...(image && { images: [image] }),
    },
  };

  return metadata;
}
