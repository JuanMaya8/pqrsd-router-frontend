import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/site';

/** Only the public, indexable pages (never /consulta/* nor /funcionario). */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  return [
    { url: `${base}/`, changeFrequency: 'monthly', priority: 1 },
    { url: `${base}/radicar`, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/consulta`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/transparencia`, changeFrequency: 'daily', priority: 0.7 },
  ];
}
