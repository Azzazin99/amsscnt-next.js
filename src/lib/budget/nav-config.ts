import type { ModuleNavSectionDef } from "@/components/app-shell/module-nav";
import type { ModuleSettingsNavMode } from "@/lib/core/permissions";
import { buildModuleSettingsNavSection } from "@/components/app-shell/module-settings-nav-section";

export type BudgetNavContext = {
  settingsNavMode: ModuleSettingsNavMode;
  showStaffMenus: boolean;
  canSettings: boolean;
  canAllocation: boolean;
  canReceiveBudget: boolean;
  canReceiveExtra: boolean;
  canReceiveIncome: boolean;
  canWithdraw: boolean;
  canDeega: boolean;
  canPayBudget: boolean;
  canPayExtra: boolean;
  canPayIncome: boolean;
  canPayReserve: boolean;
  canPayCheck: boolean;
  canChangeBudget: boolean;
  canChangeExtra: boolean;
  canChangeIncome: boolean;
  canChecks: boolean;
  showWideReports: boolean;
  showDebtReports: boolean;
};

/** Amssplus budget menu — main route + 8 legacy flyout groups */
export function buildBudgetNavSections(
  ctx: BudgetNavContext,
): ModuleNavSectionDef[] {
  const settingsSection = buildModuleSettingsNavSection(ctx.settingsNavMode, [
    {
      label: "เมนูตั้งค่า",
      children: [
        ...(ctx.showStaffMenus
          ? [{ href: "/modules/budget/permissions", label: "เจ้าหน้าที่การเงินฯ" }]
          : []),
        ...(ctx.canSettings
          ? [
              { href: "/modules/budget/years", label: "ปีงบประมาณ" },
              { href: "/modules/budget/plans", label: "แผนงาน" },
              {
                href: "/modules/budget/project-products",
                label: "ผลผลิตโครงการ",
              },
              {
                href: "/modules/budget/key-activities",
                label: "กิจกรรมหลัก",
              },
              { href: "/modules/budget/money-sources", label: "แหล่งของเงิน" },
              { href: "/modules/budget/pay-types", label: "งบรายจ่าย" },
              {
                href: "/modules/budget/categories",
                label: "ประเภท(หลัก)ของเงิน",
              },
              { href: "/modules/budget/types", label: "ประเภท(ย่อย)ของเงิน" },
            ]
          : []),
      ].filter(Boolean),
    },
  ]);

  const receiveChildren = [
    ...(ctx.canAllocation
      ? [{ href: "/modules/budget/allocation", label: "รับการจัดสรรงบประมาณ" }]
      : []),
    ...(ctx.canReceiveBudget
      ? [{ href: "/modules/budget/receive/budget", label: "รับเงินงบประมาณ" }]
      : []),
    ...(ctx.canReceiveExtra
      ? [{ href: "/modules/budget/receive/extra", label: "รับเงินนอกงบประมาณ" }]
      : []),
    ...(ctx.canReceiveIncome
      ? [
          {
            href: "/modules/budget/receive/income",
            label: "รับเงินรายได้แผ่นดิน",
          },
        ]
      : []),
  ];

  const withdrawChildren = [
    ...(ctx.canWithdraw
      ? [
          {
            href: "/modules/budget/withdraw",
            label: "ทะเบียนขอเบิก/ขอยืมเงินโครงการ",
            exact: true,
          },
          {
            href: "/modules/budget/withdraw/returns",
            label: "ทะเบียนคืนเงินโครงการ",
          },
        ]
      : []),
    ...(ctx.canDeega
      ? [
          {
            href: "/modules/budget/deega",
            label: "ทะเบียนขอเบิกเงินคงคลัง",
            exact: true,
          },
          {
            href: "/modules/budget/deega/returns",
            label: "ทะเบียนคืนเงินคงคลัง",
          },
          { href: "/modules/budget/deega/cancel", label: "ยกเลิกฎีกา" },
          {
            href: "/modules/budget/deega/carryover",
            label: "ทะเบียนเงินกันเหลื่อมปี",
          },
        ]
      : []),
  ];

  const payChildren = [
    ...(ctx.canPayBudget
      ? [{ href: "/modules/budget/pay/budget", label: "สั่งจ่ายเงินงบประมาณ" }]
      : []),
    ...(ctx.canPayExtra
      ? [{ href: "/modules/budget/pay/extra", label: "สั่งจ่ายเงินนอกงบประมาณ" }]
      : []),
    ...(ctx.canPayIncome
      ? [
          {
            href: "/modules/budget/pay/income",
            label: "สั่งจ่ายเงินรายได้แผ่นดิน",
          },
        ]
      : []),
    ...(ctx.canPayReserve
      ? [{ href: "/modules/budget/pay/reserve", label: "เงินทดรองราชการ" }]
      : []),
    ...(ctx.canPayCheck
      ? [
          { href: "/modules/budget/pay-check/main", label: "จ่ายเงินประเภทหลัก" },
          {
            href: "/modules/budget/pay-check/reserve",
            label: "จ่ายเงินทดรองราชการ",
          },
        ]
      : []),
  ];

  const statusChildren = [
    ...(ctx.canChangeBudget
      ? [{ href: "/modules/budget/status-change/budget", label: "เงินงบประมาณ" }]
      : []),
    ...(ctx.canChangeExtra
      ? [{ href: "/modules/budget/status-change/extra", label: "เงินนอกงบประมาณ" }]
      : []),
    ...(ctx.canChangeIncome
      ? [
          {
            href: "/modules/budget/status-change/income",
            label: "เงินรายได้แผ่นดิน",
          },
        ]
      : []),
  ];

  const checkChildren = ctx.canChecks
    ? [
        {
          href: "/modules/budget/checks/installment-report",
          label: "รายงานเงินประจำงวด",
        },
        {
          href: "/modules/budget/checks/allocation",
          label: "การจัดสรรงบประมาณ",
        },
        {
          href: "/modules/budget/checks/spending-by-installment",
          label: "การใช้จ่ายในโครงการจำแนกตามใบงวด",
        },
        {
          href: "/modules/budget/checks/pay-check-main",
          label: "จ่ายเงินประเภทหลัก",
        },
        {
          href: "/modules/budget/checks/pay-check-reserve",
          label: "จ่ายเงินทดรองราชการ",
        },
        {
          href: "/modules/budget/checks/missing-deega",
          label: "เลขที่ฎีกาที่ไม่มีในระบบ",
        },
        {
          href: "/modules/budget/checks/deega-by-installment",
          label: "ฎีกากับการตัดโครงการจำแนกตามใบงวด",
        },
        {
          href: "/modules/budget/checks/deega-by-withdraw",
          label: "ฎีกากับการอ้างอิงการขอเบิกจำแนกตามฎีกา",
        },
        {
          href: "/modules/budget/checks/unposted-withdraw",
          label: "รายการขอเบิกฯที่ยังไม่ได้วางฎีกา",
        },
        {
          href: "/modules/budget/checks/wrong-installment",
          label: "รายการขอเบิกฯที่วางฎีกาผิดใบงวด",
        },
        {
          href: "/modules/budget/checks/daily-payments",
          label: "รายการการจ่ายเงินรายวัน",
        },
      ]
    : [];

  const reportChildren = [
    ...(ctx.showWideReports
      ? [
          {
            href: "/modules/budget/reports/allocation",
            label: "รายงานการจัดสรรงบประมาณ",
          },
          {
            href: "/modules/budget/reports/by-project",
            label: "รายงานการใช้จ่ายจำแนกตามโครงการ",
          },
          {
            href: "/modules/budget/reports/installment-register",
            label: "ทะเบียนเงินงวด",
          },
        ]
      : []),
    ...(ctx.canChecks
      ? [
          {
            href: "/modules/budget/reports/by-budget-code",
            label: "รายงานการใช้จ่ายจำแนกตามรหัสงบประมาณ",
          },
          {
            href: "/modules/budget/reports/by-pay-type",
            label: "รายงานการใช้จ่ายจำแนกตามประเภทรายการจ่าย",
          },
          {
            href: "/modules/budget/reports/daily-balance",
            label: "รายงานเงินคงเหลือประจำวัน",
          },
          { href: "/modules/budget/reports/cash-book", label: "สมุดเงินสด" },
          {
            href: "/modules/budget/reports/budget-book",
            label: "รายงานเงินงบประมาณ",
          },
          {
            href: "/modules/budget/reports/extra-book",
            label: "รายงานเงินนอกงบประมาณ",
          },
          {
            href: "/modules/budget/reports/income-book",
            label: "รายงานเงินรายได้แผ่นดิน",
          },
        ]
      : []),
    ...(ctx.showDebtReports
      ? [
          {
            href: "/modules/budget/reports/debtors",
            label: "รายงานลูกหนี้เงินยืม",
          },
          {
            href: "/modules/budget/reports/surplus-projects",
            label: "โครงการเพิ่มเติมจากเงินเหลือจ่าย",
          },
        ]
      : []),
  ];

  const sections: ModuleNavSectionDef[] = [
    ...(settingsSection ? [settingsSection] : []),
    ...(receiveChildren.length
      ? [{ links: [{ label: "ทะเบียนรับ", children: receiveChildren }] }]
      : []),
    ...(withdrawChildren.length
      ? [{ links: [{ label: "ทะเบียนขอเบิก", children: withdrawChildren }] }]
      : []),
    ...(payChildren.length
      ? [{ links: [{ label: "ทะเบียนจ่าย", children: payChildren }] }]
      : []),
    ...(statusChildren.length
      ? [
          {
            links: [{ label: "เปลี่ยนแปลงสถานะ", children: statusChildren }],
          },
        ]
      : []),
    ...(checkChildren.length
      ? [{ links: [{ label: "ตรวจสอบ", children: checkChildren }] }]
      : []),
    ...(reportChildren.length
      ? [{ links: [{ label: "รายงาน", children: reportChildren }] }]
      : []),
    {
      links: [
        {
          label: "คู่มือ",
          children: [
            { href: "/modules/budget/manual", label: "คู่มือการเงินและบัญชี" },
          ],
        },
      ],
    },
  ];

  return sections;
}

export const BUDGET_NAV_FLYOUT_GROUP_LABELS = [
  "ตั้งค่าระบบ",
  "ทะเบียนรับ",
  "ทะเบียนขอเบิก",
  "ทะเบียนจ่าย",
  "เปลี่ยนแปลงสถานะ",
  "ตรวจสอบ",
  "รายงาน",
  "คู่มือ",
] as const;

export const BUDGET_NAV_CHECK_LABELS = [
  "ตรวจสอบการจัดสรรงบประมาณ",
  "รายงานเงินประจำงวด",
  "จ่ายเงินประเภทหลัก",
  "จ่ายเงินทดรองราชการ",
  "เลขที่ฎีกาที่ไม่มีในระบบ",
  "ฎีกากับการตัดโครงการจำแนกตามใบงวด",
  "ฎีกากับการอ้างอิงการขอเบิกจำแนกตามฎีกา",
  "รายการขอเบิกฯที่ยังไม่ได้วางฎีกา",
  "รายการขอเบิกฯที่วางฎีกาผิดใบงวด",
  "รายการการจ่ายเงินรายวัน",
] as const;
