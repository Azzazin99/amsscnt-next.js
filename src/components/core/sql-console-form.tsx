"use client";

import React, { useState, useTransition } from "react";
import { Play, AlertTriangle, CheckCircle, Terminal, Database, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { executeRawSql, type SqlExecutionResult } from "@/lib/core/sql/actions";
import { cn } from "@/lib/utils";

const SAMPLE_QUERIES = [
  { label: "ดูผู้ใช้งาน 10 คนแรก", query: "SELECT id, person_id, username, is_admin, status FROM users LIMIT 10;" },
  { label: "ดูจำนวนผู้ใช้แยกตามสถานะ", query: "SELECT status, COUNT(*) as count FROM users GROUP BY status;" },
  { label: "ค้นหาผู้ที่เป็น Admin", query: "SELECT id, username, person_id FROM users WHERE is_admin = true;" },
  { label: "ดูตารางทั้งหมด", query: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';" },
];

export function SqlConsoleForm() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<SqlExecutionResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleExecute = () => {
    if (!query.trim()) return;
    startTransition(async () => {
      const res = await executeRawSql(query);
      setResult(res);
    });
  };

  return (
    <div className="space-y-6">
      {/* Warning Box */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-900 dark:text-amber-200">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="text-sm">
          <p className="font-semibold">ข้อควรระวังเกี่ยวกับการจัดการฐานข้อมูลโดยตรง</p>
          <p className="mt-1 text-muted-foreground">
            การรันคำสั่ง SQL ในหน้านี้มีผลโดยตรงต่อฐานข้อมูลจริงทันที (รองรับ DDL & DML) กรุณาตรวจสอบคำสั่งให้ถูกต้องก่อนกด Execute ทุกครั้ง โดยระบบจะทำการบันทึกประวัติการรันลงใน Log ของ Server
          </p>
        </div>
      </div>

      {/* Preset Queries */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">ตัวอย่างคำสั่งด่วน (Sample Queries):</label>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_QUERIES.map((sample, idx) => (
            <Button
              key={idx}
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setQuery(sample.query)}
            >
              <Database className="mr-1.5 size-3.5" />
              {sample.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Query Input Area */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="sql-editor" className="flex items-center gap-1.5 text-sm font-medium">
            <Terminal className="size-4 text-primary" />
            คำสั่ง SQL (SQL Query Editor)
          </label>
          <span className="text-xs text-muted-foreground">กด Ctrl + Enter เพื่อรันคำสั่งได้</span>
        </div>
        <textarea
          id="sql-editor"
          value={query}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setQuery(e.target.value)}
          onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
              e.preventDefault();
              handleExecute();
            }
          }}
          placeholder="พิมพ์คำสั่ง SQL เช่น SELECT * FROM users LIMIT 10;"
          className="flex min-h-[160px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono shadow-inner"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          onClick={handleExecute}
          disabled={isPending || !query.trim()}
          className="min-w-[140px]"
        >
          <Play className="mr-2 size-4" />
          {isPending ? "กำลังรันคำสั่ง..." : "รันคำสั่ง (Execute)"}
        </Button>

        {query && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setQuery("")}
            className="text-xs text-muted-foreground"
          >
            ล้างคำสั่ง
          </Button>
        )}
      </div>

      {/* Execution Results */}
      {result && (
        <div className="space-y-3 pt-4 border-t">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-medium text-foreground">
              <FileText className="size-4" />
              ผลลัพธ์การทำงาน (Execution Results)
            </h3>
            {result.executionTimeMs !== undefined && (
              <span className="text-xs text-muted-foreground">
                เวลาที่ใช้: {result.executionTimeMs} ms
              </span>
            )}
          </div>

          {result.success ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 rounded-lg bg-green-500/10 p-3 text-xs font-medium text-green-700 dark:text-green-300">
                <CheckCircle className="size-4 shrink-0" />
                <span>{result.message} — ได้รับ {result.rowCount ?? 0} แถว</span>
              </div>

              {/* Data Table */}
              {result.rows && result.rows.length > 0 && result.fields && (
                <div className="overflow-x-auto rounded-xl border bg-card shadow-sm max-h-[500px]">
                  <table className="w-full text-xs font-mono">
                    <thead className="sticky top-0 bg-muted/80 backdrop-blur border-b">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground w-12">#</th>
                        {result.fields.map((field) => (
                          <th key={field} className="px-3 py-2 text-left font-medium text-foreground border-l">
                            {field}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {result.rows.map((row, rowIndex) => (
                        <tr key={rowIndex} className="hover:bg-muted/30">
                          <td className="px-3 py-2 text-muted-foreground">{rowIndex + 1}</td>
                          {result.fields!.map((field) => {
                            const val = row[field];
                            const displayed =
                              val === null || val === undefined
                                ? "NULL"
                                : typeof val === "object"
                                  ? JSON.stringify(val)
                                  : String(val);
                            return (
                              <td
                                key={field}
                                className={cn(
                                  "px-3 py-2 border-l max-w-xs truncate",
                                  val === null && "text-muted-foreground italic"
                                )}
                                title={displayed}
                              >
                                {displayed}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
              <p className="font-semibold">เกิดข้อผิดพลาดในการรัน SQL:</p>
              <pre className="mt-2 overflow-x-auto whitespace-pre-wrap font-mono text-xs">
                {result.error}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
