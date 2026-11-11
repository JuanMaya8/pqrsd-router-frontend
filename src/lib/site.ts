/**
 * Public origin of this site, for absolute URLs (sitemap, robots). NEXT_PUBLIC_SITE_URL wins; on Vercel the production
 * domain is provided automatically (VERCEL_PROJECT_PRODUCTION_URL, without scheme); otherwise localhost.
 */
export function siteUrl(env: Record<string, string | undefined> = process.env): string {
  const explicit = env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, '');
  const vercel = env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, '').replace(/\/$/, '')}`;
  return 'http://localhost:3000';
}
