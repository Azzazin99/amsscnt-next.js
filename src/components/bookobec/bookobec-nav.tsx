"use client";

import { buildModuleSettingsNavSection } from "@/components/app-shell/module-settings-nav-section";
import {
  ModuleNav,
  type ModuleNavSectionDef,
} from "@/components/app-shell/module-nav";
import type { ModuleSettingsNavMode } from "@/lib/core/permissions";

type BookobecNavProps = {
  settingsNavMode: ModuleSettingsNavMode;
};

export function BookobecNav({ settingsNavMode }: BookobecNavProps) {
  const settingsSection = buildModuleSettingsNavSection(settingsNavMode, [
    {
      href: "/modules/bookobec/permissions",
      label: "กำหนดเจ้าหน้าที่",
    },
    {
      href: "/modules/bookobec/settings",
      label: "เชื่อมกับ SMART OBEC",
    },
  ]);

  const sections: ModuleNavSectionDef[] = [
    ...(settingsSection ? [settingsSection] : []),
    {
      title: "สพฐ.",
      links: [
        {
          label: "รายการหนังสือรับ",
          children: [
            {
              href: "/modules/bookobec/inbox",
              label: "รายการหนังสือรับ สพฐ.",
              exact: true,
            },
          ],
        },
        {
          label: "รายการหนังสือส่ง",
          children: [
            {
              href: "/modules/bookobec/sent",
              label: "รายการหนังสือส่ง สพฐ.",
              exact: true,
            },
          ],
        },
        {
          label: "คู่มือ",
          children: [
            {
              href: "/modules/bookobec/manual",
              label: "คู่มือรับส่งหนังสือราชการ สพฐ.",
              exact: true,
            },
          ],
        },
      ],
    },
  ];

  return <ModuleNav ariaLabel="เมนูรับส่งหนังสือราชการ สพฐ." sections={sections} />;
}
