/** ลบ control chars และ escape ที่เพี้ยนจาก MySQL dump (เช่น `\r` เป็นตัวอักษร `\` + `r`) */
export function cleanLegacyText(value: unknown): string {
  return String(value ?? "")
    .replace(/\r\n?|\n|\r/g, "")
    .replace(/\\r|\\n/g, "")
    .trim();
}
