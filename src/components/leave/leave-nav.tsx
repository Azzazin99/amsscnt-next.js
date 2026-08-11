"use client";

import { buildModuleSettingsNavSection } from "@/components/app-shell/module-settings-nav-section";
import {
  ModuleNav,
  type ModuleNavSectionDef,
} from "@/components/app-shell/module-nav";
import type { ModuleSettingsNavMode } from "@/lib/core/permissions";
import { listVisibleLeaveReportOptions } from "@/lib/leave/report-nav";

type LeaveApprovalNavItem = {
  href: string;
  label: string;
};

type LeaveNavProps = {
  settingsNavMode: ModuleSettingsNavMode;
  scopeKind: "district" | "school";
  isPrincipalViewer: boolean;
  approvalItems: LeaveApprovalNavItem[];
  cancellationApprovalItems: LeaveApprovalNavItem[];
};

export function LeaveNav({
  settingsNavMode,
  scopeKind,
  isPrincipalViewer,
  approvalItems,
  cancellationApprovalItems,
}: LeaveNavProps) {
  const navOpts = { scopeKind, isPrincipalViewer };

  const reportChildren = listVisibleLeaveReportOptions(navOpts).map(
    (option) => ({
      href: option.href,
      label: option.label,
    }),
  );

  const approvalChildren = approvalItems.map((item) => ({
    href: item.href,
    label: item.label,
  }));

  const cancellationChildren = [
    { href: "/modules/leave/cancellations", label: "ขอยกเลิกวันลา" },
    ...cancellationApprovalItems.map((item) => ({
      href: item.href,
      label: item.label,
    })),
  ];

  const settingsSection = buildModuleSettingsNavSection(settingsNavMode, [
    {
      label: "เมนูตั้งค่า",
      children: [
        { href: "/modules/leave/years", label: "กำหนดปีงบประมาณ" },
        { href: "/modules/leave/permissions", label: "กำหนดเจ้าหน้าที่" },
        {
          href: "/modules/leave/grant-persons",
          label: "กำหนดผู้อนุมัติ (สพท.)",
        },
        {
          href: "/modules/leave/school-grant-persons",
          label: "กำหนดผู้อนุมัติ (รร.)",
        },
        { href: "/modules/leave/collection", label: "วันลาสะสม" },
      ],
    },
  ]);

  const sections: ModuleNavSectionDef[] = [
    ...(settingsSection ? [settingsSection] : []),
    {
      links: [
        {
          label: "ขออนุญาตลา",
          children: [
            {
              href: "/modules/leave/requests/new",
              label: "บันทึกขออนุญาตลา",
            },
            {
              href: "/modules/leave/requests",
              label: "ทะเบียนการลา",
            },
            {
              href: "/modules/leave/job-handover",
              label: "รับมอบงาน",
            },
          ],
        },
      ],
    },
    {
      links: [
        {
          label: "พิจารณาอนุมัติ",
          visible: approvalChildren.length > 0,
          children: approvalChildren,
        },
      ],
    },
    {
      links: [
        {
          label: "ขอยกเลิกวันลา",
          children: cancellationChildren,
        },
      ],
    },
    {
      links: [
        {
          label: "รายงาน",
          children: reportChildren,
        },
      ],
    },
    {
      links: [
        {
          label: "คู่มือ",
          children: [
            { href: "/modules/leave/manual", label: "คู่มือการลา" },
          ],
        },
      ],
    },
  ];

  return <ModuleNav ariaLabel="เมนูระบบการลา" sections={sections} />;
}
