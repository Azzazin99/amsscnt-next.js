import type { PersonExportRow } from "@/lib/person/queries";

const BOM = "\uFEFF";

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function renderPersonCsv(rows: PersonExportRow[]): string {
  const header = [
    "เลขบัตรประชาชน",
    "ชื่อ-นามสกุล",
    "ระดับ",
    "สถานศึกษา",
    "กลุ่มงาน",
    "ตำแหน่ง",
    "สถานะ",
  ];

  const lines = rows.map((row) =>
    [
      row.personId,
      row.displayName,
      row.organizationType === "school" ? "โรงเรียน" : "เขต",
      row.schoolName ?? "",
      row.workgroupName ?? "",
      row.positionLabel,
      row.status === 0 ? "ใช้งาน" : "ปิด",
    ]
      .map((cell) => csvEscape(String(cell)))
      .join(","),
  );

  return BOM + [header.join(","), ...lines].join("\r\n");
}

export function personCsvFilename(): string {
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `personnel-${stamp}.csv`;
}
