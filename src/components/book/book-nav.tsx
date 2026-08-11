"use client";

import { buildModuleSettingsNavSection } from "@/components/app-shell/module-settings-nav-section";
import {
  ModuleNav,
  type ModuleNavSectionDef,
} from "@/components/app-shell/module-nav";
import type { ModuleSettingsNavMode } from "@/lib/core/permissions";

type BookNavProps = {
  canWrite: boolean;
  settingsNavMode: ModuleSettingsNavMode;
  showRetention: boolean;
};

export function BookNav({
  canWrite,
  settingsNavMode,
  showRetention,
}: BookNavProps) {
  const settingsLinks = [
    { href: "/modules/book/saraban-permissions", label: "กำหนดสารบรรณ สพท." },
    {
      href: "/modules/book/school-saraban-permissions",
      label: "กำหนดสารบรรณ สถานศึกษา",
    },
    { href: "/modules/book/groups", label: "กลุ่มหนังสือ" },
    ...(showRetention
      ? [{ href: "/modules/book/retention", label: "อายุเก็บ / ทำลาย" }]
      : []),
  ];

  const settingsSection = buildModuleSettingsNavSection(
    settingsNavMode,
    settingsLinks,
  );

  const sections: ModuleNavSectionDef[] = [
    ...(settingsSection ? [settingsSection] : []),
    {
      title: "รับส่งหนังสือ",
      links: [
        {
          href: "/modules/book/inbox",
          label: "หนังสือรับ",
          exact: true,
        },
        {
          href: "/modules/book/sent",
          label: "หนังสือส่ง",
        },
        {
          href: "/modules/book/new",
          label: "ส่งหนังสือราชการ",
          visible: canWrite,
        },
        {
          href: "/modules/book/inbox/overdue",
          label: "หนังสือที่ยังไม่รับเกิน 3 วัน",
        },
        {
          href: "/modules/book/inbox/aged",
          label: "หนังสืออายุเกิน 2 ปี",
        },
      ],
    },
  ];

  return <ModuleNav ariaLabel="เมนูรับส่งหนังสือ" sections={sections} />;
}
