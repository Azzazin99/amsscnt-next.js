import { db } from "../../src/lib/db";
import { sql } from "drizzle-orm";
import { cleanLegacyText } from "../../src/lib/format/clean-text";

export type ImportMaps = {
  workgroupMap: Map<number, number>;
  schoolMap: Map<string, number>;
  userMap: Map<string, number>;
};

export function cleanText(value: unknown): string {
  return cleanLegacyText(value);
}

export async function legacyQuery<T = Record<string, unknown>>(queryStr: string): Promise<T[]> {
  const [rows] = await db.execute(sql.raw(queryStr));
  return (rows ?? []) as T[];
}

const INVALID_LEGACY_DATES = new Set(["0000-00-00", "0001-01-01"]);

/** Legacy person_detail.start_day → ISO date or null if invalid/placeholder. */
export function normalizeLegacyDate(value: unknown): string | null {
  if (value == null || value === "") return null;
  const iso = String(value).slice(0, 10);
  if (INVALID_LEGACY_DATES.has(iso)) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  return iso;
}

export async function legacyTableExists(table: string): Promise<boolean> {
  const [rows] = (await db.execute(sql`
    SELECT COUNT(*) AS count FROM information_schema.tables
    WHERE table_schema = DATABASE() AND table_name = ${table}
  `)) as unknown as [{ count: number }[], unknown];
  const list = Array.isArray(rows) ? rows : [];
  return Number(list[0]?.count ?? 0) > 0;
}

export function uniqueRefId(refId: string, msId: number, seen: Set<string>): string {
  if (!seen.has(refId)) {
    seen.add(refId);
    return refId;
  }
  const suffix = `${refId}-legacy-${msId}`;
  seen.add(suffix);
  return suffix;
}

/** Legacy permission flags may be 0/1 or workgroup codes (varchar). */
export function parseLegacyPermissionFlag(value: unknown): number {
  if (value == null || value === "") return 0;
  const n = Number(value);
  if (Number.isFinite(n)) return n > 0 ? 1 : 0;
  return 1;
}

/** Legacy yes/no fields: 0, 1, '0', '1', true/false. */
export function parseLegacyBool(value: unknown): boolean {
  if (value == null || value === "") return false;
  if (typeof value === "boolean") return value;
  const n = Number(value);
  if (Number.isFinite(n)) return n !== 0;
  return String(value).toLowerCase() === "true";
}

export function legacyPersonId(value: unknown): string | null {
  const id = String(value ?? "").trim();
  return id.length > 0 ? id : null;
}

export function normalizeLegacyTimestamp(value: unknown): Date | null {
  if (value == null || value === "") return null;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

export function legacyReal(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function leaveRequestDedupKey(input: {
  personId: string;
  leaveStart: string;
  leaveFinish: string;
  leaveType: number;
  leaveTotal: number;
  commanderGrant: number | null;
}): string {
  return [
    input.personId,
    input.leaveStart,
    input.leaveFinish,
    input.leaveType,
    input.leaveTotal,
    input.commanderGrant ?? "null",
  ].join("|");
}

export async function flushBatch<T>(
  batch: T[],
  insert: (rows: T[]) => Promise<void>,
  row: T,
  size = 250,
) {
  batch.push(row);
  if (batch.length >= size) {
    await insert(batch);
    batch.length = 0;
  }
}

export async function deriveOfficeCodeFromLegacySchools(): Promise<string> {
  const rows = ((await db.execute(sql`
    SELECT school_code FROM system_school ORDER BY school_code LIMIT 1
  `))[0] as Record<string, unknown>[]);
  const code = String(rows[0]?.school_code ?? "3501");
  return code.slice(0, 4);
}
