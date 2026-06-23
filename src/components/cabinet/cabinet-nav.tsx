"use client";

import {
  ModuleNav,
  type ModuleNavSectionDef,
} from "@/components/app-shell/module-nav";

type CabinetNavProps = {
  canUpload: boolean;
  showAdmin: boolean;
};

export function CabinetNav({ canUpload, showAdmin }: CabinetNavProps) {
  const sections: ModuleNavSectionDef[] = [
    {
      title: "ตั้งค่าระบบ",
      visible: showAdmin,
      links: [
        { href: "/modules/cabinet/permissions", label: "สิทธิ์การใช้งาน" },
      ],
    },
    {
      title: "ตู้เอกสาร",
      links: [
        { href: "/modules/cabinet", label: "เอกสารตู้กลาง", exact: true },
        {
          href: "/modules/cabinet/upload",
          label: "อัปโหลดเอกสาร",
          visible: canUpload,
        },
      ],
    },
  ];

  return <ModuleNav ariaLabel="เมนูตู้เอกสาร" sections={sections} />;
}
