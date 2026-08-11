"use client";

import { buildModuleSettingsNavSection } from "@/components/app-shell/module-settings-nav-section";
import {
  ModuleNav,
  type ModuleNavSectionDef,
} from "@/components/app-shell/module-nav";
import type { ModuleSettingsNavMode } from "@/lib/core/permissions";

type MailNavProps = {
  canWrite: boolean;
  settingsNavMode: ModuleSettingsNavMode;
};

export function MailNav({ canWrite, settingsNavMode }: MailNavProps) {
  const settingsSection = buildModuleSettingsNavSection(settingsNavMode, [
    { href: "/modules/mail/permissions", label: "สิทธิ์การใช้งาน" },
    { href: "/modules/mail/groups", label: "กลุ่มบุคลากร" },
  ]);

  const sections: ModuleNavSectionDef[] = [
    ...(settingsSection ? [settingsSection] : []),
    {
      title: "ไปรษณีย์",
      links: [
        {
          label: "ทะเบียนรับ",
          children: [
            {
              href: "/modules/mail/inbox",
              label: "ทะเบียนจดหมายรับมา",
              exact: true,
            },
          ],
        },
        {
          label: "ทะเบียนส่ง",
          children: [
            {
              href: "/modules/mail/sent",
              label: "ทะเบียนจดหมายส่งไป",
              exact: true,
            },
          ],
        },
        {
          href: "/modules/mail/new",
          label: "เขียนจดหมาย",
          visible: canWrite,
        },
        {
          label: "คู่มือ",
          children: [
            {
              href: "/modules/mail/manual",
              label: "คู่มือไปรษณีย์",
              exact: true,
            },
          ],
        },
      ],
    },
  ];

  return <ModuleNav ariaLabel="เมนูไปรษณีย์" sections={sections} />;
}
