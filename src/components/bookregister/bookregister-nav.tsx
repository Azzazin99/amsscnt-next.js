"use client";

import { buildModuleSettingsNavSection } from "@/components/app-shell/module-settings-nav-section";
import {
  ModuleNav,
  type ModuleNavLinkDef,
  type ModuleNavSectionDef,
} from "@/components/app-shell/module-nav";
import type { ModuleSettingsNavMode } from "@/lib/core/permissions";

type BookregisterNavProps = {
  settingsNavMode: ModuleSettingsNavMode;
  scopeKind?: "district" | "school";
  canViewSchoolSettings?: boolean;
};

function districtSettingsSection(
  settingsNavMode: ModuleSettingsNavMode,
): ModuleNavSectionDef | null {
  return buildModuleSettingsNavSection(settingsNavMode, [
    {
      label: "เมนูตั้งค่า",
      children: [
        {
          href: "/modules/bookregister/permissions",
          label: "กำหนดเจ้าหน้าที่",
        },
        {
          href: "/modules/bookregister/years",
          label: "กำหนดปีปฏิทิน",
        },
        {
          href: "/modules/bookregister/office-no",
          label: "กำหนดเลขที่หนังสือ",
        },
        {
          href: "/modules/bookregister/certificate-sign",
          label: "กำหนดผู้ลงนามเกียรติบัตร",
        },
        {
          href: "/modules/bookregister/certificate-audit-officers",
          label: "กำหนดผู้ตรวจสอบการลงทะเบียนเกียรติบัตร",
        },
      ],
    },
  ]);
}

function schoolSettingsSection(): ModuleNavSectionDef {
  return {
    title: "ตั้งค่าระบบ (ร.ร.)",
    links: [
      {
        label: "เมนูตั้งค่า",
        children: [
          {
            href: "/modules/bookregister/school/permissions",
            label: "กำหนดเจ้าหน้าที่",
          },
          {
            href: "/modules/bookregister/school/years",
            label: "กำหนดปีปฏิทิน",
          },
          {
            href: "/modules/bookregister/school/office-no",
            label: "กำหนดเลขที่หนังสือ",
          },
        ],
      },
    ],
  };
}

function districtRegisterLinks(): ModuleNavLinkDef[] {
  return [
    {
      label: "ทะเบียนหนังสือรับ",
      children: [
        {
          href: "/modules/bookregister/receive",
          label: "ทะเบียนหนังสือรับ",
        },
      ],
    },
    {
      label: "ทะเบียนหนังสือส่ง",
      children: [
        {
          href: "/modules/bookregister/send",
          label: "ทะเบียนหนังสือส่ง",
        },
      ],
    },
    {
      label: "ทะเบียนคำสั่ง",
      children: [
        {
          href: "/modules/bookregister/command",
          label: "ทะเบียนคำสั่ง",
        },
      ],
    },
    {
      label: "ทะเบียนเกียรติบัตร",
      children: [
        {
          href: "/modules/bookregister/certificate",
          label: "ทะเบียนเกียรติบัตร",
        },
        {
          href: "/modules/bookregister/certificate-officer",
          label: "เจ้าหน้าที่ทะเบียนเกียรติบัตร",
        },
      ],
    },
  ];
}

function schoolRegisterLinks(): ModuleNavLinkDef[] {
  return [
    {
      label: "ทะเบียนหนังสือรับ",
      children: [
        {
          href: "/modules/bookregister/receive",
          label: "ทะเบียนหนังสือรับ",
        },
      ],
    },
    {
      label: "ทะเบียนหนังสือส่ง",
      children: [
        {
          href: "/modules/bookregister/send",
          label: "ทะเบียนหนังสือส่ง",
        },
      ],
    },
    {
      label: "ทะเบียนคำสั่ง",
      children: [
        {
          href: "/modules/bookregister/school/command",
          label: "ทะเบียนคำสั่ง",
        },
      ],
    },
    {
      label: "ทะเบียนเกียรติบัตร",
      children: [
        {
          href: "/modules/bookregister/school/certificate",
          label: "ทะเบียนเกียรติบัตร",
        },
        {
          href: "/modules/bookregister/certificate-school-print",
          label: "เกียรติบัตร สพท.",
        },
      ],
    },
  ];
}

function manualLinks(): ModuleNavLinkDef[] {
  return [
    {
      label: "คู่มือ",
      children: [
        {
          href: "/modules/bookregister/manual",
          label: "คู่มือทะเบียนหนังสือราชการ",
          exact: true,
        },
      ],
    },
  ];
}

export function BookregisterNav({
  settingsNavMode,
  scopeKind,
  canViewSchoolSettings = false,
}: BookregisterNavProps) {
  const sections: ModuleNavSectionDef[] = [];

  if (scopeKind === "district") {
    const settings = districtSettingsSection(settingsNavMode);
    if (settings) sections.push(settings);
  }

  if (scopeKind === "school" && canViewSchoolSettings) {
    sections.push(schoolSettingsSection());
  }

  if (scopeKind) {
    sections.push({
      links:
        scopeKind === "school"
          ? schoolRegisterLinks()
          : districtRegisterLinks(),
    });
  }

  sections.push({ links: manualLinks() });

  return <ModuleNav ariaLabel="เมนูทะเบียนหนังสือ" sections={sections} />;
}
