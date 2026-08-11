import Link from "next/link";
import { STANDARD_ATTACHMENT_TYPES_LABEL } from "@/lib/form/attachment-allowed-types";
import { LEAVE_TYPE_OPTIONS } from "@/lib/leave/regulation/types";

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
      "ระบบบันทึกขออนุญาตลา ทะเบียนคำขอ พิจารณาอนุมัติ ขอยกเลิกวันลา และรายงานสำหรับบุคลากร สพป.ชัยนาท ตามระเบียบสำนักนายกรัฐมนตรีว่าด้วยการลาของข้าราชการ พ.ศ. 2555",
    bullets: [
      "เมนูหลักเปิดด้วยการชี้เมาส์ (hover) ที่หัวข้อ — คลิกหัวข้อไม่นำทาง",
      "วันที่บนหน้าจอแสดงเป็น พ.ศ. ระบบเก็บข้อมูลเป็น ค.ศ.",
      "แก้ไขหรือลบคำขอได้ก่อนมีคำสั่งอนุมัติขั้นสุดท้าย",
    ],
  },
  {
    id: "request",
    title: "ขออนุญาตลา",
    intro: "สำหรับผู้ลา — ยื่นคำขอ ดูทะเบียนของตนเอง และรับมอบงาน",
    links: [
      {
        href: "/modules/leave/requests/new",
        label: "บันทึกขออนุญาตลา",
        note: "เลือกประเภทลา วันที่ เหตุผล และข้อมูลเสริม (ติดต่อ แนบไฟล์ มอบงาน) ในหน้าเดียว",
      },
      {
        href: "/modules/leave/requests",
        label: "ทะเบียนการลา",
        note: "รายการคำขอของผู้ใช้ที่ login — แก้ไข/ลบได้เมื่อยังไม่อนุมัติ",
      },
      {
        href: "/modules/leave/job-handover",
        label: "รับมอบงาน",
        note: "ผู้ที่ถูกมอบงานระหว่างลาเข้ามากดรับมอบที่นี่",
      },
    ],
  },
  {
    id: "approval",
    title: "พิจารณาอนุมัติ",
    intro:
      "ขั้นตอนหลัก: ผู้ลายื่น → ผอ.กลุ่มเห็นชอบ → ผู้อนุมัติขั้นสุดท้าย (บุคลากรเขตผ่าน รอง ผอ.สพท. · บุคลากรโรงเรียนผ่าน ผอ.สพท.) เมนูที่เห็นขึ้นกับสิทธิ์ของผู้ใช้",
    links: [
      {
        href: "/modules/leave/approvals/group",
        label: "ผอ.กลุ่ม",
      },
      {
        href: "/modules/leave/approvals/group2",
        label: "รอง ผอ.สพท. (บุคลากรเขต)",
      },
      {
        href: "/modules/leave/approvals/commander",
        label: "ผอ.สพท. (บุคลากรโรงเรียน)",
      },
    ],
    bullets: [
      "เปิดรายการจากคิว แล้วเข้าหน้ารายละเอียดเพื่ออนุมัติหรือไม่อนุมัติ",
      "การมอบงานไม่บล็อกขั้นอนุมัติ — แสดงสถานะอย่างเดียว",
    ],
  },
  {
    id: "cancellation",
    title: "ขอยกเลิกวันลา",
    intro: "ยกเลิกวันลาจากคำขอที่อนุมัติแล้ว — หนึ่งคำขอยกเลิกต่อหนึ่งคำขอลา",
    links: [
      { href: "/modules/leave/cancellations", label: "รายการขอยกเลิกวันลา" },
      { href: "/modules/leave/cancellations/new", label: "บันทึกขอยกเลิกวันลา" },
      {
        href: "/modules/leave/cancellations/approvals/group",
        label: "คิวยกเลิก — ผอ.กลุ่ม",
      },
      {
        href: "/modules/leave/cancellations/approvals/group2",
        label: "คิวยกเลิก — รอง ผอ.สพท. (เขต)",
      },
      {
        href: "/modules/leave/cancellations/approvals/commander",
        label: "คิวยกเลิก — ผอ.สพท. (โรงเรียน)",
      },
    ],
  },
  {
    id: "reports",
    title: "รายงาน",
    intro:
      "รายการในเมนูขึ้นกับสิทธิ์ (เขต / ผอ.โรงเรียน / บุคลากรทั่วไป) หากยังไม่มีปีงบประมาณ ระบบจะแนะนำไปตั้งค่าปีก่อน",
    links: [
      { href: "/modules/leave/reports/today", label: "ขออนุญาตลาวันนี้" },
      { href: "/modules/leave/reports/all", label: "ขออนุญาตลาทั้งหมด" },
      { href: "/modules/leave/reports/cancellations", label: "ขอยกเลิกวันลาทั้งหมด" },
      {
        href: "/modules/leave/reports/sick-privacy-birth",
        label: "สถิติลาป่วย กิจ คลอด",
      },
      { href: "/modules/leave/reports/vacation", label: "สถิติลาพักผ่อน" },
      {
        href: "/modules/leave/reports/school-principals",
        label: "สถิติการลา ผอ.โรงเรียน",
      },
    ],
  },
  {
    id: "admin",
    title: "ตั้งค่าระบบ",
    intro: "เฉพาะผู้ดูแลระบบ SMSS — เมนูอยู่ใต้หัวข้อ ตั้งค่าระบบ → เมนูตั้งค่า",
    links: [
      { href: "/modules/leave/years", label: "กำหนดปีงบประมาณ" },
      { href: "/modules/leave/permissions", label: "กำหนดเจ้าหน้าที่" },
      { href: "/modules/leave/grant-persons", label: "กำหนดผู้อนุมัติ (สพท.)" },
      {
        href: "/modules/leave/school-grant-persons",
        label: "กำหนดผู้อนุมัติ (รร.)",
      },
      { href: "/modules/leave/collection", label: "วันลาสะสม" },
    ],
  },
  {
    id: "form-tips",
    title: "ข้อควรทราบเมื่อยื่นคำขอ",
    bullets: [
      "ประเภทการลา 1–10 ตามระเบียบ 2555 — บางประเภทจำกัดตามเพศในระบบบุคลากร",
      "ลาครึ่งวัน: เลือกช่วงเช้าหรือบ่าย ระบบคำนวณ 0.5 วัน",
      "ลาป่วยและลาคลอดย้อนหลังได้ · ลากิจและลาพักผ่อนต้องล่วงหน้า",
      "เบอร์โทรติดต่อว่างได้ — ถ้ากรอกต้องเป็นมือถือไทย 10 หลัก (06, 08, 09)",
      `แนบไฟล์ ${STANDARD_ATTACHMENT_TYPES_LABEL} ได้ · ลาป่วยติดต่อกัน 30 วันขึ้นไปต้องแนบเอกสาร`,
      "ด้านข้างฟอร์ม (จอใหญ่) แสดงสิทธิคงเหลือและสรุปคำขอก่อนยื่น",
    ],
  },
];

