import Link from "next/link";
import { Fragment } from "react";
import { formatMoney } from "@/lib/budget/constants";
import type { PlanReportProjectRow } from "@/lib/plan/queries";

export type PlanReportTableMode =
  | "workgroup"
  | "strategy"
  | "allocation"
  | "owner";

function planFileHref(path: string): string | null {
  const trimmed = path.trim();
  if (!trimmed) return null;
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("/")
  ) {
    return trimmed;
  }
  return `/${trimmed.replace(/^\/+/, "")}`;
}

type PlanReportNestedTableProps = {
  rows: PlanReportProjectRow[];
  mode: PlanReportTableMode;
  viewerPersonId?: string;
};

export function PlanReportNestedTable({
  rows,
  mode,
  viewerPersonId,
}: PlanReportNestedTableProps) {
  const totalBudget = rows.reduce((sum, row) => sum + row.budgetProj, 0);
  const showSource = mode === "workgroup" || mode === "allocation";
  const showOwner = true;
  const showProjectFile = mode === "workgroup" || mode === "strategy";
  const showOwnerActions = mode === "owner";
  const isAllocation = mode === "allocation";

  const trailingCols =
    (showSource ? 1 : 0) +
    (showOwner ? 1 : 0) +
    (showProjectFile ? 1 : 0) +
    (showOwnerActions ? 3 : 0);

  return (
    <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
      <table className="w-full min-w-[880px] text-sm">
        <thead>
          <tr className="border-b bg-muted/50 text-left">
            <th className="px-3 py-3 font-medium">ที่</th>
            <th className="px-3 py-3 font-medium">รหัส</th>
            {isAllocation ? (
              <>
                <th className="px-3 py-3 font-medium">โครงการ</th>
                <th className="px-3 py-3 font-medium">กิจกรรม</th>
              </>
            ) : (
              <th className="px-3 py-3 font-medium">ชื่อโครงการ/ชื่อกิจกรรม</th>
            )}
            <th className="px-3 py-3 text-right font-medium">งบประมาณ</th>
            {showSource ? (
              <th className="px-3 py-3 font-medium">แหล่งงบประมาณ</th>
            ) : null}
            {showOwner ? (
              <th className="px-3 py-3 font-medium">
                {isAllocation ? "ผู้รับผิดชอบ" : "หัวหน้าโครงการ"}
              </th>
            ) : null}
            {showProjectFile ? (
              <th className="px-3 py-3 text-center font-medium">ไฟล์</th>
            ) : null}
            {showOwnerActions ? (
              <>
                <th className="px-3 py-3 text-center font-medium">รายงาน</th>
                <th className="px-3 py-3 text-center font-medium">ไฟล์</th>
                <th className="px-3 py-3 text-center font-medium">เขียนรายงาน</th>
              </>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const projectFile = planFileHref(row.fileDetail ?? "");
            const reportFile = planFileHref(row.evalParticular ?? "");
            const isOwner = viewerPersonId === row.ownerProj;

            return (
              <Fragment key={row.id}>
                <tr className={index % 2 === 0 ? "bg-primary/5" : "bg-primary/10"}>
                  <td className="px-3 py-2.5 text-center">{index + 1}</td>
                  <td className="px-3 py-2.5 text-center font-mono">
                    {row.codeProj}
                  </td>
                  {isAllocation ? (
                    <>
                      <td className="px-3 py-2.5" colSpan={2}>
                        {row.nameProj}
                      </td>
                    </>
                  ) : (
                    <td className="px-3 py-2.5">{row.nameProj}</td>
                  )}
                  <td className="px-3 py-2.5 text-right font-medium">
                    {formatMoney(row.budgetProj)}
                  </td>
                  {showSource ? <td className="px-3 py-2.5" /> : null}
                  {showOwner ? (
                    <td className="px-3 py-2.5">
                      {row.ownerName || row.ownerProj || "—"}
                    </td>
                  ) : null}
                  {showProjectFile ? (
                    <td className="px-3 py-2.5 text-center">
                      {projectFile ? (
                        <Link
                          href={projectFile}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          อ่าน
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                  ) : null}
                  {showOwnerActions ? (
                    <>
                      <td className="px-3 py-2.5 text-center">
                        {(row.evalResult ?? "").trim() ? (
                          <Link
                            href={`/modules/plan/reports/owner-results/${row.id}`}
                            className="text-primary hover:underline"
                          >
                            อ่าน
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">ยังไม่รายงาน</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {reportFile ? (
                          <Link
                            href={reportFile}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            อ่าน
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {isOwner ? (
                          <Link
                            href={`/modules/plan/reports/owner-results/${row.id}?edit=1`}
                            className="text-primary hover:underline"
                          >
                            เขียน
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                    </>
                  ) : null}
                </tr>
                {(row.activities ?? []).map((act) => (
                  <tr key={`${row.id}-${act.codeActi}`} className="bg-card">
                    <td className="px-3 py-2.5" />
                    <td className="px-3 py-2.5" />
                    {isAllocation ? (
                      <>
                        <td className="px-3 py-2.5" />
                        <td className="px-3 py-2.5 text-primary">
                          <span className="font-mono">{act.codeActi}</span>{" "}
                          {act.nameActi}
                        </td>
                      </>
                    ) : (
                      <td className="px-3 py-2.5">
                        <span className="font-mono">{act.codeActi}</span>{" "}
                        {act.nameActi}
                      </td>
                    )}
                    <td className="px-3 py-2.5 text-right">
                      {formatMoney(act.budgetActi)}
                    </td>
                    {showSource ? (
                      <td
                        className={
                          act.sourceLabel === "ยังไม่ได้กำหนด"
                            ? "px-3 py-2.5 text-destructive"
                            : "px-3 py-2.5"
                        }
                      >
                        {act.sourceLabel || "—"}
                      </td>
                    ) : null}
                    {showOwner ? <td className="px-3 py-2.5" /> : null}
                    {showProjectFile ? <td className="px-3 py-2.5" /> : null}
                    {showOwnerActions ? (
                      <>
                        <td className="px-3 py-2.5" />
                        <td className="px-3 py-2.5" />
                        <td className="px-3 py-2.5" />
                      </>
                    ) : null}
                  </tr>
                ))}
              </Fragment>
            );
          })}
          <tr className="border-t bg-muted/50 font-medium">
            <td className="px-3 py-2.5 text-center" colSpan={isAllocation ? 4 : 3}>
              รวม
            </td>
            <td className="px-3 py-2.5 text-right">{formatMoney(totalBudget)}</td>
            {trailingCols > 0 ? <td colSpan={trailingCols} /> : null}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
