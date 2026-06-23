import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { menuGroups, modules } from "@/lib/db/schema";
import {
  canAccessModule,
  isFirstTimeLogin,
} from "@/lib/modules/menu-access";
import { normalizeModuleSlug } from "@/lib/modules/normalize-module-slug";
import type { AmssSessionUser } from "@/types/next-auth";

export type AppMenuModule = {
  slug: string;
  name: string;
  href: string;
};

export type AppMenuGroup = {
  id: number;
  legacyId: number | null;
  name: string;
  sortOrder: number;
  icon: MenuGroupIcon;
  modules: AppMenuModule[];
  /** แสดง dropdown แม้มีโมดูลเดียว (เช่น L1 การวางแผน) */
  preferFlyout?: boolean;
};

const GROUP_ICONS = ["general", "budget", "person", "academic", "alert"] as const;
export type MenuGroupIcon = (typeof GROUP_ICONS)[number];

/** legacy system_menugroup.menugroup = 1 — บริหารงานทั่วไป */
const GENERAL_GROUP_LEGACY_ID = 1;

/** whitelist โมดูลใน flyout / การ์ดหน้าแรก — ลำดับและชื่อตาม สพป.ชัยนาท */
const GENERAL_MENU_MODULES: { slug: string; name: string }[] = [
  { slug: "bookobec", name: "รับส่งหนังสือราชการ สพฐ." },
  { slug: "bookregister", name: "ทะเบียนหนังสือราชการ" },
  { slug: "book", name: "รับส่งหนังสือราชการ" },
  { slug: "mail", name: "ไปรษณีย์" },
  { slug: "permission", name: "ขออนุญาตไปราชการ" },
  { slug: "leave", name: "การลา" },
];

/** legacy system_menugroup.menugroup = 2 — บริหารงบประมาณ (แสดงเป็น L1 การวางแผน) */
const PLAN_GROUP_LEGACY_ID = 2;
const PLAN_GROUP_DISPLAY_NAME = "การวางแผน";

const PLAN_MENU_MODULES: { slug: string; name: string }[] = [
  { slug: "plan", name: "การวางแผน" },
];

const BUDGET_GROUP_DISPLAY_NAME = "การเงินและบัญชี";

const BUDGET_MENU_MODULES: { slug: string; name: string }[] = [
  { slug: "budget", name: "การเงินและบัญชี" },
];

/** legacy system_menugroup.menugroup = 3 — บริหารงานบุคคล */
const PERSON_GROUP_LEGACY_ID = 3;
const PERSON_GROUP_DISPLAY_NAME = "บริหารงานบุคคล";

const PERSON_MENU_MODULES: { slug: string; name: string }[] = [
  { slug: "person", name: "ข้อมูลพื้นฐานครูและบุคลากร" },
];

const IDOCUMENT_GROUP_DISPLAY_NAME = "บันทึกข้อความ";

const IDOCUMENT_MENU_MODULES: { slug: string; name: string }[] = [
  { slug: "idocument", name: "บันทึกข้อความ" },
];

const AFFAIR_GROUP_DISPLAY_NAME = "ภารกิจผู้บริหาร";

const AFFAIR_MENU_MODULES: { slug: string; name: string }[] = [
  { slug: "affair", name: "ภารกิจผู้บริหาร" },
];

const QUESTIONNAIRE_GROUP_DISPLAY_NAME = "แบบสอบถาม";

const QUESTIONNAIRE_MENU_MODULES: { slug: string; name: string }[] = [
  { slug: "questionnaire", name: "แบบสอบถาม" },
];

/** legacy system_menugroup.menugroup = 5 — แจ้งเตือน */
const ALERT_GROUP_LEGACY_ID = 5;
const ALERT_GROUP_DISPLAY_NAME = "แจ้งเตือน";

const ALERT_MENU_MODULES: { slug: string; name: string }[] = [
  { slug: "alert", name: "แจ้งเตือน" },
];

/** legacy system_menugroup.menugroup = 4 — บริหารงานวิชาการ */
const ACADEMIC_GROUP_LEGACY_ID = 4;
const ACADEMIC_GROUP_DISPLAY_NAME = "บริหารงานวิชาการ";

const ACADEMIC_MENU_MODULES: { slug: string; name: string }[] = [
  { slug: "dltv", name: "การศึกษาทางไกล" },
  { slug: "student_main", name: "ข้อมูลนักเรียน" },
  { slug: "achievement", name: "ผลสัมฤทธิ์ทางการเรียน" },
  { slug: "bets", name: "ระบบทดสอบการศึกษา" },
  { slug: "spacial_student", name: "นักเรียนพิเศษ" },
];

export function menuGroupIcon(legacyId: number | null): MenuGroupIcon {
  if (legacyId === 2) return "budget";
  if (legacyId === 3) return "person";
  if (legacyId === 4) return "academic";
  if (legacyId === 5) return "alert";
  return "general";
}

