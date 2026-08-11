/** ลำดับกลุ่มงานบนฟอร์มส่งจดหมาย — เทียบ legacy amsscnt.com */
export const MAIL_COMPOSE_WORKGROUP_LEGACY_ORDER = [
  1, 2, 4, 6, 7, 8, 10, 5, 3, 9,
] as const;

export const MAIL_RECIPIENT_CATEGORIES = [
  "all",
  "selected",
  "district_clerks",
  "workgroups",
  "school_directors",
  "school_staff",
] as const;

export type MailRecipientCategory = (typeof MAIL_RECIPIENT_CATEGORIES)[number];

export function parseMailRecipientCategory(
  value: string,
): MailRecipientCategory | null {
  const trimmed = value.trim();
  if (
    (MAIL_RECIPIENT_CATEGORIES as readonly string[]).includes(trimmed)
  ) {
    return trimmed as MailRecipientCategory;
  }
  return null;
}

export function sortWorkgroupsForMailCompose<
  T extends { legacyCode: number | null; sortOrder: number; name: string },
>(rows: T[]): T[] {
  const orderIndex = new Map(
    MAIL_COMPOSE_WORKGROUP_LEGACY_ORDER.map((code, index) => [code, index]),
  );

  return [...rows]
    .filter(
      (row) =>
        row.legacyCode != null &&
        row.legacyCode !== 0 &&
        orderIndex.has(row.legacyCode as any),
    )
    .sort((a, b) => {
      const aOrder = orderIndex.get(a.legacyCode as any) ?? 999;
      const bOrder = orderIndex.get(b.legacyCode as any) ?? 999;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "th");
    });
}