const linkClassName =
  "font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export function LeaveManual() {
  return (
    <article className="max-w-3xl space-y-8">
      <header className="space-y-2">
        <h2 className="text-lg font-semibold text-primary">คู่มือการลา</h2>
        <p className="text-pretty text-sm text-muted-foreground">
          แนวทางใช้งานระบบการลา AMSS/SMSS สำหรับ สพป.ชัยนาท
        </p>
      </header>

      <nav
        aria-label="สารบัญคู่มือ"
        className="rounded-lg border bg-muted/30 px-4 py-3"
      >
        <p className="text-sm font-medium">สารบัญ</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
          {MANUAL_SECTIONS.map((section) => (
            <li key={section.id}>
              <a href={`#${section.id}`} className={linkClassName}>
                {section.title}
              </a>
            </li>
          ))}
          <li>
            <a href="#leave-types" className={linkClassName}>
              ประเภทการลาในระบบ
            </a>
          </li>
        </ol>
      </nav>

      {MANUAL_SECTIONS.map((section) => (
        <section
          key={section.id}
          id={section.id}
          className="scroll-mt-6 space-y-3 border-b border-border pb-8 last:border-b-0"
        >
          <h3 className="text-base font-semibold">{section.title}</h3>
          {section.intro ? (
            <p className="text-pretty text-sm text-muted-foreground">
              {section.intro}
            </p>
          ) : null}
          {section.links?.length ? (
            <ul className="space-y-3">
              {section.links.map((item) => (
                <li key={item.href} className="text-sm">
                  <Link href={item.href} className={linkClassName}>
                    {item.label}
                  </Link>
                  {item.note ? (
                    <p className="mt-0.5 text-pretty text-muted-foreground">
                      {item.note}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
          {section.bullets?.length ? (
            <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
              {section.bullets.map((bullet) => (
                <li key={bullet} className="text-pretty">
                  {bullet}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}

      <section id="leave-types" className="scroll-mt-6 space-y-3">
        <h3 className="text-base font-semibold">ประเภทการลาในระบบ</h3>
        <p className="text-pretty text-sm text-muted-foreground">
          รหัสประเภทตรงกับตัวเลือกในฟอร์มบันทึกขออนุญาตลา
        </p>
        <ol className="list-decimal space-y-1 pl-5 text-sm">
          {LEAVE_TYPE_OPTIONS.map((option) => (
            <li key={option.value}>
              <span className="font-medium tabular-nums">{option.value}.</span>{" "}
              {option.label}
            </li>
          ))}
        </ol>
      </section>
    </article>
  );
}
