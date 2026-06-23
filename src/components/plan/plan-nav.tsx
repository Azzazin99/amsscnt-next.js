"use client";

import {
  ModuleNav,
  type ModuleNavSectionDef,
} from "@/components/app-shell/module-nav";

type PlanNavProps = {
  canWrite: boolean;
  showAdmin: boolean;
};

export function PlanNav({ canWrite, showAdmin }: PlanNavProps) {
  const sections: ModuleNavSectionDef[] = [
    {
      title: "ตั้งค่าระบบ",
      visible: showAdmin,
      links: [{ href: "/modules/plan/years", label: "ปีงบประมาณ" }],
    },
    {
      title: "แผนงาน",
      links: [
        { href: "/modules/plan/projects", label: "โครงการ" },
        {
          href: "/modules/plan/projects/new",
          label: "เพิ่มโครงการ",
          visible: canWrite,
        },
        { href: "/modules/plan/activities", label: "กิจกรรม" },
        {
          href: "/modules/plan/activities/new",
          label: "เพิ่มกิจกรรม",
          visible: canWrite,
        },
      ],
    },
  ];

  return <ModuleNav ariaLabel="เมนูการวางแผน" sections={sections} />;
}
