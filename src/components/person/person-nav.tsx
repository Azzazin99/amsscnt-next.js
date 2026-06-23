"use client";

import {
  ModuleNav,
  type ModuleNavSectionDef,
} from "@/components/app-shell/module-nav";

type PersonNavProps = {
  showPermissions: boolean;
};

export function PersonNav({ showPermissions }: PersonNavProps) {
  const sections: ModuleNavSectionDef[] = [
    {
      title: "ตั้งค่าระบบ",
      visible: showPermissions,
      links: [
        { href: "/modules/person/permissions", label: "สิทธิ์การใช้งาน" },
      ],
    },
    {
      title: "บุคลากร",
      links: [{ href: "/modules/person/staff", label: "รายชื่อบุคลากร" }],
    },
  ];

  return <ModuleNav ariaLabel="เมนูบุคลากร" sections={sections} />;
}
