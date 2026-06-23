"use client";

import {
  ModuleNav,
  type ModuleNavSectionDef,
} from "@/components/app-shell/module-nav";

export function QuestionnaireNav() {
  const sections: ModuleNavSectionDef[] = [
    {
      title: "แบบสอบถาม",
      links: [
        {
          href: "/modules/questionnaire",
          label: "แบบสอบถาม",
          exact: true,
        },
      ],
    },
  ];

  return <ModuleNav ariaLabel="เมนูแบบสอบถาม" sections={sections} />;
}