function curateMenuByWhitelist(
  modules: AppMenuModule[],
  whitelist: { slug: string; name: string }[],
): AppMenuModule[] {
  const bySlug = new Map(modules.map((mod) => [mod.slug, mod]));
  const curated: AppMenuModule[] = [];

  for (const def of whitelist) {
    const mod = bySlug.get(def.slug);
    if (!mod) continue;
    curated.push({ ...mod, name: def.name });
  }

  return curated;
}

function curateGeneralMenu(modules: AppMenuModule[]): AppMenuModule[] {
  return curateMenuByWhitelist(modules, GENERAL_MENU_MODULES);
}

function curatePlanMenu(modules: AppMenuModule[]): AppMenuModule[] {
  return curateMenuByWhitelist(modules, PLAN_MENU_MODULES);
}

function curateBudgetMenu(modules: AppMenuModule[]): AppMenuModule[] {
  return curateMenuByWhitelist(modules, BUDGET_MENU_MODULES);
}

function curatePersonMenu(modules: AppMenuModule[]): AppMenuModule[] {
  return curateMenuByWhitelist(modules, PERSON_MENU_MODULES);
}

function curateIdocumentMenu(modules: AppMenuModule[]): AppMenuModule[] {
  return curateMenuByWhitelist(modules, IDOCUMENT_MENU_MODULES);
}

function curateAffairMenu(modules: AppMenuModule[]): AppMenuModule[] {
  return curateMenuByWhitelist(modules, AFFAIR_MENU_MODULES);
}

function curateQuestionnaireMenu(modules: AppMenuModule[]): AppMenuModule[] {
  return curateMenuByWhitelist(modules, QUESTIONNAIRE_MENU_MODULES);
}

function curateAlertMenu(modules: AppMenuModule[]): AppMenuModule[] {
  return curateMenuByWhitelist(modules, ALERT_MENU_MODULES);
}

function curateAcademicMenu(modules: AppMenuModule[]): AppMenuModule[] {
  return curateMenuByWhitelist(modules, ACADEMIC_MENU_MODULES);
}

function buildPlanBudgetVirtualGroups(
  group: (typeof menuGroups.$inferSelect),
  groupModules: AppMenuModule[],
): AppMenuGroup[] {
  const icon = menuGroupIcon(group.legacyId);
  const virtual: AppMenuGroup[] = [];

  const planModules = curatePlanMenu(groupModules);
  if (planModules.length > 0) {
    virtual.push({
      id: group.id * 10 + 1,
      legacyId: group.legacyId,
      name: PLAN_GROUP_DISPLAY_NAME,
      sortOrder: group.sortOrder,
      icon,
      modules: planModules,
      preferFlyout: true,
    });
  }

  const budgetModules = curateBudgetMenu(groupModules);
  if (budgetModules.length > 0) {
    virtual.push({
      id: group.id * 10 + 2,
      legacyId: group.legacyId,
      name: BUDGET_GROUP_DISPLAY_NAME,
      sortOrder: group.sortOrder + 1,
      icon,
      modules: budgetModules,
      preferFlyout: true,
    });
  }

  return virtual;
}

function buildGeneralMenuGroups(
  group: (typeof menuGroups.$inferSelect),
  groupModules: AppMenuModule[],
): AppMenuGroup[] {
  const result: AppMenuGroup[] = [];
  const icon = menuGroupIcon(group.legacyId);

  const generalModules = curateGeneralMenu(groupModules);
  if (generalModules.length > 0) {
    result.push({
      id: group.id,
      legacyId: group.legacyId,
      name: group.name,
      sortOrder: group.sortOrder,
      icon,
      modules: generalModules,
    });
  }

  return result;
}

function buildAffairMenuGroup(
  group: (typeof menuGroups.$inferSelect),
  affairModules: AppMenuModule[],
): AppMenuGroup[] {
  if (affairModules.length === 0) {
    return [];
  }

  return [
    {
      id: group.id * 10 + 4,
      legacyId: GENERAL_GROUP_LEGACY_ID,
      name: AFFAIR_GROUP_DISPLAY_NAME,
      sortOrder: group.sortOrder + 2,
      icon: menuGroupIcon(GENERAL_GROUP_LEGACY_ID),
      modules: affairModules,
      preferFlyout: true,
    },
  ];
}

function buildQuestionnaireMenuGroup(
  group: (typeof menuGroups.$inferSelect),
  questionnaireModules: AppMenuModule[],
): AppMenuGroup[] {
  if (questionnaireModules.length === 0) {
    return [];
  }

  return [
    {
      id: group.id * 10 + 5,
      legacyId: GENERAL_GROUP_LEGACY_ID,
      name: QUESTIONNAIRE_GROUP_DISPLAY_NAME,
      sortOrder: group.sortOrder + 3,
      icon: menuGroupIcon(GENERAL_GROUP_LEGACY_ID),
      modules: questionnaireModules,
      preferFlyout: true,
    },
  ];
}

