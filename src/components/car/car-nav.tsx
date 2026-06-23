"use client";

import {
  ModuleNav,
  type ModuleNavSectionDef,
} from "@/components/app-shell/module-nav";

type CarNavProps = {
  canWrite: boolean;
  showAdmin: boolean;
};

export function CarNav({ canWrite, showAdmin }: CarNavProps) {
  const sections: ModuleNavSectionDef[] = [
    {
      title: "ตั้งค่าระบบ",
      visible: showAdmin,
      links: [
        { href: "/modules/car/permissions", label: "สิทธิ์การใช้งาน" },
        { href: "/modules/car/types", label: "ประเภทรถ" },
        { href: "/modules/car/vehicles", label: "ยานพาหนะ" },
        { href: "/modules/car/drivers", label: "พนักงานขับรถ" },
      ],
    },
    {
      title: "ขอใช้รถ",
      links: [
        { href: "/modules/car/requests", label: "คำขอใช้รถ" },
        {
          href: "/modules/car/requests/new",
          label: "ขอใช้รถใหม่",
          visible: canWrite,
        },
      ],
    },
  ];

  return <ModuleNav ariaLabel="เมนูระบบยานพาหนะ" sections={sections} />;
}
