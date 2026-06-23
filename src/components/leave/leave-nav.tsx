"use client";

import {
  ModuleNav,
  type ModuleNavSectionDef,
} from "@/components/app-shell/module-nav";
import { listVisibleLeaveReportOptions } from "@/lib/leave/report-nav";

type LeaveApprovalNavItem = {
  href: string;
  label: string;
};

type LeaveNavProps = {
  showAdmin: boolean;
  scopeKind: "district" | "school";
  isPrincipalViewer: boolean;
  approvalItems: LeaveApprovalNavItem[];
};

export function LeaveNav({
  showAdmin,
  scopeKind,
  isPrincipalViewer,
  approvalItems,
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

  const sections: ModuleNavSectionDef[] = [
    {
      title: "ตั้งค่าระบบ",
      visible: showAdmin,
      links: [
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
      ],
    },
    {
      links: [
        {
          label: "ขออนุญาตลา",
          children: [
            {
              href: "/modules/leave/requests",
              label: "บันทึกขออนุญาตลา",
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
          children: [
            { href: "/modules/leave/cancellations", label: "ขอยกเลิกวันลา" },
            {
              href: "/modules/leave/cancellations/approvals/group",
              label: "ผอ.กลุ่ม",
            },
            {
              href: "/modules/leave/cancellations/approvals/group2",
              label: "รอง ผอ.สพท.",
            },
            {
              href: "/modules/leave/cancellations/approvals/commander",
              label: "ผอ.สพท. (โรงเรียน)",
            },
          ],
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
