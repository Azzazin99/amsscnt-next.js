"use client";

import { buildModuleSettingsNavSection } from "@/components/app-shell/module-settings-nav-section";
import {
  ModuleNav,
  type ModuleNavSectionDef,
} from "@/components/app-shell/module-nav";
import type { ModuleSettingsNavMode } from "@/lib/core/permissions";

export function SpacialStudentNav({
  canWrite,
  settingsNavMode,
}: {
  canWrite: boolean;
  settingsNavMode: ModuleSettingsNavMode;
}) {
  const settingsSection = buildModuleSettingsNavSection(settingsNavMode, [
    {
      href: "/modules/spacial_student/permissions",
      label: "สิทธิ์การใช้งาน",
    },
  ]);

  const sections: ModuleNavSectionDef[] = [
    ...(settingsSection ? [settingsSection] : []),
    {
      title: "นักเรียนพิเศษ",
      links: [
        { href: "/modules/spacial_student/students", label: "นักเรียนพิเศษ" },
        {
          href: "/modules/spacial_student/students/new",
          label: "เพิ่มรายการ",
          visible: canWrite,
        },
      ],
    },
  ];

  return <ModuleNav ariaLabel="เมนูนักเรียนพิเศษ" sections={sections} />;
}
