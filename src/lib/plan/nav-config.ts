import type { ModuleNavSectionDef } from "@/components/app-shell/module-nav";
import type { ModuleSettingsNavMode } from "@/lib/core/permissions";
import { buildModuleSettingsNavSection } from "@/components/app-shell/module-settings-nav-section";

export type PlanNavContext = {
  settingsNavMode: ModuleSettingsNavMode;
  canOperate: boolean;
  canAdd: boolean;
  showDistrictMenus: boolean;
  showDistrictReports: boolean;
};

/** Amssplus plan menu — 7 flyout groups (self-check: length must be >= 6 sections with settings) */
export function buildPlanNavSections(ctx: PlanNavContext): ModuleNavSectionDef[] {
  const settingsSection = buildModuleSettingsNavSection(ctx.settingsNavMode, [
    {
      label: "เมนูตั้งค่า",
      children: [
        { href: "/modules/plan/permissions", label: "กำหนดเจ้าหน้าที่" },
        { href: "/modules/plan/years", label: "ปีงบประมาณ" },
        { href: "/modules/plan/strategies", label: "กำหนดยุทธศาสตร์" },
      ],
    },
  ]);

  const annualChildren = [
    { href: "/modules/plan/projects", label: "กำหนดโครงการ" },
    { href: "/modules/plan/attachments", label: "แนบเอกสารโครงการ" },
    { href: "/modules/plan/smss-import", label: "เรียกข้อมูลจาก SMSS" },
  ];

  const surplusChildren = [
    { href: "/modules/plan/surplus/projects", label: "กำหนดโครงการ" },
    {
      href: "/modules/plan/surplus/reports/allocation",
      label: "รายงานการจัดสรรเงิน",
    },
    {
      href: "/modules/plan/surplus/activities/stop",
      label: "หยุดกิจกรรม/โครงการ",
    },
    {
      href: "/modules/plan/surplus/reports/remaining",
      label: "เหลือจ่ายจากยุติกิจกรรม/โครงการ",
    },
  ];

  const checkChildren = [
    {
      href: "/modules/plan/checks/installment-register",
      label: "ทะเบียนเงินงวด",
    },
    {
      href: "/modules/plan/checks/allocation",
      label: "ตรวจสอบการจัดสรรงบประมาณ",
    },
    {
      href: "/modules/plan/checks/spending",
      label: "ตรวจสอบการใช้จ่ายโครงการ",
    },
  ];

  const reportChildren = [
    {
      href: "/modules/plan/reports/by-workgroup",
      label: "โครงการจำแนกตามกลุ่ม(งาน)",
    },
    ...(ctx.showDistrictReports
      ? [
          {
            href: "/modules/plan/reports/allocation-summary",
            label: "รายงานการจัดสรรงบประมาณ",
          },
          {
            href: "/modules/plan/reports/by-strategy",
            label: "โครงการจำแนกตามกลยุทธ์",
          },
          {
            href: "/modules/plan/reports/owner-results",
            label: "รายงานผลการดำเนินงาน",
          },
        ]
      : []),
    {
      href: "/modules/plan/reports/surplus-projects",
      label: "โครงการเพิ่มเติมจากเงินเหลือจ่าย",
      visible: ctx.showDistrictReports,
    },
  ].filter((item) => item.visible !== false);

  const sections: ModuleNavSectionDef[] = [
    ...(settingsSection ? [settingsSection] : []),
    ...(ctx.showDistrictMenus
      ? [
          {
            links: [
              {
                label: "โครงการประจำปี",
                children: annualChildren,
              },
            ],
          },
          {
            links: [
              {
                label: "เงินเหลือจ่าย",
                children: surplusChildren,
              },
            ],
          },
          {
            links: [
              {
                label: "ตรวจสอบ",
                children: checkChildren,
              },
            ],
          },
        ]
      : []),
    {
      links: [
        {
          label: "รายงานโครงการ",
          children: reportChildren,
        },
      ],
    },
    {
      links: [
        {
          label: "คู่มือ",
          children: [
            { href: "/modules/plan/manual", label: "คู่มือการใช้งาน" },
          ],
        },
      ],
    },
  ];

  return sections;
}

export const PLAN_NAV_FLYOUT_GROUP_LABELS = [
  "ตั้งค่าระบบ",
  "โครงการประจำปี",
  "เงินเหลือจ่าย",
  "ตรวจสอบ",
  "รายงานโครงการ",
  "คู่มือ",
] as const;
