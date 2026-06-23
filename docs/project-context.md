# AMSS / SMSS — Project Context (สพป.ชัยนาท)

> Mirror ของ [`context.html`](../context.html) — **ใช้ `@context.html` เป็นหลัก** (มีรายละเอียดครบ + TOC + ตาราง P###)

**สถานะ:** P000 in progress | **Decisions lock:** context.html §12

---

## สรุปสำคัญ (ไม่ต้องถามซ้ำ)

| หัวข้อ | ค่า lock |
|--------|----------|
| มาตรฐานสารบรรณ | **ระเบียบ ฉบับปรับปรุง พ.ศ. 2546** — lock มิ.ย. 2569; checklist §4.1 ใน context.html |
| มาตรฐานการลา | **ระเบียบ สำนักนายกฯ ว่าด้วยการลาของข้าราชการ พ.ศ. 2555** — lock มิ.ย. 2569; checklist §leave/2555 |
| ลำดับอ้างอิง (สารบรรณ) | **2546** → คู่มือ AMSS++ → amsscnt.com → SQL dump |
| ลำดับอ้างอิง (การลา) | **2555** → คู่มือ AMSS++ → amsscnt.com → SQL dump |
| Baseline เทียบ | [amsscnt.com](https://amsscnt.com) = regression/UX เมื่อไม่ขัด 2546 |
| PHP source | [`../Amssplus`](../Amssplus) (**ยืนยันแล้ว**) |
| Schema DB | **A (ยืนยันแล้ว):** Drizzle normalize + import mapping จาก legacy |
| Go-live | **A (ยืนยันแล้ว):** Big bang — ครบ 18 โมดูล → UAT dump ชัยนาท → สลับ URL ครั้งเดียว ปิด PHP |
| PDF dev | **B (ยืนยันแล้ว):** `pnpm storage:copy-samples` จาก `../Amssplus` และ/หรือ `../smart_kpp2` → `storage/bookregister/` (ดู context.html §4 ที่เก็บไฟล์แนบ) |
| PDF go-live | **A (ยืนยันแล้ว):** migrate ครบจาก production server |
| Import dump | **C (ยืนยันแล้ว):** Hybrid — legacy schema ครั้งแรก + transform ตาม scope |
| P000 scope | **C (ยืนยันแล้ว):** bootstrap + import login + bookregister ครบ |
| หน้าแรก P011 | **C (ยืนยันแล้ว):** เมนูโมดูล + welcome — dashboard สรุปภายหลัง |
| Login P010 | **B (ยืนยันแล้ว):** บุคลากร — user/pass + เลขบัตรครั้งแรก + multi-school; นักเรียน → P160 |
| สถานะ | Grill ก่อน implement — สั่ง "ทำ P000" เมื่อพร้อม |
| Rollback cutover | **C (ยืนยันแล้ว):** snapshot + PHP standby 1–2 สัปดาห์ + Nginx rollback |
| Production server | **A (ยืนยันแล้ว):** เครื่อง PHP/amsscnt.com เดิม — ติดตั้ง Next.js + PostgreSQL วัน cutover |
| UAT | **C (ยืนยันแล้ว):** server staging แยกในเครือข่ายเขต (คนละเครื่องกับ production) |
| Domain cutover | **A (ยืนยันแล้ว):** `amsscnt.com` URL เดิม — สลับ Nginx ครั้งเดียว |
| Dump ชัยนาท | **A (ยืนยันแล้ว):** MySQL จาก production → แปลง PostgreSQL → import |
| ข้อมูล dev / UAT | **C (ยืนยันแล้ว):** dev = dump สงขลา 2 + override ชื่อเขต → UAT/go-live = dump ชัยนาทจริง |
| amsscnt vs 2546 | **2546 ชนะ** — บันทึกความต่างใน PR |
| เว็บ vs SQL | Schema = dump; UX/flow = 2546 ก่อน แล้วเทียบ amsscnt.com |
| ลำดับงาน | ตาม `P000`→`P190`, `P999` ใน context.html §10 |
| รหัสผ่าน v1 | **A (ยืนยันแล้ว):** admin reset + user เปลี่ยนเอง — ไม่มี forgot password |
| Approve workflow | **C (ยืนยันแล้ว):** คุณเทียบ amsscnt.com เอง + dev แนบ checklist ทุกหน้า |
| ส่งมอบ | ทีละหน้า → รอ approve |
| ทะเบียนโรงเรียน | ตารางเดียว + `school_id` |
| Theme UI | 2 โหมด: ราชการ (light) · มืด — §14 ใน context.html |
| Dev login | `admin` / เลขบัตร + `Imported123` |
| นอก v1 | §15 ใน context.html |

## ลำดับ implement (ย่อ)

`P000` bootstrap → `P010` login → `P011` shell → `P012–P019` core admin → `P030–P041` bookregister → `P050–P052` person → `P060+` โมดูลอื่นตามตาราง → `P999` deploy

---

เนื้อหาเต็ม (โมดูล 18, สิทธิ์, bookregister, stack, responsive, Cursor rules) อยู่ใน **context.html** sections §1–§15.
