"use client";

import {
  ModuleNav,
  type ModuleNavSectionDef,
} from "@/components/app-shell/module-nav";

type NewsNavProps = {
  canWrite: boolean;
  showAdmin: boolean;
};

export function NewsNav({ canWrite, showAdmin }: NewsNavProps) {
  const sections: ModuleNavSectionDef[] = [
    {
      title: "ตั้งค่าระบบ",
      visible: showAdmin,
      links: [
        { href: "/modules/news/permissions", label: "สิทธิ์การใช้งาน" },
        { href: "/modules/news/mainitems", label: "ชื่อเรื่อง" },
        { href: "/modules/news/sections", label: "ประเภทข่าว" },
      ],
    },
    {
      title: "ข่าว",
      links: [
        { href: "/modules/news", label: "บันทึกข่าว", exact: true },
        {
          href: "/modules/news/new",
          label: "เพิ่มข่าว",
          visible: canWrite,
        },
      ],
    },
  ];

  return <ModuleNav ariaLabel="เมนูข่าว" sections={sections} />;
}
