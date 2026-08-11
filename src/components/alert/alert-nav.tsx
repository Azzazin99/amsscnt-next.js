"use client";

import { buildModuleSettingsNavSection } from "@/components/app-shell/module-settings-nav-section";
import {
  ModuleNav,
  type ModuleNavSectionDef,
} from "@/components/app-shell/module-nav";
import type { ModuleSettingsNavMode } from "@/lib/core/permissions";

type AlertNavProps = {
  settingsNavMode: ModuleSettingsNavMode;
};

export function AlertNav({ settingsNavMode }: AlertNavProps) {
  const settingsSection = buildModuleSettingsNavSection(settingsNavMode, [
    { href: "/modules/alert/permissions", label: "สิทธิ์การใช้งาน" },
  ]);

  const sections: ModuleNavSectionDef[] = [
    ...(settingsSection ? [settingsSection] : []),
    {
      title: "แจ้งเตือน",
      links: [
        {
          href: "/modules/alert",
          label: "แจ้งเตือน",
          exact: true,
        },
      ],
    },
  ];

  return <ModuleNav ariaLabel="เมนูแจ้งเตือน" sections={sections} />;
}
