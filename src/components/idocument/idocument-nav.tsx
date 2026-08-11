"use client";

import { buildModuleSettingsNavSection } from "@/components/app-shell/module-settings-nav-section";
import {
  ModuleNav,
  type ModuleNavSectionDef,
} from "@/components/app-shell/module-nav";
import type { ModuleSettingsNavMode } from "@/lib/core/permissions";

type IdocumentNavProps = {
  canWrite: boolean;
  canViewInbox: boolean;
  settingsNavMode: ModuleSettingsNavMode;
};

export function IdocumentNav({
  canWrite,
  canViewInbox,
  settingsNavMode,
}: IdocumentNavProps) {
  const settingsSection = buildModuleSettingsNavSection(settingsNavMode, [
    { href: "/modules/idocument/permissions", label: "สิทธิ์การใช้งาน" },
  ]);

  const sections: ModuleNavSectionDef[] = [
    ...(settingsSection ? [settingsSection] : []),
    {
      title: "บันทึกเสนอ",
      links: [
        {
          href: "/modules/idocument",
          label: "รายการบันทึกเสนอ",
          exact: true,
        },
        {
          href: "/modules/idocument/new",
          label: "เพิ่มบันทึกเสนอ",
          visible: canWrite,
        },
      ],
    },
    {
      title: "ลงความเห็น/สั่งการ",
      visible: canViewInbox,
      links: [
        {
          href: "/modules/idocument/inbox",
          label: "ลงความเห็น/สั่งการ",
          exact: true,
        },
      ],
    },
    {
      title: "รายงาน",
      links: [
        {
          href: "/modules/idocument/reports",
          label: "บันทึกข้อความทั้งหมด",
          exact: true,
        },
      ],
    },
  ];

  return <ModuleNav ariaLabel="เมนูบันทึกข้อความ" sections={sections} />;
}
