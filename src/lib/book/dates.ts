const BANGKOK = "Asia/Bangkok";

/** YYYY-MM-DD ตาม timezone Bangkok */
function bangkokDateString(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: BANGKOK }).format(date);
}

/** วันนี้เป็น YYYY-MM-DD ตาม timezone Bangkok */
export function bangkokTodayIso(): string {
  return bangkokDateString(new Date());
}

/** ต้นวันของวันนี้ (00:00 Bangkok) */
export function bangkokStartOfToday(): Date {
  const dateStr = bangkokDateString(new Date());
  return new Date(`${dateStr}T00:00:00+07:00`);
}

/** ต้นวันที่ (today − n วัน) ตาม Bangkok — ใช้กรอง send_date */
export function bangkokCutoffDaysAgo(days: number): Date {
  const start = bangkokStartOfToday();
  start.setUTCDate(start.getUTCDate() - days);
  return start;
}

/** วันที่ (today − n ปี) เป็น YYYY-MM-DD Bangkok — ใช้กรอง sign_date */
export function bangkokCutoffYearsAgo(years: number): string {
  const [y, m, d] = bangkokDateString(new Date()).split("-").map(Number);
  return `${y - years}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
