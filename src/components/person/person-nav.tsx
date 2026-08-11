"use client";

import { buildModuleSettingsNavSection } from "@/components/app-shell/module-settings-nav-section";
import {
  ModuleNav,
  type ModuleNavSectionDef,
} from "@/components/app-shell/module-nav";
import type { ModuleSettingsNavMode } from "@/lib/core/permissions";

type PersonNavProps = {
  settingsNavMode: ModuleSettingsNavMode;
};

export function PersonNav({ settingsNavMode }: PersonNavProps) {
  const settingsSection = buildModuleSettingsNavSection(settingsNavMode, [
    {
      label: "เมนูตั้งค่า",
      children: [
        {
          href: "/modules/person/settings/sys-admin",
          label: "เจ้าหน้าที่ระบบข้อมูลพื้นฐานครูและบุคลากร",
        },
        {
          href: "/modules/person/settings/district-positions",
          label: "กำหนดตำแหน่งครูและบุคลากรใน สพท.",
        },
        {
          href: "/modules/person/settings/school-positions",
          label: "กำหนดตำแหน่งครูและบุคลากรในสถานศึกษา",
        },
        {
          href: "/modules/person/settings/import-district-text",
          label: "นำเข้าข้อมูลครูและบุคลากรใน สพท. จาก Text File",
        },
        {
          href: "/modules/person/settings/import-school-text",
          label: "นำเข้าข้อมูลครูและบุคลากรในสถานศึกษา จาก Text File",
        },
        {
          href: "/modules/person/settings/import-birthdate-text",
          label: "นำเข้าข้อมูลวันเดือนปีเกิด จาก Text File",
        },
        {
          href: "/modules/person/settings/district-signatures",
          label: "ลายเซ็นบุคลากร สพท.",
        },
        {
          href: "/admin/schools",
          label: "ชื่อและรหัสสถานศึกษา",
        },
      ],
    },
  ]);

  const sections: ModuleNavSectionDef[] = [
    ...(settingsSection ? [settingsSection] : []),
    {
      title: "ครูและบุคลากรปัจจุบัน",
      links: [
        {
          label: "ครูและบุคลากรปัจจุบัน",
          children: [
            {
              href: "/modules/person/staff?org=district",
              label: "ครูและบุคลากร สพท.",
            },
            {
              href: "/modules/person/staff?org=school",
              label: "ครูและบุคลากร สถานศึกษา",
            },
            {
              href: "/modules/person/staff?status=pending",
              label: "ครูและบุคลากร สถานศึกษารอการรับรอง",
            },
            {
              href: "/modules/person/staff?filter=multi-school",
              label: "บุคลากรในสถานศึกษาปฏิบัติงานมากกว่า 1 แห่ง",
            },
            {
              href: "/modules/person/staff?filter=acting-director",
              label: "รักษาการในตำแหน่ง ผอ.รร.",
            },
            {
              href: "/modules/person/settings/import-school-text",
              label: "เรียกข้อมูลจากSMSS",
            },
          ],
        },
      ],
    },
    {
      title: "ครูและบุคลากรพ้นสภาพ",
      links: [
        {
          label: "ครูและบุคลากรพ้นสภาพ",
          children: [
            {
              href: "/modules/person/staff?status=inactive&org=district",
              label: "ครูและบุคลากรพ้นสภาพ สพท.",
            },
            {
              href: "/modules/person/staff?status=inactive&org=school",
              label: "ครูและบุคลากรพ้นสภาพ สถานศึกษา",
            },
          ],
        },
      ],
    },
  ];

  return <ModuleNav ariaLabel="เมนูบุคลากร" sections={sections} />;
}

