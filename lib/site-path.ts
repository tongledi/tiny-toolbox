/** Keep local/root hosting and a GitHub Pages project URL on the same source. */
export function sitePath(path: string): string {
  const prefix = process.env.NEXT_PUBLIC_SITE_BASE_PATH || '';
  return `${prefix}${path}`;
}
