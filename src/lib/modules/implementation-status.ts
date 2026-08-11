import { normalizeModuleSlug } from "@/lib/modules/normalize-module-slug";

/**
 * สถานะการพัฒนาเมนู (ระดับ route บน /home และ nav)
 * การ approve ของผู้ใช้ = ระดับโมดูล (slug) ใน context.html §10 + docs/TESTING-MODULES.md
 */
export type ImplementationStatus = "ready" | "in_progress" | "planned";

export const STATUS_LABELS: Record<ImplementationStatus, string> = {
  ready: "ใช้งานได้",
  in_progress: "กำลังพัฒนา",
  planned: "เร็วๆ นี้",
};

/** เมนูคู่มือในโมดูล (`/modules/{slug}/manual`) — จัดทำหลังพัฒนาโมดูลครบ */
export const MODULE_MANUAL_STATUS: ImplementationStatus = "planned";
export const MODULE_MANUAL_STATUS_LABEL = "ยังไม่สมบูรณ์";

const MODULE_MANUAL_ROUTE = /^\/modules\/[^/]+\/manual$/;

export function isModuleManualRoute(href: string): boolean {
  const normalized = href.split("?")[0]?.replace(/\/$/, "") || href;
  return MODULE_MANUAL_ROUTE.test(normalized);
}

/** โมดูลระดับบน (slug จาก DB) */
const MODULE_STATUS: Record<string, ImplementationStatus> = {
  bookregister: "ready",
  person: "ready",
  book: "ready",
  bookobec: "in_progress",
  idocument: "in_progress",
  questionnaire: "in_progress",
  alert: "in_progress",
  dltv: "planned",
  bets: "planned",
  leave: "in_progress",
  mail: "ready",
  meeting: "in_progress",
  permission: "in_progress",
  car: "in_progress",
  affair: "in_progress",
  cabinet: "in_progress",
  news: "in_progress",
  plan: "in_progress",
  budget: "in_progress",
  achievement: "in_progress",
  student_main: "in_progress",
  spacial_student: "in_progress",
};

const DEFAULT_MODULE_STATUS: ImplementationStatus = "planned";

/**
 * เส้นทางย่อย — เรียงจากยาวไปสั้นเพื่อจับ prefix ที่เฉพาะที่สุดก่อน
 */
