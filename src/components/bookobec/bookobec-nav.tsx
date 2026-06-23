"use client";

import {
  ModuleNav,
  type ModuleNavSectionDef,
} from "@/components/app-shell/module-nav";

export function BookobecNav() {
  const sections: ModuleNavSectionDef[] = [
    {
      title: "สพฐ.",
      links: [
        {
          label: "รายการหนังสือรับ",
          children: [
            {
              href: "/modules/bookobec/inbox",
              label: "รายการหนังสือรับ สพฐ.",
              exact: true,
            },
          ],
        },
        {
          label: "รายการหนังสือส่ง",
          children: [
            {
              href: "/modules/bookobec/sent",
              label: "รายการหนังสือส่ง สพฐ.",
              exact: true,
            },
          ],
        },
        {
          label: "คู่มือ",
          children: [
            {
              href: "/modules/bookobec/manual",
              label: "คู่มือรับส่งหนังสือราชการ สพฐ.",
              exact: true,
            },
          ],
        },
      ],
    },
  ];

  return <ModuleNav ariaLabel="เมนูรับส่งหนังสือราชการ สพฐ." sections={sections} />;
}
