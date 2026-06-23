"use client";

import {
  ModuleNav,
  type ModuleNavSectionDef,
} from "@/components/app-shell/module-nav";

export function AchievementNav({
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
        { href: "/modules/achievement/permissions", label: "สิทธิ์การใช้งาน" },
      ],
    },
    {
      title: "ผลสัมฤทธิ์",
      links: [
        { href: "/modules/achievement/scores", label: "คะแนนผลสัมฤทธิ์" },
        {
          href: "/modules/achievement/scores/new",
          label: "บันทึกคะแนน",
          visible: canWrite,
        },
      ],
    },
  ];

  return <ModuleNav ariaLabel="เมนูผลสัมฤทธิ์" sections={sections} />;
}
