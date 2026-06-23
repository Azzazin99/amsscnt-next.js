/** รหัสอ้างอิง legacy — {unix}x{random} */
export function generateReceiveRefId(): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const rand = Math.floor(Math.random() * 1_000_000_000);
  return `${timestamp}x${rand}`;
}

/** วันที่ลงทะเบียน (YYYY-MM-DD) ตาม timezone Bangkok */
export function todayBangkokDateString(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
  }).format(new Date());
}
