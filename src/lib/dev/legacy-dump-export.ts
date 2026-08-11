import "server-only";

import { spawn } from "node:child_process";
import { Transform } from "node:stream";
import { notFound } from "next/navigation";
import { getTableName, is } from "drizzle-orm";
import { MySqlTable } from "drizzle-orm/mysql-core";
import { requireSuperAdmin } from "@/lib/core/permissions";
import * as schema from "@/lib/db/schema";
import { sanitizeLegacyDumpSql } from "@/lib/dev/legacy-dump-sanitize";

const APP_TABLE_NAMES = new Set(
  Object.values(schema)
    .filter((value) => is(value, MySqlTable))
    .map((table) => getTableName(table as MySqlTable)),
);

/** Drizzle app tables excluded from LegacyDump export. */
export function getAppTableNames(): ReadonlySet<string> {
  return APP_TABLE_NAMES;
}

export function isLegacyDumpExportEnabled(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.AMSS_ENABLE_LEGACY_DUMP_EXPORT === "1"
  );
}

export type PgConnectionParams = {
  host: string;
  port: string;
  user: string;
  password: string;
  database: string;
};

export function parsePgConnectionFromDatabaseUrl(
  connectionString: string,
): PgConnectionParams {
  const url = new URL(connectionString);
  const database = url.pathname.replace(/^\//, "");
  if (!database) {
    throw new Error("DATABASE_URL must include a database name");
  }
  return {
    host: url.hostname || "localhost",
    port: url.port || "5432",
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database,
  };
}

export function legacyDumpFilename(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `legacy-${y}-${m}-${day}.sql`;
}

let exportInProgress = false;

export function isLegacyDumpExportRunning(): boolean {
  return exportInProgress;
}

function createLineSanitizeTransform(): Transform {
  let buffer = "";
  return new Transform({
    transform(chunk, _encoding, callback) {
      buffer += chunk.toString("utf8");
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        this.push(`${sanitizeLegacyDumpSql(line)}\n`);
      }
      callback();
    },
    flush(callback) {
      if (buffer.length > 0) {
        this.push(sanitizeLegacyDumpSql(buffer));
      }
      callback();
    },
  });
}

export type LegacyDumpExportOptions = {
  pgDumpBin?: string;
  onAudit?: (message: string) => void;
};

/**
 * Spawn pg_dump excluding Drizzle app tables; stdout is sanitized line-by-line.
 */
export function streamLegacyDumpExport(
  options: LegacyDumpExportOptions = {},
): ReadableStream<Uint8Array> {
  if (exportInProgress) {
    throw new Error("Legacy dump export already in progress");
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const pg = parsePgConnectionFromDatabaseUrl(connectionString);
  const pgDumpBin = options.pgDumpBin ?? process.env.PG_DUMP_BIN ?? "pg_dump";

  const excludeArgs = [...APP_TABLE_NAMES].flatMap((table) => [
    "--exclude-table",
    table,
  ]);

  const args = [
    "--no-owner",
    "--no-acl",
    "--inserts",
    "-h",
    pg.host,
    "-p",
    pg.port,
    "-U",
    pg.user,
    "-d",
    pg.database,
    "--schema=public",
    ...excludeArgs,
  ];

  exportInProgress = true;
  options.onAudit?.(
    `[legacy-dump-export] starting pg_dump (${APP_TABLE_NAMES.size} app tables excluded)`,
  );

  const proc = spawn(pgDumpBin, args, {
    env: { ...process.env, PGPASSWORD: pg.password },
    stdio: ["ignore", "pipe", "pipe"],
  });

  const sanitize = createLineSanitizeTransform();
  proc.stdout.pipe(sanitize);

  let stderr = "";
  proc.stderr.on("data", (chunk: Buffer) => {
    stderr += chunk.toString("utf8");
  });

  return new ReadableStream<Uint8Array>({
    start(controller) {
      sanitize.on("data", (chunk: Buffer) => {
        controller.enqueue(new Uint8Array(chunk));
      });
      sanitize.on("end", () => {
        exportInProgress = false;
        controller.close();
      });
      sanitize.on("error", (err) => {
        exportInProgress = false;
        controller.error(err);
      });
      proc.on("error", (err) => {
        exportInProgress = false;
        controller.error(err);
      });
      proc.on("close", (code) => {
        if (code !== 0) {
          exportInProgress = false;
          const msg = stderr.trim() || `pg_dump exited with code ${code}`;
          controller.error(new Error(msg));
        }
      });
    },
    cancel() {
      exportInProgress = false;
      proc.kill("SIGTERM");
    },
  });
}

/** Resolve pg_dump binary path; throws if not found (for UI hints). */
export async function assertPgDumpAvailable(
  pgDumpBin = process.env.PG_DUMP_BIN ?? "pg_dump",
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const proc = spawn(pgDumpBin, ["--version"], { stdio: ["ignore", "ignore", "pipe"] });
    let err = "";
    proc.stderr.on("data", (c: Buffer) => {
      err += c.toString();
    });
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(err.trim() || `pg_dump --version failed (${code})`));
    });
  });
}

export async function requireLegacyDumpExport(): Promise<void> {
  if (!isLegacyDumpExportEnabled()) notFound();
  await requireSuperAdmin();
}

/** Count legacy tables in public schema (for UI). */
export async function countLegacyTables(): Promise<number> {
  const { listPublicTables } = await import("@/lib/dev/db-browser");
  const tables = await listPublicTables();
  return tables.filter((t) => t.kind === "legacy").length;
}
