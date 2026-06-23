"use client";

import { RotateCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BOOKREGISTER_ACTION_COLUMN_IDS,
  isBookregisterActionColumn,
} from "@/components/bookregister/bookregister-column-sizing";
import type {
  BookregisterColumnSizing,
  BookregisterListColumn,
} from "@/components/bookregister/bookregister-list-column";
import { getBookregisterCellLayout } from "@/components/bookregister/bookregister-pinned-column-style";
import {
  BOOKREGISTER_NO_LOCKED_SIZING,
  usePersistedColumnSizing,
} from "@/hooks/use-persisted-column-sizing";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

const cellBorder = "border-r border-border/50";

const headerCell = cn(
  "relative px-2 py-3 text-center align-middle text-sm font-bold leading-snug th-word-wrap whitespace-normal break-words",
  cellBorder,
  "border-b-2 border-b-primary/25 bg-muted/60",
);

const bodyCell = cn(
  "px-2 py-2.5 align-top text-sm leading-snug break-words whitespace-normal [overflow-wrap:anywhere]",
  cellBorder,
  "border-b border-border/40",
);

const nowrapHeaderIds = new Set<string>(["year", ...BOOKREGISTER_ACTION_COLUMN_IDS]);

type ResizeSession = {
  columnId: string;
  startX: number;
  startWidth: number;
};

type BookregisterListDataTableProps<TRow extends { id: number }> = {
  rows: TRow[];
  columns: BookregisterListColumn<TRow>[];
  caption: string;
  storageKey: string;
  defaultSizing: BookregisterColumnSizing;
  lockedSizing?: BookregisterColumnSizing;
  emptyMessage?: string;
};

function columnWidth<TRow>(
  column: BookregisterListColumn<TRow>,
  sizing: BookregisterColumnSizing,
): number {
  return sizing[column.id] ?? column.defaultWidth;
}

function isResizable<TRow>(column: BookregisterListColumn<TRow>): boolean {
  return column.resizable !== false;
}

