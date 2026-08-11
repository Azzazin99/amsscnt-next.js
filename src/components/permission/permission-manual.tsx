import Link from "next/link";

type ManualLink = {
  href: string;
  label: string;
  note?: string;
};

type ManualSection = {
  id: string;
  title: string;
  intro?: string;
  links?: ManualLink[];
  bullets?: string[];
};

const MANUAL_SECTIONS: ManualSection[] = [
  {
    id: "overview",
    title: "ภาพรวม",
    intro:
      "ระบบบันทึกขออนุญาตไปราชการ ทะเบียนคำขอ พิจารณาอนุมัติ 2 ขั้น และรายงานสำหรับบุคลากร สพป.ชัยนาท",
    bullets: [
      "เมนูหลักเปิดด้วยการชี้เมาส์ (hover) ที่หัวข้อ — คลิกหัวข้อไม่นำทาง",
      "วันที่บนหน้าจอแสดงเป็น พ.ศ. ระบบเก็บข้อมูลเป็น ค.ศ.",
      "ขั้นตอน: ยื่นคำขอ → ผู้บังคับบัญชาชั้นต้นเห็นชอบ → ผู้อนุมัติขั้นสุดท้าย",
    ],
  },
  {
    id: "request",
    title: "ขออนุญาตไปราชการ",
    links: [
      {
        href: "/modules/permission/requests",
        label: "บันทึกขออนุญาตไปราชการ",
        note: "ระบุเรื่อง สถานที่ ช่วงวันไปราชการ และข้อมูลเสริม (พาหนะ เอกสาร)",
      },
      {
        href: "/modules/permission/approvals/basic",
        label: "ผู้บังคับบัญชาชั้นต้น",
        note: "คิวคำขอรอความเห็นชั้นต้น — แสดงเมื่อผู้ใช้ถูกกำหนดเป็นผู้บังคับบัญชาชั้นต้น",
      },
      {
        href: "/modules/permission/approvals/grant",
        label: "ผู้บังคับบัญชา (ผู้อนุมัติ)",
        note: "คิวคำขอที่เห็นชอบแล้ว รออนุมัติขั้นสุดท้าย",
      },
    ],
  },
  {
    id: "reports",
    title: "รายงาน",
    links: [
      {
        href: "/modules/permission/reports/today",
        label: "ขออนุญาตฯวันนี้",
        note: "รายการที่ช่วงไปราชการครอบคลุมวันนี้",
      },
      {
        href: "/modules/permission/reports/all",
        label: "ขออนุญาตฯทั้งหมด",
      },
      {
        href: "/modules/permission/reports/print",
        label: "พิมพ์การขออนุญาตฯ",
        note: "รายการคำขอของตนเองทั้งหมด — พิมพ์หรือบันทึก PDF",
      },
    ],
  },
  {
    id: "settings",
    title: "ตั้งค่าระบบ (ผู้ดูแล)",
    links: [
      { href: "/modules/permission/years", label: "ปีงบประมาณ" },
      { href: "/modules/permission/permissions", label: "สิทธิ์การใช้งาน" },
      {
        href: "/modules/permission/grant-persons",
        label: "กำหนดผู้อนุมัติ",
        note: "กำหนดผู้บังคับบัญชาชั้นต้นและผู้อนุมัติต่อผู้ขอ",
      },
    ],
  },
];

export function PermissionManual() {
  return (
    <article className="mx-auto max-w-3xl space-y-8">
      <header>
        <h2 className="text-lg font-semibold text-primary">
          คู่มือการขออนุญาตไปราชการ
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          สรุปเมนูและขั้นตอนใช้งานโมดูลขออนุญาตไปราชการ สพป.ชัยนาท
        </p>
      </header>

      {MANUAL_SECTIONS.map((section) => (
        <section key={section.id} id={section.id} className="space-y-3">
          <h3 className="text-base font-semibold">{section.title}</h3>
          {section.intro ? (
            <p className="text-sm text-muted-foreground">{section.intro}</p>
          ) : null}
          {section.bullets ? (
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {section.bullets.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
          {section.links ? (
            <ul className="space-y-2 text-sm">
              {section.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-medium text-primary hover:underline"
                  >
                    {link.label}
                  </Link>
                  {link.note ? (
                    <span className="text-muted-foreground"> — {link.note}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}
    </article>
  );
}
