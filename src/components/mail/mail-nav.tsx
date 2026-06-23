"use client";

import {
  ModuleNav,
  type ModuleNavSectionDef,
} from "@/components/app-shell/module-nav";

type MailNavProps = {
  canWrite: boolean;
  showAdmin: boolean;
};

export function MailNav({ canWrite, showAdmin }: MailNavProps) {
  const sections: ModuleNavSectionDef[] = [
    {
      title: "ตั้งค่าระบบ",
      visible: showAdmin,
      links: [
        { href: "/modules/mail/permissions", label: "สิทธิ์การใช้งาน" },
        { href: "/modules/mail/groups", label: "กลุ่มบุคลากร" },
      ],
    },
    {
      title: "ไปรษณีย์",
      links: [
        { href: "/modules/mail", label: "รายการหลัก", exact: true },
        {
          label: "ทะเบียนรับ",
          children: [
            {
              href: "/modules/mail/inbox",
              label: "ทะเบียนจดหมายรับมา",
              exact: true,
            },
          ],
        },
        {
          label: "ทะเบียนส่ง",
          children: [
            {
              href: "/modules/mail/sent",
              label: "ทะเบียนจดหมายส่งไป",
              exact: true,
            },
          ],
        },
        {
          href: "/modules/mail/new",
          label: "เขียนจดหมาย",
          visible: canWrite,
        },
        {
          label: "คู่มือ",
          children: [
            {
              href: "/modules/mail/manual",
              label: "คู่มือไปรษณีย์",
              exact: true,
            },
          ],
        },
      ],
    },
  ];

  return <ModuleNav ariaLabel="เมนูไปรษณีย์" sections={sections} />;
}
