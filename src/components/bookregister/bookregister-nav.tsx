"use client";

import {
  ModuleNav,
  type ModuleNavSectionDef,
} from "@/components/app-shell/module-nav";

const DISTRICT_SETTINGS_LINKS = [
  { href: "/modules/bookregister/years", label: "กำหนดปีปฏิทิน" },
  { href: "/modules/bookregister/permissions", label: "กำหนดเจ้าหน้าที่" },
  { href: "/modules/bookregister/office-no", label: "กำหนดเลขที่หนังสือ" },
] as const;

const REGISTER_LINKS = [
  { href: "/modules/bookregister/receive", label: "ทะเบียนรับ" },
  { href: "/modules/bookregister/send", label: "ทะเบียนส่ง" },
  { href: "/modules/bookregister/command", label: "ทะเบียนคำสั่ง" },
  { href: "/modules/bookregister/certificate", label: "ทะเบียนเกียรติบัตร" },
  { href: "/modules/bookregister/reports", label: "แบบพิมพ์/รายงาน" },
] as const;

const SCHOOL_REGISTER_LINKS = [
  { href: "/modules/bookregister/receive", label: "ทะเบียนรับ" },
  { href: "/modules/bookregister/send", label: "ทะเบียนส่ง" },
  { href: "/modules/bookregister/reports", label: "แบบพิมพ์/รายงาน" },
] as const;

type BookregisterNavProps = {
  showDistrictSettings: boolean;
  scopeKind?: "district" | "school";
};

export function BookregisterNav({
  showDistrictSettings,
  scopeKind,
}: BookregisterNavProps) {
  const registerLinks =
    scopeKind === "school" ? SCHOOL_REGISTER_LINKS : REGISTER_LINKS;

  const sections: ModuleNavSectionDef[] = [
    {
      title: "ตั้งค่าระบบ",
      visible: showDistrictSettings,
      links: [...DISTRICT_SETTINGS_LINKS],
    },
    {
      title: "ทะเบียนหนังสือ",
      visible: Boolean(scopeKind),
      links: [...registerLinks],
    },
  ];

  return <ModuleNav ariaLabel="เมนูทะเบียนหนังสือ" sections={sections} />;
}
