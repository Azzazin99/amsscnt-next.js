import { and, asc, eq, isNull } from "drizzle-orm";
import { bangkokCutoffYearsAgo } from "@/lib/book/dates";
import { db } from "@/lib/db";
import { bookDocuments, bookRetentionSettings } from "@/lib/db/schema";

export type RetentionSettingRow = {
  bookType: number;
  retentionYears: number;
};

export type AgedBookRow = {
  id: number;
  bookNo: string;
  signDate: string | null;
  subject: string;
  bookType: number;
  retentionYears: number;
  ageYears: number;
};

export async function listRetentionSettings(): Promise<RetentionSettingRow[]> {
  const rows = await db
    .select({
      bookType: bookRetentionSettings.bookType,
      retentionYears: bookRetentionSettings.retentionYears,
    })
    .from(bookRetentionSettings)
    .orderBy(asc(bookRetentionSettings.bookType));

  return rows;
}

export async function getRetentionYearsMap(): Promise<Map<number, number>> {
  const rows = await listRetentionSettings();
  const map = new Map<number, number>();
  for (const row of rows) {
    map.set(row.bookType, row.retentionYears);
  }
  return map;
}

export async function listAgedBooksForReview(): Promise<AgedBookRow[]> {
  const settings = await listRetentionSettings();
  if (settings.length === 0) return [];

  const rows = await db
    .select({
      id: bookDocuments.id,
      bookNo: bookDocuments.bookNo,
      signDate: bookDocuments.signDate,
      subject: bookDocuments.subject,
      bookType: bookDocuments.bookType,
    })
    .from(bookDocuments)
    .where(isNull(bookDocuments.senderSchoolId))
    .orderBy(asc(bookDocuments.signDate));

  const defaultYears = 2;
  const result: AgedBookRow[] = [];

  for (const row of rows) {
    const retentionYears =
      settings.find((s) => s.bookType === row.bookType)?.retentionYears ??
      defaultYears;
    const cutoff = bangkokCutoffYearsAgo(retentionYears);
    if (!row.signDate || row.signDate > cutoff) continue;

    const signYear = Number(row.signDate.slice(0, 4));
    const nowYear = new Date().getFullYear() + 543;
    const ageYears = Math.max(0, nowYear - signYear);

    result.push({
      ...row,
      retentionYears,
      ageYears,
    });
  }

  return result;
}

export async function upsertRetentionSetting(
  bookType: number,
  retentionYears: number,
): Promise<void> {
  await db
    .insert(bookRetentionSettings)
    .values({ bookType, retentionYears })
    .onDuplicateKeyUpdate({
      set: { retentionYears },
    });
}
