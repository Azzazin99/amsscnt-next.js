"use client";

import {
  ModuleNav,
  type ModuleNavSectionDef,
} from "@/components/app-shell/module-nav";

type PermissionNavProps = {
  canWrite: boolean;
  showAdmin: boolean;
};

export function PermissionNav({ canWrite, showAdmin }: PermissionNavProps) {
  const sections: ModuleNavSectionDef[] = [
    {
      title: "ตั้งค่าระบบ",
      visible: showAdmin,
      links: [
        { href: "/modules/permission/years", label: "ปีงบประมาณ" },
        { href: "/modules/permission/permissions", label: "สิทธิ์การใช้งาน" },
      ],
    },
    {
      title: "ทะเบียนไปราชการ(ส่วนบุคคล)",
      links: [
        { href: "/modules/permission/requests", label: "คำขอไปราชการ" },
        {
          href: "/modules/permission/requests/new",
          label: "ยื่นคำขอ",
          visible: canWrite,
        },
      ],
    },
  ];

  return (
    <ModuleNav ariaLabel="เมนูขออนุญาตไปราชการ" sections={sections} />
  );
}
