import Link from "next/link";
import { redirect } from "next/navigation";
import { Download, FileSpreadsheet, FileText, Upload } from "lucide-react";
import { auth } from "@/auth";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  canManagePersonStaffPermissions,
  getPersonPermissions,
} from "@/lib/person/permissions";
import { cn } from "@/lib/utils";

const IMPORT_DISTRICT_INSTRUCTIONS = [
  "เตรียมข้อมูลในไฟล์ Excel โดยให้แถวแรกเป็นชื่อหัวสดมภ์ (Header) และแถวที่ 2 เป็นต้นไปเป็นข้อมูลบุคลากรแต่ละคน",
  "คอลัมน์ประกอบด้วย: 1.เลขประจำตัวประชาชน, 2.คำนำหน้าชื่อ, 3.ชื่อ, 4.นามสกุล, 5.รหัสตำแหน่ง",
  "สามารถอ้างอิงรหัสตำแหน่งได้จากเมนู 'กำหนดตำแหน่งครูและบุคลากรใน สพท.' ในส่วนตั้งค่าระบบ",
  "การบันทึกไฟล์จาก Excel ให้เลือก Save As ชนิดประเภท Text (Tab delimited) (*.txt)",
  "เมื่อได้ไฟล์ Text ให้เปิดด้วย Notepad แล้วเลือก Save As โดยเปลี่ยน Encoding ด้านล่างเป็น UTF-8 เพื่อรองรับภาษาไทย",
  "เลือกหรือลากไฟล์ .txt ดังกล่าวมาวางในช่องอัปโหลดด้านล่าง แล้วกดปุ่ม 'นำเข้าข้อมูล'",
];

const SAMPLE_COLUMNS = [
  { col: 1, name: "เลขประจำตัวประชาชน", example: "1234567890123" },
  { col: 2, name: "คำนำหน้าชื่อ", example: "นาย" },
  { col: 3, name: "ชื่อ", example: "สมชาย" },
  { col: 4, name: "นามสกุล", example: "ใจดี" },
  { col: 5, name: "รหัสตำแหน่ง", example: "5" },
];

export default async function PersonImportDistrictTextSettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const perms = await getPersonPermissions(Number(session.user.id));
  if (!canManagePersonStaffPermissions(session.user)) {
    redirect("/modules/person/staff");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 pt-2">
      {/* Header Section */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b pb-4">
        <div>
          <h2 className="text-xl font-semibold text-primary">
            นำเข้าข้อมูลครูและบุคลากรในสำนักงานเขตพื้นที่การศึกษา
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            อัปโหลดไฟล์ข้อความ (Text File UTF-8) เพื่อนำเข้าข้อมูลบุคลากรประจำ สพท. เข้าสู่ระบบ
          </p>
        </div>
        <a
          href="/templates/person_district_import_template.txt"
          download="person_district_import_template.txt"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "inline-flex items-center gap-1.5 min-h-9",
          )}
        >
          <Download className="size-4" />
          <span>ดาวน์โหลดไฟล์ตัวอย่าง</span>
        </a>
      </div>

      {/* Main Import Form */}
      <form className="space-y-5 rounded-xl border bg-card p-6 shadow-sm">
        <div className="space-y-2">
          <label htmlFor="file" className="block text-sm font-medium">
            เลือกไฟล์เอกสารนำเข้า (.txt / .tsv)
          </label>

          {/* Drag & Drop Upload Zone */}
          <div className="group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/25 p-8 text-center transition-colors hover:border-primary/50 hover:bg-muted/30">
            <div className="mb-3 rounded-full bg-primary/10 p-3 text-primary transition-transform group-hover:scale-110">
              <Upload className="size-6" />
            </div>
            <p className="text-sm font-medium text-foreground">
              ลากไฟล์มาวางที่นี่ หรือ <span className="text-primary underline underline-offset-2">คลิกเพื่อเลือกไฟล์</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              รองรับเฉพาะไฟล์ .txt หรือ .tsv (Encoding: UTF-8 ขนาดไม่เกิน 10MB)
            </p>
            <input
              id="file"
              name="file"
              type="file"
              accept=".txt,.tsv"
              required
              className="absolute inset-0 cursor-pointer opacity-0"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" className="min-h-10 px-6">
            <FileText className="mr-1.5 size-4" />
            นำเข้าข้อมูล
          </Button>
          <Link
            href="/modules/person/staff"
            className="inline-flex min-h-10 items-center justify-center rounded-lg border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted"
          >
            ยกเลิก
          </Link>
        </div>
      </form>

      {/* Sample Format Preview Card */}
      <div className="rounded-xl border bg-card p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <FileSpreadsheet className="size-4 text-primary" />
          <h3>ตัวอย่างโครงสร้างคอลัมน์ไฟล์นำเข้า (5 คอลัมน์)</h3>
        </div>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                {SAMPLE_COLUMNS.map((col) => (
                  <th key={col.col} className="px-3 py-2 font-medium text-foreground">
                    {col.col}. {col.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="bg-background">
                {SAMPLE_COLUMNS.map((col) => (
                  <td key={col.col} className="px-3 py-2 font-mono text-muted-foreground">
                    {col.example}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Import Instructions Card */}
      <div className="rounded-xl border bg-card p-5 shadow-sm space-y-3">
        <h3 className="text-sm font-semibold text-foreground">
          คำอธิบายขั้นตอนและข้อแนะนำในการนำเข้าข้อมูล
        </h3>
        <ol className="space-y-2 text-xs text-muted-foreground">
          {IMPORT_DISTRICT_INSTRUCTIONS.map((text, idx) => (
            <li key={text} className="flex items-start gap-2">
              <span className="shrink-0 font-mono font-medium text-primary">
                {idx + 1}.
              </span>
              <span className="leading-relaxed">{text}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
