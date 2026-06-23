"use client";

import {
  ModuleNav,
  type ModuleNavSectionDef,
} from "@/components/app-shell/module-nav";

type AffairNavProps = {
  canWrite: boolean;
  showAdmin: boolean;
};

export function AffairNav({ canWrite, showAdmin }: AffairNavProps) {
  const sections: ModuleNavSectionDef[] = [
    {
      title: "ตั้งค่าระบบ",
      visible: showAdmin,
      links: [
        { href: "/modules/affair/permissions", label: "สิทธิ์การใช้งาน" },
      ],
    },
    {
      title: "ภารกิจผู้บริหาร",
      links: [
        {
          href: "/modules/affair",
          label: "ภารกิจผู้บริหาร",
          exact: true,
        },
        {
          href: "/modules/affair/new",
          label: "บันทึกภารกิจ",
          visible: canWrite,
        },
      ],
    },
  ];

  return <ModuleNav ariaLabel="เมนูภารกิจผู้บริหาร" sections={sections} />;
}
