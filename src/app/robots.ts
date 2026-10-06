import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  // The tracking pages carry a private code and the staff area is not for search engines.
  return { rules: [{ userAgent: '*', allow: ['/', '/radicar', '/transparencia'], disallow: ['/consulta/', '/funcionario'] }] };
}
