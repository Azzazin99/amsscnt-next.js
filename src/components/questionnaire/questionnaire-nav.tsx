"use client";

import { buildModuleSettingsNavSection } from "@/components/app-shell/module-settings-nav-section";
import {
  ModuleNav,
  type ModuleNavSectionDef,
} from "@/components/app-shell/module-nav";
import type { ModuleSettingsNavMode } from "@/lib/core/permissions";

type QuestionnaireNavProps = {
  settingsNavMode: ModuleSettingsNavMode;
};

export function QuestionnaireNav({ settingsNavMode }: QuestionnaireNavProps) {
  const settingsSection = buildModuleSettingsNavSection(settingsNavMode, [
    { href: "/modules/questionnaire/permissions", label: "สิทธิ์การใช้งาน" },
  ]);

  const sections: ModuleNavSectionDef[] = [
    ...(settingsSection ? [settingsSection] : []),
    {
      title: "แบบสอบถาม",
      links: [
        {
          href: "/modules/questionnaire",
          label: "แบบสอบถาม",
          exact: true,
        },
      ],
    },
  ];

  return <ModuleNav ariaLabel="เมนูแบบสอบถาม" sections={sections} />;
}
