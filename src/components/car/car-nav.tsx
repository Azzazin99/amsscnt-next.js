"use client";

import { buildModuleSettingsNavSection } from "@/components/app-shell/module-settings-nav-section";
import {
  ModuleNav,
  type ModuleNavSectionDef,
} from "@/components/app-shell/module-nav";
import type { ModuleSettingsNavMode } from "@/lib/core/permissions";

type CarNavProps = {
  canWrite: boolean;
  settingsNavMode: ModuleSettingsNavMode;
};

export function CarNav({ canWrite, settingsNavMode }: CarNavProps) {
  const settingsSection = buildModuleSettingsNavSection(settingsNavMode, [
    { href: "/modules/car/permissions", label: "สิทธิ์การใช้งาน" },
    { href: "/modules/car/types", label: "ประเภทรถ" },
    { href: "/modules/car/vehicles", label: "ยานพาหนะ" },
    { href: "/modules/car/drivers", label: "พนักงานขับรถ" },
  ]);

  const sections: ModuleNavSectionDef[] = [
    ...(settingsSection ? [settingsSection] : []),
    {
      title: "ขอใช้รถ",
      links: [
        { href: "/modules/car/requests", label: "คำขอใช้รถ" },
        {
          href: "/modules/car/requests/new",
          label: "ขอใช้รถใหม่",
          visible: canWrite,
        },
      ],
    },
  ];

  return <ModuleNav ariaLabel="เมนูระบบยานพาหนะ" sections={sections} />;
}
