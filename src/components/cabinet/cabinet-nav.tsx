"use client";

import { buildModuleSettingsNavSection } from "@/components/app-shell/module-settings-nav-section";
import {
  ModuleNav,
  type ModuleNavSectionDef,
} from "@/components/app-shell/module-nav";
import type { ModuleSettingsNavMode } from "@/lib/core/permissions";

type CabinetNavProps = {
  canUpload: boolean;
  settingsNavMode: ModuleSettingsNavMode;
};

export function CabinetNav({ canUpload, settingsNavMode }: CabinetNavProps) {
  const settingsSection = buildModuleSettingsNavSection(settingsNavMode, [
    { href: "/modules/cabinet/permissions", label: "สิทธิ์การใช้งาน" },
  ]);

  const sections: ModuleNavSectionDef[] = [
    ...(settingsSection ? [settingsSection] : []),
    {
      title: "ตู้เอกสาร",
      links: [
        { href: "/modules/cabinet", label: "เอกสารตู้กลาง", exact: true },
        {
          href: "/modules/cabinet/upload",
          label: "อัปโหลดเอกสาร",
          visible: canUpload,
        },
      ],
    },
  ];

  return <ModuleNav ariaLabel="เมนูตู้เอกสาร" sections={sections} />;
}
