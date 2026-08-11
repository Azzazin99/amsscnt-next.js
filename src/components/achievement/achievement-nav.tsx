"use client";

import { buildModuleSettingsNavSection } from "@/components/app-shell/module-settings-nav-section";
import {
  ModuleNav,
  type ModuleNavSectionDef,
} from "@/components/app-shell/module-nav";
import type { ModuleSettingsNavMode } from "@/lib/core/permissions";

export function AchievementNav({
  canWrite,
  settingsNavMode,
}: {
  canWrite: boolean;
  settingsNavMode: ModuleSettingsNavMode;
}) {
  const settingsSection = buildModuleSettingsNavSection(settingsNavMode, [
    { href: "/modules/achievement/permissions", label: "สิทธิ์การใช้งาน" },
  ]);

  const sections: ModuleNavSectionDef[] = [
    ...(settingsSection ? [settingsSection] : []),
    {
      title: "ผลสัมฤทธิ์",
      links: [
        { href: "/modules/achievement/scores", label: "คะแนนผลสัมฤทธิ์" },
        {
          href: "/modules/achievement/scores/new",
          label: "บันทึกคะแนน",
          visible: canWrite,
        },
      ],
    },
  ];

  return <ModuleNav ariaLabel="เมนูผลสัมฤทธิ์" sections={sections} />;
}
