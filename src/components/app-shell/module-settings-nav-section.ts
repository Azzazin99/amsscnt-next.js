import type { ModuleNavLinkDef, ModuleNavSectionDef } from "@/components/app-shell/module-nav";
import type { ModuleSettingsNavMode } from "@/lib/core/permissions";

function isPermissionsHref(href: string | undefined): boolean {
  if (!href) return false;
  const path = href.split("?")[0]?.replace(/\/$/, "") ?? href;
  return path.endsWith("/permissions");
}

function isLinkVisibleForMode(
  link: ModuleNavLinkDef,
  mode: ModuleSettingsNavMode,
): boolean {
  if (mode === "none") return false;
  if (mode === "full") return link.visible !== false;

  if (link.children && link.children.length > 0) {
    return link.children.some((child) => isLinkVisibleForMode(child, mode));
  }
  if (link.href) return isPermissionsHref(link.href);
  return false;
}

function filterLinksForMode(
  links: ModuleNavLinkDef[],
  mode: ModuleSettingsNavMode,
): ModuleNavLinkDef[] {
  return links
    .filter((link) => isLinkVisibleForMode(link, mode))
    .map((link) => {
      if (!link.children?.length) return link;
      const children = filterLinksForMode(link.children, mode);
      if (children.length === 0) return { ...link, children: undefined };
      return { ...link, children };
    });
}

/** L3 «ตั้งค่าระบบ» — full = smss admin, permissions = module admin เห็นแค่ /permissions */
export function buildModuleSettingsNavSection(
  mode: ModuleSettingsNavMode,
  links: ModuleNavLinkDef[],
): ModuleNavSectionDef | null {
  if (mode === "none") return null;

  const filtered = filterLinksForMode(links, mode);
  if (filtered.length === 0) return null;

  return {
    title: "ตั้งค่าระบบ",
    links: filtered,
  };
}
