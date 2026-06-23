"use client";

import {
  ModuleNav,
  type ModuleNavSectionDef,
} from "@/components/app-shell/module-nav";

export function StudentMainNav({
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
        { href: "/modules/student_main/years", label: "ปีการศึกษา" },
        { href: "/modules/student_main/permissions", label: "สิทธิ์การใช้งาน" },
      ],
    },
    {
      title: "ข้อมูลนักเรียน",
      links: [
        { href: "/modules/student_main/students", label: "รายชื่อนักเรียน" },
        {
          href: "/modules/student_main/students/new",
          label: "เพิ่มนักเรียน",
          visible: canWrite,
        },
      ],
    },
  ];

  return <ModuleNav ariaLabel="เมนูข้อมูลนักเรียน" sections={sections} />;
}
