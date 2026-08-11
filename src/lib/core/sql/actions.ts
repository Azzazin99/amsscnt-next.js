"use server";

import fs from "fs";
import path from "path";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { requireSystemAdmin } from "@/lib/core/permissions";

export type SqlExecutionResult = {
  success: boolean;
  message?: string;
  rows?: Record<string, unknown>[];
  fields?: string[];
  rowCount?: number;
  executionTimeMs?: number;
  error?: string;
};

export async function executeRawSql(query: string): Promise<SqlExecutionResult> {
  const user = await requireSystemAdmin();

  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return {
      success: false,
      error: "กรุณาระบุคำสั่ง SQL",
    };
  }

  const startTime = Date.now();

  // Audit Logging to Server Log File
  try {
    const logDir = path.join(process.cwd(), "logs");
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    const logPath = path.join(logDir, "sql-audit.log");
    const logEntry = `[${new Date().toISOString()}] User ID: ${user.id} (${user.username ?? "Unknown"}) Executed:\n${trimmedQuery}\n----------------------------------------\n`;
    fs.appendFileSync(logPath, logEntry, "utf-8");
  } catch (err) {
    console.error("Failed to write to sql-audit.log:", err);
  }

  try {
    const res = await db.execute(sql.raw(trimmedQuery));
    const executionTimeMs = Date.now() - startTime;

    let rows: Record<string, unknown>[] = [];
    let fields: string[] = [];
    let rowCount = 0;

    if (Array.isArray(res)) {
      rows = (res as unknown) as Record<string, unknown>[];
      rowCount = rows.length;
      if (rows.length > 0 && typeof rows[0] === "object" && rows[0] !== null) {
        fields = Object.keys(rows[0]);
      }
    } else if (res && typeof res === "object") {
      const obj = res as Record<string, unknown>;
      if ("rows" in obj && Array.isArray(obj.rows)) {
        rows = obj.rows as Record<string, unknown>[];
        rowCount = rows.length;
        if (rows.length > 0 && typeof rows[0] === "object" && rows[0] !== null) {
          fields = Object.keys(rows[0]);
        }
      } else if ("affectedRows" in obj && typeof obj.affectedRows === "number") {
        rowCount = obj.affectedRows;
      } else if ("rowCount" in obj && typeof obj.rowCount === "number") {
        rowCount = obj.rowCount;
      }
    }

    return {
      success: true,
      message: `ดำเนินการสำเร็จ (${executionTimeMs} ms)`,
      rows,
      fields,
      rowCount,
      executionTimeMs,
    };
  } catch (err: unknown) {
    const executionTimeMs = Date.now() - startTime;
    const errorMessage = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: errorMessage,
      executionTimeMs,
    };
  }
}
