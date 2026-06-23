# PRODUCT.md — AMSS/SMSS (สพป.ชัยนาท)

## Register

**product** — ระบบบริหารงานภายในสำนักงานเขต (app UI, ตาราง, ฟอร์ม, สิทธิ์) ไม่ใช่ landing/marketing

## Users & purpose

- **ผู้ใช้หลัก:** เจ้าหน้าที่สำนักงานเขตพื้นที่การศึกษาประถมศึกษาชัยนาท (สพป.ชัยนาท), โรงเรียนในสังกัด (มุมมองโรงเรียนสำหรับบางโมดูล)
- **บริบทการใช้งาน:** โต๊ะทำงานในห้องสำนักงาน แสงฟลูออเรสเซนต์หรือแสงธรรมชาติ ใช้งานทั้งเช้า–บ่าย เน้นความถูกต้องของเอกสารราชการมากกว่าความโดดเด่นทาง visual
- **งานหลัก:** ลงทะเบียนหนังสือรับ–ส่ง, ค้นหา, แนบ PDF, กำหนดปีทะเบียนและสิทธิ์เจ้าหน้าที่ (ย้ายจากระบบ AMSS++ PHP legacy)

## Product scope (Next.js)

- Migration จาก **AMSS++ / SMSS** (PHP) เป็น **Next.js 16 + PostgreSQL + Auth.js**
- โมดูลที่ implement แล้ว/กำลังทำ: **bookregister** (ทะเบียนรับ, ส่ง, แนบไฟล์, ปี, สิทธิ์)
- โมดูลอื่น (~18 ตามคู่มือ) จะตามในแผน P-series

## Brand personality

- **น่าเชื่อถือ · ชัดเจน · เป็นราชการ** — อ่านง่าย ไม่เล่นสีเกินจำเป็น
- ภาษา UI: **ไทย** เป็นหลัก; วันที่แสดงและกรอกเป็น **พ.ศ.** ฝั่งผู้ใช้ เก็บในระบบเป็น ค.ศ. (ISO)

## Anti-references

- ไม่ทำ SaaS startup aesthetic (hero metrics, gradient text, glass cards ทุกหน้า)
- ไม่ทำ dark mode เป็นค่าเริ่มต้นเพราะ “ดูทันสมัย”
- ไม่ copy ปุ่ม/flow จาก generic admin template โดยไม่เทียบ legacy ที่ amsscnt.com

## Accessibility

- เป้า **WCAG 2.1 AA** สำหรับข้อความและ control หลัก
- รองรับ keyboard และ screen reader บนตารางและฟอร์ม
- ธีมมืดเป็นทางเลือกสำหรับลดเมื่อยตา

## Strategic design principles

1. **ความคุ้นเคยกับ legacy** — ผู้ใช้เคย AMSS++ หน้าตาและคำศัพท์ต้องไม่แปลกโดยไม่จำเป็น
2. **ความหนาแน่นที่ใช้งานได้** — ตารางหนาแน่นได้ แต่ touch target และ contrast ต้องผ่าน
3. **Deterministic วันที่** — ไม่พึ่ง locale/timezone ของ browser สำหรับค่าจาก DB

## References

- Legacy production: https://amsscnt.com (สพป.ชัยนาท)
- บริบทโปรเจกต์: `context.html`
- คู่มือ: AMSS++ v3.1 (manual_smss_203_0.pdf)
