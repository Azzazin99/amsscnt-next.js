"use client";

import {
  ModuleNav,
  type ModuleNavSectionDef,
} from "@/components/app-shell/module-nav";

type MeetingNavProps = {
  canWrite: boolean;
  showAdmin: boolean;
};

export function MeetingNav({ canWrite, showAdmin }: MeetingNavProps) {
  const sections: ModuleNavSectionDef[] = [
    {
      title: "ตั้งค่าระบบ",
      visible: showAdmin,
      links: [
        { href: "/modules/meeting/permissions", label: "สิทธิ์เจ้าหน้าที่" },
        { href: "/modules/meeting/rooms", label: "กำหนดห้อง" },
      ],
    },
    {
      title: "จองห้องประชุม",
      links: [
        { href: "/modules/meeting/bookings", label: "ทะเบียนจอง" },
        {
          href: "/modules/meeting/bookings/new",
          label: "จองห้องประชุม",
          visible: canWrite,
        },
        { href: "/modules/meeting/calendar", label: "ปฏิทิน (รายวัน)" },
      ],
    },
  ];

  return <ModuleNav ariaLabel="เมนูจองห้องประชุม" sections={sections} />;
}
