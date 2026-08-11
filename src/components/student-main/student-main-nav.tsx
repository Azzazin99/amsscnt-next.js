"use client";

import { buildModuleSettingsNavSection } from "@/components/app-shell/module-settings-nav-section";
import {
  ModuleNav,
  type ModuleNavSectionDef,
} from "@/components/app-shell/module-nav";
import type { ModuleSettingsNavMode } from "@/lib/core/permissions";

export function StudentMainNav({
  canWrite,
  settingsNavMode,
}: {
  canWrite: boolean;
  settingsNavMode: ModuleSettingsNavMode;
}) {
  const settingsSection = buildModuleSettingsNavSection(settingsNavMode, [
    { href: "/modules/student_main/years", label: "ปีการศึกษา" },
    { href: "/modules/student_main/permissions", label: "สิทธิ์การใช้งาน" },
  ]);

  const sections: ModuleNavSectionDef[] = [
    ...(settingsSection ? [settingsSection] : []),
    {
      title: "ข้อมูลนักเรียน",
      links: [
        { href: "/modules/student_main/students", label: "รายชื่อนักเรียน" },
        {
          href: "/modules/student_main/students/new",
          label: "เพิ่มนักเรียน",
          visible: canWrite,
        },
      ],
    },
  ];

  return <ModuleNav ariaLabel="เมนูข้อมูลนักเรียน" sections={sections} />;
}
