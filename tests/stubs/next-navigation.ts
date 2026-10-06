// Stand-in for next/navigation used by unit tests (tsconfig.test.json) and by the browser harness (esbuild alias).
// In a browser, router.push records the target in window.__pushes instead of navigating.
export const usePathname = (): string => '/';
export const useRouter = () => ({
  push: (u: string) => {
    if (typeof window !== 'undefined') ((window as unknown as { __pushes?: string[] }).__pushes ??= []).push(u);
  },
  replace: (_: string) => undefined,
  refresh: () => undefined,
});
export const notFound = (): never => {
  throw new Error('NEXT_NOT_FOUND');
};
