/** ตรวจเลขที่หนังสือเบื้องต้นตามแนวระเบียบ 2546 */

export function validateIncomingBookNo(bookNo: string): string | null {
  const trimmed = bookNo.trim();
  if (!trimmed) return "กรุณากรอกเลขที่หนังสือ";
  if (trimmed.length > 100) return "เลขที่หนังสือยาวเกินไป";
  if (!/\d/.test(trimmed)) {
    return "เลขที่หนังสือควรมีเลขลำดับ";
  }
  return null;
}

export function validateOutgoingBookNo(
  bookNo: string,
  officeNo?: string,
): string | null {
  const trimmed = bookNo.trim();
  if (!trimmed) return "กรุณากรอกเลขที่หนังสือ";
  if (trimmed.length > 100) return "เลขที่หนังสือยาวเกินไป";
  if (!/\d/.test(trimmed)) {
    return "เลขที่หนังสือควรมีเลขลำดับ";
  }
  const prefix = officeNo?.trim();
  if (prefix && !trimmed.startsWith(prefix)) {
    return `เลขที่หนังสือควรขึ้นต้นด้วย ${prefix}`;
  }
  return null;
}
