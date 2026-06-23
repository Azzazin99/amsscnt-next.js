export type IdocumentStatusTone = "neutral" | "warning" | "info" | "success" | "danger";

export type IdocumentStatusMeta = {
  label: string;
  tone: IdocumentStatusTone;
};

export function idocumentBookTypeLabel(bookType: number): string {
  switch (bookType) {
    case 1:
      return "ด่วน";
    case 2:
      return "ด่วนที่สุด";
    case 3:
      return "ลับ";
    default:
      return "ปกติ";
  }
}

export function idocumentBookTypeTone(bookType: number): IdocumentStatusTone {
  switch (bookType) {
    case 1:
      return "warning";
    case 2:
      return "danger";
    case 3:
      return "danger";
    default:
      return "neutral";
  }
}

export function idocumentBookStatusMeta(
  bookStatus: number,
  preDocId?: string,
): IdocumentStatusMeta {
  if (preDocId === "0") {
    return { label: "ฉบับร่าง", tone: "neutral" };
  }

  switch (bookStatus) {
    case 0:
      return { label: "รอดำเนินการ", tone: "warning" };
    case 1:
      return { label: "กำลังดำเนินการ", tone: "info" };
    case 2:
      return { label: "รอ รอง ผอ.สพป. ลงนาม", tone: "info" };
    case 3:
      return { label: "รอ ผอ.สพป. ลงนาม", tone: "info" };
    case 4:
      return { label: "อนุญาต", tone: "success" };
    case 5:
      return { label: "ปฏิบัติราชการเสร็จแล้ว", tone: "success" };
    case 6:
      return { label: "อนุมัติ", tone: "success" };
    case 7:
      return { label: "ไม่อนุมัติ", tone: "danger" };
    case 8:
      return { label: "ชอบ/ให้ดำเนินการตามเสนอ", tone: "success" };
    case 40:
      return { label: "ลงนามแล้ว", tone: "success" };
    case 41:
      return { label: "อนุญาต/อนุมัติ", tone: "success" };
    case 51:
      return { label: "ไม่อนุญาต/ไม่อนุมัติ", tone: "danger" };
    case 99:
      return { label: "คืนเรื่อง", tone: "danger" };
    default:
      return { label: `สถานะ ${bookStatus}`, tone: "neutral" };
  }
}

export function canEditIdocumentStatus(bookStatus: number): boolean {
  return bookStatus < 2 || bookStatus === 99;
}
