"use server";

import { insertAndGetId } from "../db/helpers";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  PLAN_PROJECT_KIND,
  planActivities,
  planProjects,
} from "@/lib/db/schema";
import {
  buildPlanProjectStoredFileName,
  deletePlanProjectFile,
  isAllowedPlanProjectFileName,
  savePlanProjectFile,
} from "@/lib/plan/files";
import { getActivePlanYear, getPlanProject } from "@/lib/plan/queries";
import { requirePlanEditAccess } from "@/lib/plan/scope";

const ATTACHMENTS_PATH = "/modules/plan/attachments";

export async function uploadPlanProjectAttachment(formData: FormData) {
  const { user } = await requirePlanEditAccess();
  const projectId = Number(formData.get("projectId"));
  const file = formData.get("file");

  if (!projectId || !(file instanceof File) || file.size === 0) {
    return { ok: false as const, message: "กรุณาเลือกไฟล์" };
  }
  if (!isAllowedPlanProjectFileName(file.name)) {
    return { ok: false as const, message: "ชนิดไฟล์ไม่รองรับ" };
  }

  const project = await getPlanProject(projectId);
  if (!project || project.budgetYear !== (await getActivePlanYear())?.budgetYear) {
    return { ok: false as const, message: "ไม่พบโครงการ" };
  }

  const stored = buildPlanProjectStoredFileName(
    project.budgetYear,
    project.codeProj,
    file.name,
  );

  if (project.fileDetail) {
    try {
      await deletePlanProjectFile(project.fileDetail);
    } catch {
      /* ignore missing old file */
    }
  }

  await savePlanProjectFile(stored, file);
  await db
    .update(planProjects)
    .set({ fileDetail: stored, dayrec: new Date() })
    .where(eq(planProjects.id, projectId));

  revalidatePath(ATTACHMENTS_PATH);
  return { ok: true as const, message: "แนบไฟล์สำเร็จ" };
}

export type SmssPlanPreviewItem = {
  codeProj: string;
  nameProj: string;
  budgetProj: number;
  owner: string;
  beginDate: string;
  finishDate: string;
  activities: {
    codeActi: string;
    nameActi: string;
    budgetActi: number;
    beginDate: string;
    finishDate: string;
  }[];
};

function decodeB64(value: string | null | undefined) {
  if (!value) return "";
  try {
    return Buffer.from(value, "base64").toString("utf8");
  } catch {
    return value;
  }
}

export async function fetchSmssPlanPreview(
  officeCode: number,
): Promise<
  | { ok: true; items: SmssPlanPreviewItem[]; schoolName: string; budgetYear: number }
  | { ok: false; message: string }
