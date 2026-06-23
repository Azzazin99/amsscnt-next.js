"use client";

import {
  ModuleNav,
  type ModuleNavSectionDef,
} from "@/components/app-shell/module-nav";

export function SpacialStudentNav({
  canWrite,
  showAdmin,
}: {
  canWrite: boolean;
  showAdmin: boolean;
}) {
  const sections: ModuleNavSectionDef[] = [
    {
      title: "ตั้งค่าระบบ",
      visible: showAdmin,
      links: [
        {
          href: "/modules/spacial_student/permissions",
          label: "สิทธิ์การใช้งาน",
        },
      ],
    },
    {
      title: "นักเรียนพิเศษ",
      links: [
        { href: "/modules/spacial_student/students", label: "นักเรียนพิเศษ" },
        {
          href: "/modules/spacial_student/students/new",
          label: "เพิ่มรายการ",
          visible: canWrite,
        },
      ],
    },
  ];

  return <ModuleNav ariaLabel="เมนูนักเรียนพิเศษ" sections={sections} />;
}
