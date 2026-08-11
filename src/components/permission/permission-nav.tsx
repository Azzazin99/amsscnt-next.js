"use client";

import { buildModuleSettingsNavSection } from "@/components/app-shell/module-settings-nav-section";
import {
  ModuleNav,
  type ModuleNavSectionDef,
} from "@/components/app-shell/module-nav";
import type { ModuleSettingsNavMode } from "@/lib/core/permissions";

type PermissionNavProps = {
  settingsNavMode: ModuleSettingsNavMode;
  canWrite: boolean;
  showBasicInbox: boolean;
  showGrantInbox: boolean;
};

export function PermissionNav({
  settingsNavMode,
  canWrite,
  showBasicInbox,
  showGrantInbox,
}: PermissionNavProps) {
  const requestChildren = [
    {
      href: "/modules/permission/requests",
      label: "บันทึกขออนุญาตไปราชการ",
      visible: canWrite,
    },
    {
      href: "/modules/permission/approvals/basic",
      label: "ผู้บังคับบัญชาชั้นต้น",
      visible: showBasicInbox,
    },
    {
      href: "/modules/permission/approvals/grant",
      label: "ผู้บังคับบัญชา (ผู้อนุมัติ)",
      visible: showGrantInbox,
    },
  ].filter((item) => item.visible !== false);

  const settingsSection = buildModuleSettingsNavSection(settingsNavMode, [
    {
      label: "เมนูตั้งค่า",
      children: [
        { href: "/modules/permission/years", label: "ปีงบประมาณ" },
        { href: "/modules/permission/permissions", label: "สิทธิ์การใช้งาน" },
        {
          href: "/modules/permission/grant-persons",
          label: "กำหนดผู้อนุมัติ",
        },
      ],
    },
  ]);

  const sections: ModuleNavSectionDef[] = [
    ...(settingsSection ? [settingsSection] : []),
    {
      links: [
        {
          label: "ขออนุญาตไปราชการ",
          children: requestChildren,
        },
      ],
    },
    {
      links: [
        {
          label: "รายงาน",
          children: [
            {
              href: "/modules/permission/reports/today",
              label: "ขออนุญาตฯวันนี้",
            },
            {
              href: "/modules/permission/reports/all",
              label: "ขออนุญาตฯทั้งหมด",
            },
            {
              href: "/modules/permission/reports/print",
              label: "พิมพ์การขออนุมัติฯ",
            },
          ],
        },
      ],
    },
    {
      links: [
        {
          label: "คู่มือ",
          children: [
            {
              href: "/modules/permission/manual",
              label: "คู่มือการขออนุญาตไปราชการ",
            },
          ],
        },
      ],
    },
  ];

  return (
    <ModuleNav ariaLabel="เมนูขออนุญาตไปราชการ" sections={sections} />
  );
}