export function BookregisterListDataTable<TRow extends { id: number }>({
  rows,
  columns,
  caption,
  storageKey,
  defaultSizing,
  lockedSizing = BOOKREGISTER_NO_LOCKED_SIZING,
  emptyMessage = "ไม่พบรายการ",
}: BookregisterListDataTableProps<TRow>) {
  const { columnSizing, setColumnWidth, resetColumnSizing } =
    usePersistedColumnSizing({
      storageKey,
      defaultSizing,
      lockedSizing,
    });

  const [resizeSession, setResizeSession] = useState<ResizeSession | null>(null);

  const widthsById = useMemo(() => {
    const map: Record<string, number> = {};
    for (const column of columns) {
      map[column.id] = columnWidth(column, columnSizing);
    }
    return map;
  }, [columns, columnSizing]);

  const tableWidth = useMemo(
    () => columns.reduce((sum, column) => sum + widthsById[column.id], 0),
    [columns, widthsById],
  );

  const startResize = useCallback(
    (columnId: string, clientX: number) => {
      const column = columns.find((c) => c.id === columnId);
      if (!column || !isResizable(column)) return;
      setResizeSession({
        columnId,
        startX: clientX,
        startWidth: widthsById[columnId],
      });
    },
    [columns, widthsById],
  );

  const resizeSessionRef = useRef(resizeSession);
  resizeSessionRef.current = resizeSession;

  useEffect(() => {
    if (!resizeSession) return;

    const column = columns.find((c) => c.id === resizeSession.columnId);
    if (!column) {
      setResizeSession(null);
      return;
    }

    const minW = column.minWidth ?? 40;
    const maxW = column.maxWidth ?? 600;

    const onMove = (event: MouseEvent) => {
      const session = resizeSessionRef.current;
      if (!session) return;
      const delta = event.clientX - session.startX;
      const next = Math.min(
        maxW,
        Math.max(minW, session.startWidth + delta),
      );
      setColumnWidth(session.columnId, next);
    };

    const onUp = () => setResizeSession(null);

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, [columns, resizeSession, setColumnWidth]);

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border bg-card px-3 py-8 text-center text-sm text-muted-foreground shadow-sm">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-col items-end gap-1 sm:flex-row sm:items-center sm:justify-end">
        <p className="text-xs text-muted-foreground sm:mr-auto sm:text-left">
          ลากขอบหัวคอลัมน์เพื่อปรับความกว้าง · กดรีเซ็ตเพื่อคืนค่าเริ่มต้น
        </p>
        <button
          type="button"
          onClick={resetColumnSizing}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "min-h-10 gap-1.5 text-xs",
          )}
        >
          <RotateCcw className="size-3.5" aria-hidden />
          รีเซ็ตความกว้างคอลัมน์
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="relative overflow-x-auto overscroll-x-contain">
          <table
            className="w-max min-w-full border-separate border-spacing-0 text-sm [&_th]:box-border [&_td]:box-border"
            style={{ width: tableWidth }}
          >
            <caption className="sr-only">{caption}</caption>
            <thead lang="th">
              <tr>
                {columns.map((column) => {
                  const width = widthsById[column.id];
                  const layout = getBookregisterCellLayout(
                    column.id,
                    width,
                    columnSizing,
                    { isHeader: true },
                  );
                  const canResize = isResizable(column);

                  const isAction = isBookregisterActionColumn(column.id);

                  return (
                    <th
                      key={column.id}
                      scope="col"
                      className={cn(
                        headerCell,
                        isAction &&
                          column.id === "actionDelete" &&
                          "rounded-tr-xl border-r-0",
                        column.compact && "px-0.5",
                        (column.headerNowrap ||
                          nowrapHeaderIds.has(column.id)) &&
                          "whitespace-nowrap",
                        canResize && "group",
                        layout.className,
                      )}
                      style={layout.style}
                    >
                      {column.header}
                      {canResize ? (
                        <div
                          role="separator"
                          aria-orientation="vertical"
                          aria-label={`ปรับความกว้างคอลัมน์ ${column.id}`}
                          onMouseDown={(event) => {
                            event.preventDefault();
                            startResize(column.id, event.clientX);
                          }}
                          onTouchStart={(event) => {
                            const touch = event.touches[0];
                            if (!touch) return;
                            startResize(column.id, touch.clientX);
                          }}
                          onDoubleClick={() =>
                            setColumnWidth(column.id, column.defaultWidth)
                          }
                          className={cn(
                            "absolute top-0 right-0 h-full w-1 cursor-col-resize touch-none select-none",
                            "bg-transparent group-hover:bg-primary/30",
                            resizeSession?.columnId === column.id &&
                              "bg-primary/60",
                          )}
                        />
                      ) : null}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="[&_tr:last-child_td]:border-b-0">
              {rows.map((row, index) => (
                <tr
                  key={row.id}
                  className={cn(
                    "group transition-colors hover:bg-muted/35",
                    index % 2 === 0 ? "bg-card" : "bg-muted/15",
                  )}
                >
                  {columns.map((column) => {
                    const width = widthsById[column.id];
                    const isLastRow = index === rows.length - 1;
                    const layout = getBookregisterCellLayout(
                      column.id,
                      width,
                      columnSizing,
                      { isHeader: false, isEvenRow: index % 2 === 0 },
                    );

                    const isAction = isBookregisterActionColumn(column.id);

                    return (
                      <td
                        key={column.id}
                        className={cn(
                          bodyCell,
                          isAction &&
                            column.id === "actionDelete" &&
                            "border-r-0",
                          isAction &&
                            column.id === "actionDelete" &&
                            isLastRow &&
                            "rounded-br-xl",
                          column.compact && "px-0.5",
                          column.alignCenter && "text-center",
                          layout.className,
                        )}
                        style={layout.style}
                      >
                        {column.render(row)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