const ROUTE_STATUS: { prefix: string; status: ImplementationStatus }[] = [
  { prefix: "/api/book", status: "ready" },
  { prefix: "/modules/book/groups", status: "ready" }, // P062
  { prefix: "/modules/book/new", status: "ready" }, // P061
  { prefix: "/modules/book/inbox/overdue", status: "ready" },
  { prefix: "/modules/book/inbox/aged", status: "ready" },
  { prefix: "/modules/book/retention", status: "ready" },
  { prefix: "/modules/book/inbox", status: "ready" }, // P060
  { prefix: "/modules/book/sent", status: "ready" }, // P060
  { prefix: "/modules/book", status: "ready" },
  { prefix: "/modules/bookobec/manual", status: "in_progress" },
  { prefix: "/modules/bookobec/sent", status: "in_progress" },
  { prefix: "/modules/bookobec/inbox", status: "in_progress" },
  { prefix: "/modules/bookobec", status: "in_progress" },
  { prefix: "/modules/idocument/inbox", status: "in_progress" },
  { prefix: "/modules/idocument/reports", status: "in_progress" },
  { prefix: "/modules/idocument/new", status: "in_progress" },
  { prefix: "/modules/idocument", status: "in_progress" },
  { prefix: "/modules/questionnaire", status: "in_progress" },
  { prefix: "/modules/alert", status: "in_progress" },
  { prefix: "/api/person/export", status: "ready" }, // P052 CSV
  { prefix: "/modules/person/settings/sys-admin", status: "ready" },
  { prefix: "/modules/person/settings/district-positions", status: "ready" },
  { prefix: "/modules/person/settings/school-positions", status: "ready" },
  { prefix: "/modules/person/settings/import-district-text", status: "ready" },
  { prefix: "/modules/person/settings/import-school-text", status: "ready" },
  { prefix: "/modules/person/settings/import-birthdate-text", status: "ready" },
  { prefix: "/modules/person/settings/district-signatures", status: "ready" },
  { prefix: "/modules/person/permissions", status: "ready" }, // P052
  { prefix: "/modules/person/staff", status: "ready" }, // P050–P051
  { prefix: "/modules/person", status: "ready" },
  { prefix: "/admin/sql-console", status: "ready" },
  { prefix: "/admin/permissions", status: "ready" }, // P019
  { prefix: "/admin/users", status: "ready" }, // P018
  { prefix: "/admin/module-admins", status: "ready" }, // P017
  { prefix: "/admin/modules", status: "ready" }, // P016
  { prefix: "/admin/workgroups", status: "ready" }, // P015
  { prefix: "/admin/school-groups", status: "ready" }, // P014
  { prefix: "/admin/schools", status: "ready" }, // P013
  { prefix: "/admin/district-settings", status: "ready" }, // P012
  { prefix: "/admin", status: "ready" },
  { prefix: "/modules/bookregister/years", status: "ready" },
  { prefix: "/modules/bookregister/permissions", status: "ready" },
  { prefix: "/modules/bookregister/receive", status: "ready" }, // P032–P034 done
  { prefix: "/modules/bookregister/send", status: "ready" }, // P035–P037 list/ฟอร์ม/แนบ
  { prefix: "/modules/bookregister/office-no", status: "ready" },
  { prefix: "/modules/bookregister/command", status: "ready" }, // P038 list/ฟอร์ม/แนบ
  { prefix: "/modules/bookregister/certificate", status: "ready" }, // P039 list/ฟอร์ม
  { prefix: "/modules/bookregister/reports", status: "ready" }, // 1.8–1.9 แบบพิมพ์/รายงาน
  { prefix: "/api/bookregister/export", status: "ready" }, // P041 CSV
  { prefix: "/modules/bookregister", status: "ready" },
  { prefix: "/modules/leave/permissions", status: "in_progress" },
  { prefix: "/modules/leave/years", status: "in_progress" },
  { prefix: "/modules/leave/grant-persons", status: "in_progress" },
  { prefix: "/modules/leave/school-grant-persons", status: "in_progress" },
  { prefix: "/modules/leave/collection", status: "in_progress" },
  { prefix: "/modules/leave/reports", status: "in_progress" },
  { prefix: "/modules/leave/approvals/group2", status: "in_progress" },
  { prefix: "/modules/leave/approvals", status: "in_progress" },
  { prefix: "/modules/leave/job-handover", status: "in_progress" },
  { prefix: "/modules/leave/cancellations/approvals", status: "in_progress" },
  { prefix: "/modules/leave/cancellations/new", status: "in_progress" },
  { prefix: "/modules/leave/cancellations", status: "in_progress" },
  { prefix: "/modules/leave/requests/new", status: "in_progress" },
  { prefix: "/modules/leave/requests", status: "in_progress" },
  { prefix: "/modules/leave", status: "in_progress" },
  { prefix: "/modules/permission/permissions", status: "ready" },
  { prefix: "/modules/permission/years", status: "ready" },
  { prefix: "/modules/permission/requests/new", status: "ready" },
  { prefix: "/modules/permission/requests", status: "ready" },
  { prefix: "/modules/permission", status: "ready" },
  { prefix: "/api/mail", status: "ready" },
  { prefix: "/modules/mail/permissions", status: "ready" },
  { prefix: "/modules/mail/groups", status: "ready" },
  { prefix: "/modules/mail/new", status: "ready" },
  { prefix: "/modules/mail/sent", status: "ready" },
  { prefix: "/modules/mail/inbox", status: "ready" },
  { prefix: "/modules/mail", status: "ready" },
  { prefix: "/modules/meeting/permissions", status: "ready" },
  { prefix: "/modules/meeting/rooms", status: "ready" },
  { prefix: "/modules/meeting/calendar", status: "ready" },
  { prefix: "/modules/meeting/bookings/new", status: "ready" },
  { prefix: "/modules/meeting/bookings", status: "ready" },
  { prefix: "/modules/meeting", status: "ready" },
  { prefix: "/modules/car/permissions", status: "ready" },
  { prefix: "/modules/car/types", status: "ready" },
  { prefix: "/modules/car/drivers", status: "ready" },
  { prefix: "/modules/car/vehicles", status: "ready" },
  { prefix: "/modules/car/requests/new", status: "ready" },
  { prefix: "/modules/car/requests", status: "ready" },
  { prefix: "/modules/car", status: "ready" },
  { prefix: "/api/cabinet", status: "ready" },
  { prefix: "/modules/cabinet/permissions", status: "ready" },
  { prefix: "/modules/cabinet/upload", status: "ready" },
  { prefix: "/modules/cabinet", status: "ready" },
  { prefix: "/api/news", status: "ready" },
  { prefix: "/modules/news/permissions", status: "ready" },
  { prefix: "/modules/news/mainitems", status: "ready" },
  { prefix: "/modules/news/sections", status: "ready" },
  { prefix: "/modules/news/new", status: "ready" },
  { prefix: "/modules/news", status: "ready" },
  { prefix: "/modules/affair/permissions", status: "ready" },
  { prefix: "/modules/affair/new", status: "ready" },
  { prefix: "/modules/affair", status: "ready" },
  { prefix: "/modules/plan/years", status: "ready" },
  { prefix: "/modules/plan/projects/new", status: "ready" },
  { prefix: "/modules/plan/projects", status: "ready" },
  { prefix: "/modules/plan/activities/new", status: "ready" },
  { prefix: "/modules/plan/activities", status: "ready" },
  { prefix: "/modules/plan", status: "ready" },
  { prefix: "/modules/budget/years", status: "ready" },
  { prefix: "/modules/budget/receive/new", status: "ready" },
  { prefix: "/modules/budget/receive", status: "ready" },
  { prefix: "/modules/budget/disburse/new", status: "ready" },
  { prefix: "/modules/budget/disburse", status: "ready" },
  { prefix: "/modules/budget", status: "ready" },
  { prefix: "/modules/achievement/permissions", status: "ready" },
  { prefix: "/modules/achievement/scores/new", status: "ready" },
  { prefix: "/modules/achievement/scores", status: "ready" },
  { prefix: "/modules/achievement", status: "ready" },
  { prefix: "/modules/student_main/permissions", status: "ready" },
  { prefix: "/modules/student_main/years", status: "ready" },
  { prefix: "/modules/student_main/students/new", status: "ready" },
  { prefix: "/modules/student_main/students", status: "ready" },
  { prefix: "/modules/student_main", status: "ready" },
  { prefix: "/modules/spacial_student/permissions", status: "ready" },
  { prefix: "/modules/spacial_student/students/new", status: "ready" },
  { prefix: "/modules/spacial_student/students", status: "ready" },
  { prefix: "/modules/spacial_student", status: "ready" },
];

export function getModuleStatus(slug: string): ImplementationStatus {
  return MODULE_STATUS[normalizeModuleSlug(slug)] ?? DEFAULT_MODULE_STATUS;
}

export function getRouteStatus(href: string): ImplementationStatus {
  const normalized = href.split("?")[0]?.replace(/\/$/, "") || href;
  if (isModuleManualRoute(normalized)) {
    return MODULE_MANUAL_STATUS;
  }
  for (const { prefix, status } of ROUTE_STATUS) {
    const p = prefix.replace(/\/$/, "");
    if (normalized === p || normalized.startsWith(`${p}/`)) {
      return status;
    }
  }
  return DEFAULT_MODULE_STATUS;
}

export function isNavigable(status: ImplementationStatus): boolean {
  return status === "ready" || status === "in_progress";
}

/** คู่มือโมดูลเปิดได้เสมอ (placeholder) แม้สถานะ planned */
export function isRouteNavigable(
  href: string,
  status: ImplementationStatus,
): boolean {
  if (isModuleManualRoute(href)) return true;
  return isNavigable(status);
}
