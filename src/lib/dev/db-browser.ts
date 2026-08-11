import "server-only";

import { getTableName, is, sql } from "drizzle-orm";
import { MySqlTable } from "drizzle-orm/mysql-core";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { requireSystemAdmin } from "@/lib/core/permissions";

export const DB_BROWSER_PAGE_SIZE = 50;
export const DB_BROWSER_MAX_PAGE_SIZE = 100;

const APP_TABLE_NAMES = new Set(
  Object.values(schema)
    .filter((value) => is(value, MySqlTable))
    .map((table) => getTableName(table as MySqlTable)),
);

export function isDbBrowserEnabled(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.AMSS_ENABLE_DB_BROWSER === "1"
  );
}

export function isDevToolsNavEnabled(): boolean {
  return isDbBrowserEnabled() || isLegacyDumpExportEnabled();
}

function isLegacyDumpExportEnabled(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.AMSS_ENABLE_LEGACY_DUMP_EXPORT === "1"
  );
}

export async function requireDevDbBrowser(): Promise<void> {
  if (!isDbBrowserEnabled()) notFound();
  await requireSystemAdmin();
}

export function assertSafeTableName(name: string): string {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
    throw new Error("Invalid table name");
  }
  return name;
}

export type DbTableSummary = {
  name: string;
  kind: "app" | "legacy";
  rowEstimate: number;
};

export async function listPublicTables(q?: string): Promise<DbTableSummary[]> {
  const needle = (q ?? "").trim().toLowerCase();

  const [rows] = (await db.execute(sql`
    SELECT
      table_name AS table_name,
      table_rows AS row_estimate
    FROM information_schema.tables
    WHERE table_schema = DATABASE()
      AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `)) as unknown as [{ table_name?: string; TABLE_NAME?: string; row_estimate?: number; TABLE_ROWS?: number }[], unknown];

  const tableList = Array.isArray(rows) ? rows : [];

  return tableList
    .map((row) => {
      const tableName = row.table_name ?? row.TABLE_NAME ?? "";
      const rowEstimate = Number(row.row_estimate ?? row.TABLE_ROWS ?? 0);
      return {
        name: tableName,
        kind: APP_TABLE_NAMES.has(tableName) ? ("app" as const) : ("legacy" as const),
        rowEstimate,
      };
    })
    .filter((row: DbTableSummary) => !needle || row.name.toLowerCase().includes(needle));
}

export async function tableExistsInPublic(name: string): Promise<boolean> {
  const safe = assertSafeTableName(name);
  const [rows] = (await db.execute(sql`
    SELECT COUNT(*) AS count FROM information_schema.tables
    WHERE table_schema = DATABASE()
      AND table_name = ${safe}
  `)) as unknown as [{ count?: number; COUNT?: number }[], unknown];

  const list = Array.isArray(rows) ? rows : [];
  const countVal = list[0]?.count ?? list[0]?.COUNT ?? 0;
  return Number(countVal) > 0;
}

export type DbColumnInfo = {
  name: string;
  dataType: string;
  isNullable: boolean;
};

export async function getTableColumns(table: string): Promise<DbColumnInfo[]> {
  const safe = assertSafeTableName(table);
  const [rows] = (await db.execute(sql`
    SELECT
      COLUMN_NAME AS column_name,
      DATA_TYPE AS data_type,
      IS_NULLABLE AS is_nullable
    FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = ${safe}
    ORDER BY ordinal_position
  `)) as unknown as [Record<string, unknown>[], unknown];

  const list = Array.isArray(rows) ? rows : [];

  return list.map((row) => {
    const name = String(row.column_name ?? row.COLUMN_NAME ?? "");
    const dataType = String(row.data_type ?? row.DATA_TYPE ?? "");
    const isNullableStr = String(row.is_nullable ?? row.IS_NULLABLE ?? "");
    return {
      name,
      dataType,
      isNullable: isNullableStr.toUpperCase() === "YES",
    };
  });
}

export async function countTableRows(table: string): Promise<number> {
  const safe = assertSafeTableName(table);
  if (!(await tableExistsInPublic(safe))) return 0;
  const [rows] = (await db.execute(sql.raw(`SELECT COUNT(*) AS total FROM \`${safe}\``))) as unknown as [Record<string, unknown>[], unknown];
  const list = Array.isArray(rows) ? rows : [];
  const totalVal = list[0]?.total ?? list[0]?.TOTAL ?? Object.values(list[0] ?? {})[0] ?? 0;
  return Number(totalVal);
}

export function clampPageSize(size?: number): number {
  const n = Number(size) || DB_BROWSER_PAGE_SIZE;
  return Math.min(Math.max(1, n), DB_BROWSER_MAX_PAGE_SIZE);
}

export async function fetchTablePage(
  table: string,
  input: { page: number; pageSize?: number },
): Promise<Record<string, unknown>[]> {
  const safe = assertSafeTableName(table);
  if (!(await tableExistsInPublic(safe))) return [];

  const pageSize = clampPageSize(input.pageSize);
  const page = Math.max(1, input.page);
  const offset = (page - 1) * pageSize;

  const [rows] = (await db.execute(sql.raw(
    `SELECT * FROM \`${safe}\` LIMIT ${Number(pageSize)} OFFSET ${Number(offset)}`,
  ))) as unknown as [Record<string, unknown>[], unknown];

  return Array.isArray(rows) ? rows : [];
}

export function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function resolveDbBrowserPage(total: number, page: number, pageSize: number): number {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return Math.min(Math.max(1, page), totalPages);
}