> {
  await requirePlanEditAccess();
  const { getSmssSchoolSync } = await import("@/lib/plan/queries");
  const sync = await getSmssSchoolSync(String(officeCode));
  if (!sync?.smssUrl || !sync.syncCode) {
    return { ok: false, message: "ยังไม่ได้ตั้งค่าเชื่อม SMSS สำหรับโรงเรียนนี้" };
  }

  const active = await getActivePlanYear();
  if (!active) {
    return { ok: false, message: "ยังไม่ได้กำหนดปีงบประมาณ" };
  }

  const requester = process.env.AMSS_REQUESTER_SERVER_ID ?? "1";
  const url = `${sync.smssUrl.replace(/\/$/, "")}/export/xml.php?username=amssplus&password=${encodeURIComponent(sync.syncCode)}&requester_server_id=${requester}&order=plan`;

  let xml: string;
  try {
    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) throw new Error("fetch failed");
    xml = await res.text();
  } catch {
    return { ok: false, message: "เชื่อม SMSS ไม่สำเร็จ — ลองเปิดจากเครือข่ายที่เข้าถึง SMSS ได้" };
  }

  const items: SmssPlanPreviewItem[] = [];
  const projectBlocks = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
  for (const block of projectBlocks) {
    const codeProj = decodeB64(block.match(/<code_proj>([^<]*)<\/code_proj>/)?.[1]);
    const nameProj = decodeB64(block.match(/<name_proj>([^<]*)<\/name_proj>/)?.[1]);
    if (!codeProj || !nameProj) continue;

    const activities: SmssPlanPreviewItem["activities"] = [];
    const actBlocks = block.match(/<item2>[\s\S]*?<\/item2>/g) ?? [];
    for (const ab of actBlocks) {
      activities.push({
        codeActi: decodeB64(ab.match(/<code_acti>([^<]*)<\/code_acti>/)?.[1]),
        nameActi: decodeB64(ab.match(/<name_acti>([^<]*)<\/name_acti>/)?.[1]),
        budgetActi: Number(decodeB64(ab.match(/<budget_acti>([^<]*)<\/budget_acti>/)?.[1]) || 0),
        beginDate: decodeB64(ab.match(/<time_acti>([^<]*)<\/time_acti>/)?.[1]) || active.budgetYear + "-10-01",
        finishDate: decodeB64(ab.match(/<time_acti>([^<]*)<\/time_acti>/)?.[1]) || active.budgetYear + "-09-30",
      });
    }

    items.push({
      codeProj: codeProj.padStart(3, "0").slice(-3),
      nameProj,
      budgetProj: Number(decodeB64(block.match(/<budget_proj_plan2>([^<]*)<\/budget_proj_plan2>/)?.[1]) || 0),
      owner: decodeB64(block.match(/<owner>([^<]*)<\/owner>/)?.[1]),
      beginDate: decodeB64(block.match(/<proj_time>([^<]*)<\/proj_time>/)?.[1]) || `${active.budgetYear - 1}-10-01`,
      finishDate: decodeB64(block.match(/<proj_time>([^<]*)<\/proj_time>/)?.[1]) || `${active.budgetYear}-09-30`,
      activities,
    });
  }

  return {
    ok: true,
    items,
    schoolName: `รหัส ${officeCode}`,
    budgetYear: active.budgetYear,
  };
}

export async function importSmssPlanPreview(
  items: SmssPlanPreviewItem[],
  defaultCodeClus: number,
) {
  const { user } = await requirePlanEditAccess();
  const active = await getActivePlanYear();
  if (!active) {
    return { ok: false as const, message: "ยังไม่ได้กำหนดปีงบประมาณ" };
  }

  let imported = 0;
  for (const item of items) {
    try {
      const [res_proj] = await db
        .insert(planProjects)
        .ignore()
        .values({
          budgetYear: active.budgetYear,
          codeClus: defaultCodeClus,
          codeTegy: "1",
          codeProj: item.codeProj,
          nameProj: item.nameProj.slice(0, 100),
          budgetProj: item.budgetProj,
          ownerProj: item.owner.slice(0, 13) || user.personId,
          beginDate: item.beginDate.slice(0, 10),
          finishDate: item.finishDate.slice(0, 10),
        });
      const proj = { id: res_proj.insertId };

      if (!proj) continue;

      for (const act of item.activities) {
        await db
          .insert(planActivities)
          .ignore()
          .values({
            budgetYear: active.budgetYear,
            codeClus: defaultCodeClus,
            codeProj: item.codeProj,
            codeActi: act.codeActi.padStart(6, "0").slice(-6),
            nameActi: act.nameActi.slice(0, 100),
            budgetActi: act.budgetActi,
            ownerActi: item.owner.slice(0, 13) || user.personId,
            beginDate: act.beginDate.slice(0, 10),
            finishDate: act.finishDate.slice(0, 10),
          });
      }
      imported += 1;
    } catch {
      /* skip bad rows */
    }
  }

  revalidatePath("/modules/plan/projects");
  revalidatePath("/modules/plan/smss-import");
  return {
    ok: true as const,
    message: `นำเข้า ${imported} โครงการจาก SMSS`,
  };
}
