"use client";

import {
  ModuleNav,
  type ModuleNavSectionDef,
} from "@/components/app-shell/module-nav";

export function AlertNav() {
  const sections: ModuleNavSectionDef[] = [
    {
      title: "แจ้งเตือน",
      links: [
        {
          href: "/modules/alert",
          label: "แจ้งเตือน",
          exact: true,
        },
      ],
    },
  ];

  return <ModuleNav ariaLabel="เมนูแจ้งเตือน" sections={sections} />;
}
