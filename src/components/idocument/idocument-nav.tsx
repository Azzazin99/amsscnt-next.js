"use client";

import {
  ModuleNav,
  type ModuleNavSectionDef,
} from "@/components/app-shell/module-nav";

type IdocumentNavProps = {
  canWrite: boolean;
  canViewInbox: boolean;
};

export function IdocumentNav({
  canWrite,
  canViewInbox,
}: IdocumentNavProps) {
  const sections: ModuleNavSectionDef[] = [
    {
      title: "บันทึกเสนอ",
      links: [
        {
          href: "/modules/idocument",
          label: "รายการบันทึกเสนอ",
          exact: true,
        },
        {
          href: "/modules/idocument/new",
          label: "เพิ่มบันทึกเสนอ",
          visible: canWrite,
        },
      ],
    },
    {
      title: "ลงความเห็น/สั่งการ",
      visible: canViewInbox,
      links: [
        {
          href: "/modules/idocument/inbox",
          label: "ลงความเห็น/สั่งการ",
          exact: true,
        },
      ],
    },
    {
      title: "รายงาน",
      links: [
        {
          href: "/modules/idocument/reports",
          label: "บันทึกข้อความทั้งหมด",
          exact: true,
        },
      ],
    },
  ];

  return <ModuleNav ariaLabel="เมนูบันทึกข้อความ" sections={sections} />;
}
