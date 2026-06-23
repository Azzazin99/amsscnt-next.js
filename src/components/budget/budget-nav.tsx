"use client";

import {
  ModuleNav,
  type ModuleNavSectionDef,
} from "@/components/app-shell/module-nav";

type BudgetNavProps = {
  canWriteReceive: boolean;
  canWriteDisburse: boolean;
  showAdmin: boolean;
};

export function BudgetNav({
  canWriteReceive,
  canWriteDisburse,
  showAdmin,
}: BudgetNavProps) {
  const sections: ModuleNavSectionDef[] = [
    {
      title: "ตั้งค่าระบบ",
      visible: showAdmin,
      links: [{ href: "/modules/budget/years", label: "ปีงบประมาณ" }],
    },
    {
      title: "ทะเบียนรับ",
      links: [
        { href: "/modules/budget/receive", label: "ทะเบียนรับ" },
        {
          href: "/modules/budget/receive/new",
          label: "เพิ่มรับ",
          visible: canWriteReceive,
        },
      ],
    },
    {
      title: "ทะเบียนจ่าย",
      links: [
        { href: "/modules/budget/disburse", label: "ทะเบียนจ่าย" },
        {
          href: "/modules/budget/disburse/new",
          label: "เพิ่มจ่าย",
          visible: canWriteDisburse,
        },
      ],
    },
  ];

  return <ModuleNav ariaLabel="เมนูการเงินและบัญชี" sections={sections} />;
}
