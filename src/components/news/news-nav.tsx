"use client";

import { buildModuleSettingsNavSection } from "@/components/app-shell/module-settings-nav-section";
import {
  ModuleNav,
  type ModuleNavSectionDef,
} from "@/components/app-shell/module-nav";
import type { ModuleSettingsNavMode } from "@/lib/core/permissions";

type NewsNavProps = {
  canWrite: boolean;
  settingsNavMode: ModuleSettingsNavMode;
};

export function NewsNav({ canWrite, settingsNavMode }: NewsNavProps) {
  const settingsSection = buildModuleSettingsNavSection(settingsNavMode, [
    { href: "/modules/news/permissions", label: "สิทธิ์การใช้งาน" },
    { href: "/modules/news/mainitems", label: "ชื่อเรื่อง" },
    { href: "/modules/news/sections", label: "ประเภทข่าว" },
  ]);

  const sections: ModuleNavSectionDef[] = [
    ...(settingsSection ? [settingsSection] : []),
    {
      title: "ข่าว",
      links: [
        { href: "/modules/news", label: "บันทึกข่าว", exact: true },
        {
          href: "/modules/news/new",
          label: "เพิ่มข่าว",
          visible: canWrite,
        },
      ],
    },
  ];

  return <ModuleNav ariaLabel="เมนูข่าว" sections={sections} />;
}
