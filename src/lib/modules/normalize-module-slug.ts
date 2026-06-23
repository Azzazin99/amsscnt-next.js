/** Legacy system_module uses `la`; app routes and permissions use `leave`. */
export function normalizeModuleSlug(slug: string): string {
  return slug === "la" ? "leave" : slug;
}
