"use client";

import { buildModuleSettingsNavSection } from "@/components/app-shell/module-settings-nav-section";
import {
  ModuleNav,
  type ModuleNavSectionDef,
} from "@/components/app-shell/module-nav";
import type { ModuleSettingsNavMode } from "@/lib/core/permissions";

type MeetingNavProps = {
  canWrite: boolean;
  settingsNavMode: ModuleSettingsNavMode;
};

export function MeetingNav({ canWrite, settingsNavMode }: MeetingNavProps) {
  const settingsSection = buildModuleSettingsNavSection(settingsNavMode, [
    { href: "/modules/meeting/permissions", label: "สิทธิ์เจ้าหน้าที่" },
    { href: "/modules/meeting/rooms", label: "กำหนดห้อง" },
  ]);

  const sections: ModuleNavSectionDef[] = [
    ...(settingsSection ? [settingsSection] : []),
    {
      title: "จองห้องประชุม",
      links: [
        { href: "/modules/meeting/bookings", label: "ทะเบียนจอง" },
        {
          href: "/modules/meeting/bookings/new",
          label: "จองห้องประชุม",
          visible: canWrite,
        },
        { href: "/modules/meeting/calendar", label: "ปฏิทิน (รายวัน)" },
      ],
    },
  ];

  return <ModuleNav ariaLabel="เมนูจองห้องประชุม" sections={sections} />;
}
