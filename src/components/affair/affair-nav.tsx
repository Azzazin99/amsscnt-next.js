"use client";

import { buildModuleSettingsNavSection } from "@/components/app-shell/module-settings-nav-section";
import {
  ModuleNav,
  type ModuleNavSectionDef,
} from "@/components/app-shell/module-nav";
import type { ModuleSettingsNavMode } from "@/lib/core/permissions";

type AffairNavProps = {
  canWrite: boolean;
  settingsNavMode: ModuleSettingsNavMode;
};

export function AffairNav({ canWrite, settingsNavMode }: AffairNavProps) {
  const settingsSection = buildModuleSettingsNavSection(settingsNavMode, [
    { href: "/modules/affair/permissions", label: "สิทธิ์การใช้งาน" },
  ]);

  const sections: ModuleNavSectionDef[] = [
    ...(settingsSection ? [settingsSection] : []),
    {
      title: "ภารกิจผู้บริหาร",
      links: [
        {
          href: "/modules/affair",
          label: "ภารกิจผู้บริหาร",
          exact: true,
        },
        {
          href: "/modules/affair/new",
          label: "บันทึกภารกิจ",
          visible: canWrite,
        },
      ],
    },
  ];

  return <ModuleNav ariaLabel="เมนูภารกิจผู้บริหาร" sections={sections} />;
}
