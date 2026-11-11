import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  // The tracking pages carry a private code and the staff area is not for search engines.
  return { rules: [{ userAgent: '*', allow: ['/', '/radicar', '/transparencia'], disallow: ['/consulta/', '/funcionario'] }] };
}
