import "server-only";

import { getTableName, is } from "drizzle-orm";
import { PgTable } from "drizzle-orm/pg-core";
import { notFound } from "next/navigation";
import { queryClient } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { requireSystemAdmin } from "@/lib/core/permissions";

export const DB_BROWSER_PAGE_SIZE = 50;
export const DB_BROWSER_MAX_PAGE_SIZE = 100;

const APP_TABLE_NAMES = new Set(
  Object.values(schema)
    .filter((value): value is PgTable => is(value, PgTable))
    .map((table) => getTableName(table)),
);

export function isDbBrowserEnabled(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.AMSS_ENABLE_DB_BROWSER === "1"
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

  const rows = await queryClient<
    { table_name: string; row_estimate: string }[]
  >`
    SELECT
      t.table_name,
      COALESCE(s.n_live_tup, 0)::text AS row_estimate
    FROM information_schema.tables t
    LEFT JOIN pg_stat_user_tables s
      ON s.schemaname = 'public' AND s.relname = t.table_name
    WHERE t.table_schema = 'public'
      AND t.table_type = 'BASE TABLE'
    ORDER BY t.table_name
  `;

  return rows
    .map((row) => ({
      name: row.table_name,
      kind: APP_TABLE_NAMES.has(row.table_name) ? ("app" as const) : ("legacy" as const),
      rowEstimate: Number(row.row_estimate ?? 0),
    }))
    .filter((row) => !needle || row.name.toLowerCase().includes(needle));
}

export async function tableExistsInPublic(name: string): Promise<boolean> {
  const safe = assertSafeTableName(name);
  const rows = await queryClient<{ exists: boolean }[]>`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = ${safe}
    ) AS exists
  `;
  return rows[0]?.exists ?? false;
}

export type DbColumnInfo = {
  name: string;
  dataType: string;
  isNullable: boolean;
};

export async function getTableColumns(table: string): Promise<DbColumnInfo[]> {
  const safe = assertSafeTableName(table);
  const rows = await queryClient<
    { column_name: string; data_type: string; is_nullable: string }[]
  >`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = ${safe}
    ORDER BY ordinal_position
  `;
  return rows.map((row) => ({
    name: row.column_name,
    dataType: row.data_type,
    isNullable: row.is_nullable === "YES",
  }));
}

export async function countTableRows(table: string): Promise<number> {
  const safe = assertSafeTableName(table);
  if (!(await tableExistsInPublic(safe))) return 0;
  const rows = await queryClient.unsafe(
    `SELECT COUNT(*)::int AS total FROM "${safe}"`,
  ) as { total: number }[];
  return Number(rows[0]?.total ?? 0);
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

  return (await queryClient.unsafe(
    `SELECT * FROM "${safe}" ORDER BY 1 LIMIT $1 OFFSET $2`,
    [pageSize, offset],
  )) as Record<string, unknown>[];
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