function buildIdocumentMenuGroup(
  group: (typeof menuGroups.$inferSelect),
  idocumentModules: AppMenuModule[],
): AppMenuGroup[] {
  if (idocumentModules.length === 0) {
    return [];
  }

  return [
    {
      id: group.id * 10 + 3,
      legacyId: GENERAL_GROUP_LEGACY_ID,
      name: IDOCUMENT_GROUP_DISPLAY_NAME,
      sortOrder: group.sortOrder + 1,
      icon: menuGroupIcon(GENERAL_GROUP_LEGACY_ID),
      modules: idocumentModules,
      preferFlyout: true,
    },
  ];
}

function buildPersonMenuGroup(
  group: (typeof menuGroups.$inferSelect),
  groupModules: AppMenuModule[],
): AppMenuGroup[] {
  const personModules = curatePersonMenu(groupModules);
  if (personModules.length === 0) {
    return [];
  }

  return [
    {
      id: group.id,
      legacyId: group.legacyId,
      name: PERSON_GROUP_DISPLAY_NAME,
      sortOrder: group.sortOrder,
      icon: menuGroupIcon(group.legacyId),
      modules: personModules,
      preferFlyout: true,
    },
  ];
}

function buildAcademicMenuGroup(
  group: (typeof menuGroups.$inferSelect),
  groupModules: AppMenuModule[],
): AppMenuGroup[] {
  const academicModules = curateAcademicMenu(groupModules);
  if (academicModules.length === 0) {
    return [];
  }

  return [
    {
      id: group.id,
      legacyId: group.legacyId,
      name: ACADEMIC_GROUP_DISPLAY_NAME,
      sortOrder: group.sortOrder,
      icon: menuGroupIcon(group.legacyId),
      modules: academicModules,
    },
  ];
}

function buildAlertMenuGroup(
  group: (typeof menuGroups.$inferSelect),
  groupModules: AppMenuModule[],
): AppMenuGroup[] {
  const alertModules = curateAlertMenu(groupModules);
  if (alertModules.length === 0) {
    return [];
  }

  return [
    {
      id: group.id,
      legacyId: group.legacyId,
      name: ALERT_GROUP_DISPLAY_NAME,
      sortOrder: group.sortOrder,
      icon: menuGroupIcon(group.legacyId),
      modules: alertModules,
      preferFlyout: true,
    },
  ];
}

function toAppMenuModules(
  rows: (typeof modules.$inferSelect)[],
  user: AmssSessionUser,
): AppMenuModule[] {
  return rows
    .filter((m) => canAccessModule(user.loginStatus, m.whereWork))
    .map((m) => {
      const slug = normalizeModuleSlug(m.slug);
      return {
        slug,
        name: m.name,
        href: `/modules/${slug}`,
      };
    });
}

export async function getAppMenu(user: AmssSessionUser): Promise<AppMenuGroup[]> {
  if (isFirstTimeLogin(user.loginStatus)) {
    return [];
  }

  const [groups, moduleRows] = await Promise.all([
    db.select().from(menuGroups).orderBy(asc(menuGroups.sortOrder)),
    db
      .select()
      .from(modules)
      .where(eq(modules.active, true))
      .orderBy(asc(modules.sortOrder)),
  ]);

  const generalGroup = groups.find((g) => g.legacyId === GENERAL_GROUP_LEGACY_ID);
  const generalGroupModules = generalGroup
    ? toAppMenuModules(
        moduleRows.filter((m) => m.menuGroupId === generalGroup.id),
        user,
      )
    : [];
  const idocumentModules = curateIdocumentMenu(generalGroupModules);
  const affairModules = curateAffairMenu(generalGroupModules);
  const questionnaireModules = curateQuestionnaireMenu(generalGroupModules);

  return groups.flatMap((group) => {
      const groupModules = toAppMenuModules(
        moduleRows.filter((m) => m.menuGroupId === group.id),
        user,
      );

      if (group.legacyId === PLAN_GROUP_LEGACY_ID) {
        return buildPlanBudgetVirtualGroups(group, groupModules);
      }

      if (group.legacyId === GENERAL_GROUP_LEGACY_ID) {
        return buildGeneralMenuGroups(group, groupModules);
      }

      if (group.legacyId === PERSON_GROUP_LEGACY_ID) {
        return buildPersonMenuGroup(group, groupModules);
      }

      if (group.legacyId === ACADEMIC_GROUP_LEGACY_ID) {
        return [
          ...buildAcademicMenuGroup(group, groupModules),
          ...buildIdocumentMenuGroup(group, idocumentModules),
          ...buildAffairMenuGroup(group, affairModules),
          ...buildQuestionnaireMenuGroup(group, questionnaireModules),
        ];
      }

      if (group.legacyId === ALERT_GROUP_LEGACY_ID) {
        return buildAlertMenuGroup(group, groupModules);
      }

      if (groupModules.length === 0) {
        return [];
      }

      return [
        {
          id: group.id,
          legacyId: group.legacyId,
          name: group.name,
          sortOrder: group.sortOrder,
          icon: menuGroupIcon(group.legacyId),
          modules: groupModules,
        },
      ];
    });
}

export async function getAccessibleModules(
  user: AmssSessionUser,
): Promise<AppMenuModule[]> {
  const menu = await getAppMenu(user);
  return menu.flatMap((g) => g.modules);
}
