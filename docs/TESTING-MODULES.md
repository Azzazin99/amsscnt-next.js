# คู่มือทดสอบทีละโมดูล

ใช้ไฟล์นี้เมื่อต้องการตรวจงานเอง — **ไม่ต้อง approve ทีละ P032/P033**  
เทียบฟังก์ชันกับ [amsscnt.com](https://amsscnt.com) (ระบบ PHP production สพป.ชัยนาท) บนเครื่องคุณ

**Base URL ระบบใหม่ (dev):** `http://localhost:3000` (หรือ URL staging ของเขต)

---

## วิธีใช้

1. เลือกโมดูลจากตารางใน [`context.html`](../context.html#s10) §10
2. เปิดหัวข้อโมดูลด้านล่าง — เดินตาม URL
3. จดบั๊กด้วย [เทมเพลตบั๊ก](#bug-template) (ระบุ slug โมดูล ไม่ต้องระบุ P###)
4. พอพอใจ: บอก **`{slug} โอเค`** (เช่น `bookregister โอเค`) → อัปเดตสถานะโมดูลใน `context.html`

ป้ายบน `/home` (ใช้งานได้ / กำลังพัฒนา / เร็วๆ นี้) มาจาก `src/lib/modules/implementation-status.ts` — ช่วยไม่ให้คลิกเมนูที่ยังไม่พร้อม

**Date picker มาตรฐาน:** ฟอร์มทุกโมดูลใช้ `ThaiDatePicker` — เปิดปฏิทิน **จิ้มเลือกวัน** แสดงเดือน/ปี **พ.ศ.** เก็บค่า ISO ใน DB (ไม่ใช่ `<input type="date">` ค.ศ.)

---

## platform — Login, หน้าแรก, จัดการระบบ

**เทียบ amsscnt.com:** หน้า login + หลัง login (เมนูโมดูล) + เมนูจัดการระบบ (ถ้ามีสิทธิ์ admin)

### ก่อนเริ่ม

- บัญชีทดสอบเขต (username/password หรือเลขบัตรครั้งแรน)
- ข้อมูล demo จาก `npm run db:import` (ถ้าทดสอบ local)
- **ดูตาราง Postgres (dev + admin เท่านั้น):** `/admin/dev/database` — อ่านอย่างเดียว ปิดบน production
- **ส่งออก legacy dump (super-admin + dev/staging):** `/admin/dev/export-legacy` — ต้องมี `pg_dump` บนเซิร์ฟเวอร์; เปิดด้วย `AMSS_ENABLE_LEGACY_DUMP_EXPORT=1` บน staging

### เดินลอง

| ลำดับ | ทำอะไร | URL |
|------|--------|-----|
| 1 | Login บุคลากร | `/login` |
| 2 | หน้าแรก + การ์ดโมดูล + legend สถานะ | `/home` |
| 3 | Top nav / mobile menu — กลุ่มเมนู 5 กลุ่ม | จาก `/home` |
| 4 | โมดูล placeholder | `/modules/{slug}` — โมดูลที่ยังไม่ทำจะเป็นหน้า placeholder |
| 5 | จัดการระบบ — ตั้งค่าหน่วยงานเขต (admin) | `/admin/district-settings` |

Login **admin** — ปุ่ม ⚙ มุมขวาบน · แก้ **ชื่อหน่วยงาน** ที่ `/admin/district-settings` · จัดการ **สถานศึกษา** ที่ `/admin/schools` · จัดการ **กลุ่มสถานศึกษา** ที่ `/admin/school-groups` · จัดการ **กลุ่มงาน** ที่ `/admin/workgroups`

| ลำดับ | ทำอะไร | URL |
|------|--------|-----|
| 6 | รายการสถานศึกษา + ค้นหา | `/admin/schools` |
| 7 | เพิ่ม / แก้ไขโรงเรียน | `/admin/schools/new`, `.../edit` |
| 8 | รายการกลุ่มสถานศึกษา + ค้นหา | `/admin/school-groups` |
| 9 | เพิ่ม / แก้ไข / ลบกลุ่ม | `/admin/school-groups/new`, `.../edit` |
| 10 | รายการกลุ่มงาน + ค้นหา | `/admin/workgroups` |
| 11 | เพิ่ม / แก้ไข / ลบกลุ่มงาน | `/admin/workgroups/new`, `.../edit` |
| 12 | เปิด/ปิดโมดูล | `/admin/modules`, `.../edit` |
| 13 | ผู้ดูแลโมดูล | `/admin/module-admins` |
| 14 | รายการผู้ใช้งานเขต | `/admin/users` |
| 15 | สิทธิ์โมดูล (p1/p2/p3) | `/admin/permissions` |
| 16 | ส่งออก legacy dump (super-admin, ต้องมี pg_dump) | `/admin/dev/export-legacy` |

**ข้อมูลบุคลากร:** sync จาก Excel ด้วย `npm run db:sync-personnel-chainat` — people 1,508 คน · users เขต 67 คน (username = เบอร์โทร) · login โรงเรียนใช้เลข person_id สังเคราะห์ 13 หลัก (`1701xxxxxxxxx`)

### สิ่งที่ควรเช็ค

- Login สำเร็จ / ผิด password / เลขบัตรครั้งแรน
- เมนูโมดูลตรงสิทธิ์ใน DB
- **บริหารงานทั่วไป (flyout + การ์ดหน้าแรก):** เขตเห็น 6 รายการตามลำดับ — รับส่งหนังสือราชการ สพฐ. · ทะเบียนหนังสือราชการ · รับส่งหนังสือราชการ · ไปรษณีย์ · ขออนุญาตไปราชการ · การลา — ไม่มี car / meeting / delegate · โรงเรียนเห็นเฉพาะ book · permission · leave
- **การวางแผน (flyout L1 + การ์ดหน้าแรก):** หัวเมนู **การวางแผน** · รายการย่อย **การวางแผน** → `/modules/plan` · in-module flyout 7 กลุ่ม Amssplus (ตั้งค่า · โครงการประจำปี · เงินเหลือจ่าย · ตรวจสอบ · รายงาน · คู่มือ)
- **การเงินและบัญชี (flyout L1 + การ์ดหน้าแรก):** หัวเมนู **การเงินและบัญชี** · รายการย่อย **การเงินและบัญชี** → `/modules/budget` · ไม่มี asset ในกลุ่มนี้
- **บริหารงานบุคคล (flyout L1 + การ์ดหน้าแรก):** หัวเมนู **บริหารงานบุคคล** · รายการย่อย **ข้อมูลพื้นฐานครูและบุคลากร** → `/modules/person` · ไม่มี award ในกลุ่มนี้
- **บริหารงานวิชาการ (flyout L1 + การ์ดหน้าแรก):** หัวเมนู **บริหารงานวิชาการ** · 5 รายการตามลำดับ — การศึกษาทางไกล · ข้อมูลนักเรียน · ผลสัมฤทธิ์ทางการเรียน · ระบบทดสอบการศึกษา · นักเรียนพิเศษ · ไม่มี warroom/supervision/opportunity · `dltv` ต้อง seed (`npm run db:seed-dltv-module`) · `bets` เห็นเฉพาะ login_status 16
- **บันทึกข้อความ (flyout L1 + การ์ดหน้าแรก):** หัวเมนู **บันทึกข้อความ** · รายการย่อย **บันทึกข้อความ** → `/modules/idocument` · อยู่ถัดจาก **บริหารงานวิชาการ** · เขตเท่านั้น · แยกจากกลุ่มบริหารงานทั่วไป
- **ภารกิจผู้บริหาร (flyout L1 + การ์ดหน้าแรก):** หัวเมนู **ภารกิจผู้บริหาร** · รายการย่อย **ภารกิจผู้บริหาร** → `/modules/affair` · อยู่ถัดจาก **บันทึกข้อความ** · แยกจากกลุ่มบริหารงานทั่วไป
- **แบบสอบถาม (flyout L1 + การ์ดหน้าแรก):** หัวเมนู **แบบสอบถาม** · รายการย่อย **แบบสอบถาม** → `/modules/questionnaire` · อยู่ถัดจาก **ภารกิจผู้บริหาร** · เขตและโรงเรียน · ต้อง seed (`npm run db:seed-questionnaire-module`)
- **แจ้งเตือน (flyout L1 + การ์ดหน้าแรก):** หัวเมนู **แจ้งเตือน** · รายการย่อย **แจ้งเตือน** → `/modules/alert` · ท้ายสุดตาม legacy group 5 · เขตและโรงเรียน · จาก import legacy (`where_work = 0`)
- Responsive: mobile / tablet / desktop
- จัดการระบบ: เฉพาะ admin — ผู้ใช้ทั่วไป redirect ไป `/home`
- แก้ชื่อเขตแล้วเห็นบนหัวระบบโดยไม่ต้อง login ใหม่
- สถานศึกษา: เพิ่ม/แก้ไข/ปิดใช้งาน · รหัสไม่ซ้ำ · ค้นหาชื่อ/รหัส
- กลุ่มสถานศึกษา: เพิ่ม/แก้ไข/ลบ (ลบได้เมื่อไม่มีโรงเรียนในกลุ่ม) · ลำดับแสดงผล · จำนวนโรงเรียนต่อกลุ่ม
- กลุ่มงาน: เพิ่ม/แก้ไข/ปิดใช้งาน/ลบ (ลบได้เมื่อไม่มีบุคลากรหรือทะเบียนอ้างอิง) · ลำดับแสดงผล · ใช้ในฟิลเตอร์ทะเบียนรับ/ส่ง
- โมดูล: เปิด/ปิดแสดงบน /home · แก้ชื่อ/ลำดับ
- ผู้ดูแลโมดูล / ผู้ใช้ / สิทธิ์โมดูล: CRUD บุคลากรเขต (P017–P019)

### เมนู «ตั้งค่าระบบ» ในโมดูล (ทุก slug ที่มี layout)

ทดสอบ 3 บทบาทในโมดูลเดียวกัน (เช่น `mail`, `leave`):

| บทบาท | เห็น section «ตั้งค่าระบบ» | ลิงก์ที่เข้าได้ |
|--------|---------------------------|----------------|
| บุคลากรทั่วไป (p1 ไม่ใช่ admin) | ไม่เห็น | — |
| `module_admin` (ไม่ใช่ `is_admin`) | เห็น | เฉพาะ `…/permissions` |
| `is_admin` (smss admin) | เห็น | ครบ (ปี, master data, สิทธิ์ ฯลฯ) |

- **book:** `groups` / `retention` อยู่ใต้ตั้งค่าระบบ — เฉพาะ `is_admin` · module admin / p1 redirect เมื่อเข้า URL ตรง
- โมดูลที่ยังไม่มีหน้า permissions (`book`, `idocument`, `alert`, `questionnaire`) — module admin เห็นลิงก์สถานะ «เร็วๆ นี้»

ADR: [`docs/adr/004-module-settings-nav-visibility.md`](adr/004-module-settings-nav-visibility.md)

---

## bookregister — ทะเบียนหนังสือราชการ

**สถานะ:** **ปิดโมดูลแล้ว (มิ.ย. 2569)** — ใช้งานได้ทั้งเขตและโรงเรียน (ขอบเขต v1 ด้านล่าง)

**เทียบ amsscnt.com:** เมนูทะเบียนหนังสือ — ทุกแท็บย่อย (ตั้งค่า, รับ, ส่ง, คำสั่ง, เกียรติบัตร)

### ไฟล์แนบ (legacy → dev)

| ชนิด | โฟลเดอร์ PHP (`Amssplus` / `smart_kpp2`) | ระบบใหม่ |
|------|------------------------------------------|----------|
| รับ | `modules/bookregister/upload_files1/` | `storage/bookregister/receive/` |
| ส่ง | `modules/bookregister/upload_files2/` | `storage/bookregister/send/` |

ชื่อไฟล์ใน DB ต้องตรงกับชื่อในโฟลเดอร์ legacy — copy ด้วย `pnpm storage:copy-samples` (อ่าน `AMSSPLUS_PATH`, `SMART_KPP2_PATH`). Clone local มักไม่มี PDF ใน `upload_files*` (ต้องดึงจาก production)

### ก่อนเริ่ม

- Login **ระดับเขต** (`login_status` 2–4 หรือผู้ดูแลระบบ `is_admin` ที่มี `login_status` ตามตำแหน่ง)
- สิทธิ์ทะเบียน p1 ดู / p2 บันทึก / p3 ลบ (ตั้งที่ `/modules/bookregister/permissions`)
- ปีทะเบียนเปิดรับและส่ง (`/modules/bookregister/years`)

### เดินลอง — ตั้งค่า

| ลำดับ | ทำอะไร | URL |
|------|--------|-----|
| 1 | หน้าโมดูล | `/modules/bookregister` |
| 2 | กำหนดปีปฏิทิน | `/modules/bookregister/years` |
| 3 | กำหนดเจ้าหน้าที่ (p1/p2/p3) | `/modules/bookregister/permissions` |

### เดินลอง — ทะเบียนรับ (เขต)

| ลำดับ | ทำอะไร | URL |
|------|--------|-----|
| 4 | รายการ + ค้นหา + กรองกลุ่ม | `/modules/bookregister/receive` |
| 5 | เพิ่มรายการ (หลังบันทึก → ไปแก้ไขเพื่อแนบไฟล์) | `/modules/bookregister/receive/new` |
| 6 | รายละเอียด + ดาวน์โหลดแนบ | `/modules/bookregister/receive/{id}` |
| 7 | แก้ไข + แนบ/ลบไฟล์ | `/modules/bookregister/receive/{id}/edit` |

### เดินลอง — เลขที่สำนักงาน (ก่อนลงทะเบียนส่ง)

| ลำดับ | ทำอะไร | URL |
|------|--------|-----|
| 7a | กำหนด prefix เลขที่หนังสือออก (เขต) | `/modules/bookregister/office-no` |

### เดินลอง — ทะเบียนส่ง (เขต)

| ลำดับ | ทำอะไร | URL |
|------|--------|-----|
| 8 | รายการ + ค้นหา | `/modules/bookregister/send` |
| 9 | เพิ่ม (หลังบันทึก → ไปแก้ไขแนบ) / แก้ไข | `/modules/bookregister/send/new`, `.../edit` |
| 10 | รายละเอียด (ดาวน์โหลดแนบ / ลิงก์แนบไฟล์) | `/modules/bookregister/send/{id}` |
| 11 | แนบ/ลบไฟล์หลายไฟล์ | `/modules/bookregister/send/{id}/edit` (ส่วนไฟล์แนบด้านล่าง) |

หมายเหตุ: ติ๊ก **หนังสือเวียน** → รายการแสดง `[ว]`; ไม่ติ๊ก → `[ป]` · แนบได้ pdf/doc/xls/ppt/รูป/zip สูงสุด 20MB/ไฟล์

### เดินลอง — ทะเบียนคำสั่ง (เขต)

| ลำดับ | ทำอะไร | URL |
|------|--------|-----|
| 12 | รายการ + ค้นหา | `/modules/bookregister/command` |
| 13 | เพิ่ม / แก้ไข (แนบไฟล์เดียวในฟอร์ม) | `/modules/bookregister/command/new`, `.../edit` |
| 14 | รายละเอียด + ดาวน์โหลดแนบ | `/modules/bookregister/command/{id}` |

หมายเหตุ: เลขที่หนังสือ `{เลขทะเบียน}/{ปี}` อัตโนมัติ · แก้ไขได้ผู้บันทึกหรือ p1 ภายใน **50 วัน** · ลบได้เฉพาะผู้บันทึกภายใน 50 วัน

### เดินลอง — ทะเบียนเกียรติบัตร (เขต)

| ลำดับ | ทำอะไร | URL |
|------|--------|-----|
| 15 | รายการ + ค้นหา | `/modules/bookregister/certificate` |
| 16 | เพิ่ม / แก้ไข (แนบไฟล์เดียว) | `/modules/bookregister/certificate/new`, `.../edit` |

### เดินลอง — มุมมองโรงเรียน (P040)

Login **โรงเรียน** (`login_status` 12–15, `organization_type = school`) — เห็นเฉพาะ **รับ / ส่ง** (ไม่มีตั้งค่า, คำสั่ง, เกียรติบัตร, รายงาน)

| ลำดับ | ทำอะไร | URL |
|------|--------|-----|
| 17 | รายการรับ (ไม่มีกรองกลุ่ม) | `/modules/bookregister/receive` |
| 18 | เพิ่ม/แก้ไขรับ — จาก/ถึง default ชื่อโรงเรียน | `/modules/bookregister/receive/new`, `.../edit` |
| 19 | รายการส่ง | `/modules/bookregister/send` |
| 20 | เพิ่ม/แก้ไขส่ง — ต้องมีเลขที่หนังสือโรงเรียนใน DB | `/modules/bookregister/send/new`, `.../edit` |

หมายเหตุ: ข้อมูลแยกด้วย `school_id` ในตารางเดียวกับเขต · ปีทะเบียนโรงเรียนใช้แถว `register_years` ที่มี `school_id` (ยังไม่มี UI ตั้งค่าปีโรงเรียน)

### นอกขอบเขต v1 (รู้ไว้ — ไม่บล็อกการใช้งาน)

| เมนู | หมายเหตุ |
|------|----------|
| ตั้งค่าปีทะเบียนโรงเรียน | legacy `year_sch` — ยังไม่มี UI (ใช้ข้อมูล import) |
| เลขที่หนังสือโรงเรียน | legacy `office_no_sch` — ยังไม่มี UI (ต้องมีใน DB ก่อนลงทะเบียนส่ง) |
| คำสั่ง / เกียรติบัตร โรงเรียน | legacy มี — Next.js v1 scope แค่รับ/ส่ง |
| ส่งต่อโรงเรียน → โมดูล `book` | รอ Phase 2 (`book`) |

### สิ่งที่ควรเช็ค

- ฟิลด์วันที่ (`signdate` ฯลฯ): ปฏิทิน **จิ้มเลือก** แสดง **พ.ศ.** — ไม่ใช่ `<input type="date">` ค.ศ.
- ค้นหา (อย่างน้อย 2 ตัวอักษร), เลขทะเบียนแบบ `123/2568`
- สิทธิ์: p1 ดูอย่างเดียว, p2 แก้ภายใน 1 วัน, p3 ลบ
- ไอคอนแนบในรายการ, PDF เปิดในเบราว์เซอร์ / ดาวน์โหลดไฟล์อื่น
- ทะเบียนส่ง: ป้าย [ป/ว/อ], [ส่งต่อ] · หน้ารายละเอียดแสดง «ยังไม่มีไฟล์แนบ» + ลิงก์แนบ
- ทะเบียนคำสั่ง: ไอคอนแนบในรายการ · แนบไฟล์เดียวต่อรายการ · หน้าต่างแก้ไข/ลบ 50 วัน

---

## person — ระบบบริหารงานบุคลากร

**สถานะ:** P050–P052 พร้อมทดสอบ (มิ.ย. 2569)  
**เทียบ amsscnt.com:** เมนูบุคลากร — รายชื่อ, ฟอร์ม, สิทธิ์ p1/p2/p3, ส่งออก CSV

### ก่อนเริ่ม

- Top nav / หน้าแรก — กลุ่ม L1 **บริหารงานบุคคล** มีรายการย่อย **ข้อมูลพื้นฐานครูและบุคลากร** → `/modules/person`
- ข้อมูลบุคลากรจาก `npm run db:sync-personnel-chainat` (1,508 คน)
- Login **ระดับเขต** (admin หรือมีสิทธิ์ person) หรือ **โรงเรียน** (login_status 12–15)

### เดินลอง

| ลำดับ | ทำอะไร | URL |
|------|--------|-----|
| 1 | รายชื่อ + ค้นหา/กรอง | `/modules/person/staff` |
| 2 | เพิ่มบุคลากร | `/modules/person/staff/new` |
| 3 | แก้ไข + ตำแหน่ง | `/modules/person/staff/{id}/edit` |
| 4 | สิทธิ์ p1/p2/p3 (เขต) | `/modules/person/permissions` |
| 5 | ส่งออก CSV | ปุ่มบนหน้ารายชื่อ → `/api/person/export` |

### สิ่งที่ควรเช็ค

- เขต: กรองระดับ / โรงเรียน / กลุ่มงาน · ดูทั้งเขตและโรงเรียน
- โรงเรียน: เห็นเฉพาะบุคลากรในโรงเรียนตน · เพิ่ม/แก้ไขได้ตามสิทธิ์
- ตำแหน่ง: dropdown ครบ legacy `person_position` (0 = บุคลากรทั่วไป · 1–22 ชื่อเต็ม เช่น นักวิเคราะห์นโยบายและแผน)
- **คำนำหน้า:** dropdown นาย / นาง / นางสาว (บังคับ) — ระบบ sync `sex` อัตโนมัติ (ไม่มี dropdown เพศแยก)
- multi-school: ติ๊กแล้วเลือกโรงเรียนเพิ่ม
- สิทธิ์: p1 ดู · p2 บันทึก · p3 ปิดใช้งาน
- CSV: UTF-8 BOM · คอลัมน์ชื่อ/หน่วยงาน/ตำแหน่ง

---

## book — รับส่งหนังสือราชการ

**สถานะ:** v1 P060–P062 + Phase 2 (2.2–2.6) implemented — รอ UAT (มิ.ย. 2569)  
**เทียบ amsscnt.com:** โมดูล `book` — หนังสือรับ/หนังสือส่ง, ส่งหนังสือราชการ, รายการแจ้งเตือน, ตอบรับ, แนบ PDF, กลุ่มหนังสือ

### ก่อนเริ่ม

- Login **ระดับเขต** (login_status 2–4 หรือ module admin) หรือ **โรงเรียน** (12–15)
- ไฟล์แนบเก็บที่ `storage/book/` (นอก public)
- **ทดรายการเก่าจาก dump สงขลา (dev):**
  ```bash
  npm run db:load-legacy
  npm run db:import-smart-area -- --scope=full --legacy-master
  pnpm storage:copy-samples
  ```
  Login ด้วย `system_user` จาก dump (รหัสผ่าน `Imported123`) — **อย่า** รัน `db:sync-personnel-chainat` หลัง import นี้

### เดินลอง

| ลำดับ | ทำอะไร | URL |
|------|--------|-----|
| 1 | รายการหนังสือรับ + กรองตอบรับ | `/modules/book/inbox` |
| 2 | รายการหนังสือส่ง | `/modules/book/sent` |
| 3 | ส่งหนังสือราชการ (เมนูหลัก หรือปุ่มบนหนังสือส่ง) | `/modules/book/new` |
| 4 | หนังสือที่ยังไม่รับเกิน 3 วัน | `/modules/book/inbox/overdue` |
| 5 | หนังสืออายุเกิน 2 ปี | `/modules/book/inbox/aged` |
| 6 | รายละเอียด + ตอบรับ + แนบไฟล์ | `/modules/book/{id}` |
| 7 | กลุ่มหนังสือ (เขต) | `/modules/book/groups` |

### Phase 2 — 2.2–2.6

| ลำดับ | ทำอะไร | URL |
|------|--------|-----|
| P2-1 | สร้างหนังสือเวียน (checkbox + เลือกผู้รับ) | `/modules/book/new` |
| P2-2 | กรองหนังสือเวียนในรายการส่ง | `/modules/book/sent?type=circulation` |
| P2-3 | ส่งต่อทะเบียนส่ง → โรงเรียน (ความเร็ว/ลับจากทะเบียน) | `/modules/bookregister/send/{id}` → ปุ่ม **ส่งต่อโรงเรียน (ระบบรับส่ง)** |
| P2-4 | ตอบรับ + ลงทะเบียนรับอัตโนมัติ | `/modules/book/{id}` → ติ๊ก **ลงทะเบียนรับอัตโนมัติ** → ตอบรับ |
| P2-5 | ลิงก์สองทาง หนังสือ ↔ ทะเบียน | รายละเอียดหนังสือ / ทะเบียนรับ / ทะเบียนส่ง |
| P2-6 | พิมพ์แบบหนังสือราชการ | `/modules/book/{id}/print` |
| P2-7 | ตั้งค่าอายุเก็บ + รายการครบกำหนด | `/modules/book/retention` (admin เขต) |

### สิ่งที่ควรเช็ค

- **หนังสือเวียน:** checkbox บนฟอร์มส่ง · แท็บ **หนังสือเวียน** บนหนังสือส่ง · ผู้รับเห็นใน inbox
- **ส่งต่อจากทะเบียน:** เฉพาะเขต · ยังไม่ส่งต่อ · คัดลอก urgency/secret/bookNo/signDate/subject จริง
- **ลงทะเบียนอัตโนมัติ:** recordType=2 · source=book · book_link ↔ bookRegisLink
- **พิมพ์หนังสือ:** แบบ HTML พิมพ์จาก browser · ชื่อเขต สพป.ชัยนาท
- **อายุเก็บ:** ตั้งปีต่อ book_type · รายการครบกำหนด (MVP ไม่มี workflow ทำลาย)
- **เขตส่ง:** เลือกส่งถึง ทุกโรงเรียน / เลือกโรงเรียน / กลุ่มหนังสือ
- **โรงเรียนส่ง:** ส่งถึงสารบรรณเขต (saraban) หรือโรงเรียนอื่น
- **หนังสือรับ:** โรงเรียนเห็นหนังสือที่ `send_to` = รหัสโรงเรียน · เขตเห็น `saraban`
- **ตอบรับ:** ปุ่มบนหน้ารายละเอียดเมื่อยังไม่ตอบรับ
- **แนบ PDF:** ผู้ส่งแนบได้บนหน้ารายละเอียด · เปิดดูผ่าน API
- **กลุ่มหนังสือ:** CRUD + เลือกสมาชิกโรงเรียน · ใช้ตอนส่งหนังสือ
- **เมนูหลัก:** หนังสือรับ · หนังสือส่ง · ส่งหนังสือราชการ (เฉพาะผู้มีสิทธิ์ส่ง) · เกิน 3 วัน · เกิน 2 ปี · กลุ่มหนังสือ (เขต admin)
- **เกิน 3 วัน:** เฉพาะหนังสือรับ · ยังไม่ตอบรับ · `send_date` ก่อนต้นวัน (today − 3) Bangkok
- **เกิน 2 ปี:** เฉพาะหนังสือรับ · `sign_date` ≤ (today − 2 ปี) Bangkok — **เทียบจำนวน/รายการกับ amsscnt.com** ถ้าไม่ตรงให้รายงานบั๊ก
- **ชั้นความเร็ว/ลับ:** ตามระเบียบ 2546 (0–3 ลับ, 1–4 เร็ว)
- **Pagination:** หน้าแรก · ก่อนหน้า · … · ถัดไป · หน้าสุดท้าย

### ยังไม่รวม (phase ถัดไป)

- import ข้อมูล legacy `book_main` จาก production
- workflow อนุมัติทำลายเอกสาร (2.6 เต็มรูปแบบ)

---

## idocument — บันทึกข้อความ

**สถานะ:** v1 — รายการ + รายละเอียด + สร้าง/แก้ไข/เสนอ + inbox + รายงาน (มิ.ย. 2569) · รอ UAT
**เทียบ amsscnt.com:** โมดูล `idocument` — บันทึกเสนอ, ลงความเห็น, รายงาน (`modules/idocument/menu.php`)

### ก่อนเริ่ม

- Top nav / หน้าแรก — กลุ่ม L1 **บันทึกข้อความ** → `/modules/idocument`
- Login **ระดับเขต** (login_status 2–4 หรือ module admin) — โมดูล `where_work=1`
- โมดูล `idocument` ต้อง active ใน `modules` (จาก import legacy) และแสดงบน `/home`
- ข้อมูลอ่านจากตาราง legacy `idocument_main` / `idocument_sendto` / `idocument_comment` (มีใน dump สงขลา)

### เดินลอง

| ลำดับ | ทำอะไร | URL |
|------|--------|-----|
| 1 | รายการบันทึกเสนอ (ของตัวเอง) | `/modules/idocument` |
| 2 | เพิ่มบันทึกเสนอ (ร่าง หรือ เสนอ) | `/modules/idocument/new` |
| 3 | รายละเอียด + ประวัติความเห็น | `/modules/idocument/{id}` |
| 4 | แก้ไขร่าง (ก่อนอนุมัติ / คืนเรื่อง) | `/modules/idocument/{id}/edit` |
| 5 | Inbox ลงความเห็น/สั่งการ | `/modules/idocument/inbox` |
| 6 | รายงานบันทึกข้อความทั้งหมด (สถานะ 5/40) | `/modules/idocument/reports` |

### สิ่งที่ควรเช็ค

- **เมนู nav โมดูล:** บันทึกเสนอ · ลงความเห็น (ถ้ามีสิทธิ์) · รายงาน
- รายการ `/modules/idocument` เทียบ amsscnt.com `?option=idocument&task=view` — เลขที่, เรื่อง, สถานะ, เฉพาะของตัวเอง
- สร้างร่าง → แก้ไข → บันทึกเสนอ → ผู้รับเห็นใน `/inbox`
- รายงาน `/reports` เทียบ `?option=idocument&task=viewlist` (ผอ./รองเห็นทั้งหมด)
- ผู้ใช้โรงเรียน / ไม่มีโมดูลบน home → redirect `/home`

### ยังไม่รวม (phase ถัดไป)

- ลงความเห็นจาก inbox (workflow `book_pass` ครบทุกขั้น)
- อัปโหลดไฟล์ ref/attach/sent + พิมพ์ PDF
- ตั้งค่าอัปโหลดลายเซ็น (module admin)

---

## questionnaire — แบบสอบถาม

**สถานะ:** scaffold nav + หน้าว่าง (มิ.ย. 2569) — รอเชื่อมระบบแบบสอบถาม
**เทียบ amsscnt.com:** โมดูล `questionnaire` — สร้าง/เผยแพร่แบบสอบถาม, ตอบแบบสอบถาม, รายงาน (ยังไม่มีใน dump สงขลา — seed ด้วย `npm run db:seed-questionnaire-module`)

### ก่อนเริ่ม

- Top nav / หน้าแรก — กลุ่ม L1 **แบบสอบถาม** มีรายการย่อย **แบบสอบถาม** → `/modules/questionnaire`
- Login **เขตหรือโรงเรียน** (โมดูล `where_work=0`) หรือ module admin
- รัน `npm run db:seed-questionnaire-module` แล้วโมดูลต้อง active บน `/home`

### เดินลอง

| ลำดับ | ทำอะไร | URL |
|------|--------|-----|
| 1 | รายการแบบสอบถาม (flyout L1 **แบบสอบถาม** → รายการย่อย) | `/modules/questionnaire` |

### สิ่งที่ควรเช็ค

- **เมนู nav โมดูล:** แท็บ **แบบสอบถาม** → รายการหลัก
- หน้ารายการแสดงหัวข้อ **แบบสอบถาม** + empty state «ยังไม่มีข้อมูล — รอเชื่อมระบบแบบสอบถาม»
- คอลัมน์: ชื่อแบบสอบถาม · วันที่เปิด · วันที่ปิด · กลุ่มเป้าหมาย · สถานะ
- ผู้ใช้ไม่มีโมดูลบน home → redirect `/home`

### ยังไม่รวม (phase ถัดไป)

- สร้าง/แก้ไขแบบสอบถาม, หน้าตอบแบบ, QR code
- รายงานผลสรุป
- ตารางสิทธิ์ + หน้าตั้งค่าเจ้าหน้าที่

---

## alert — แจ้งเตือน

**สถานะ:** scaffold nav + หน้าว่าง (มิ.ย. 2569) — รอเชื่อมระบบแจ้งเตือน
**เทียบ amsscnt.com:** โมดูล `alert` — รายการข้อความแจ้งเตือน (legacy `warning.php`, LINE notify ฯลฯ)

### ก่อนเริ่ม

- Top nav / หน้าแรก — กลุ่ม L1 **แจ้งเตือน** (ท้ายสุด) มีรายการย่อย **แจ้งเตือน** → `/modules/alert`
- Login **เขตหรือโรงเรียน** (โมดูล `where_work=0`) หรือ module admin
- โมดูล `alert` ต้อง active ใน `modules` (จาก import legacy) และแสดงบน `/home`

### เดินลอง

| ลำดับ | ทำอะไร | URL |
|------|--------|-----|
| 1 | รายการแจ้งเตือน (flyout L1 **แจ้งเตือน** → รายการย่อย) | `/modules/alert` |

### สิ่งที่ควรเช็ค

- **เมนู nav โมดูล:** แท็บ **แจ้งเตือน** → รายการหลัก
- หน้ารายการแสดงหัวข้อ **แจ้งเตือน** + empty state «ไม่มีข้อความแจ้งเตือน — รอเชื่อมระบบแจ้งเตือน»
- คอลัมน์: ลำดับ · ข้อความแจ้งเตือน
- L1 **แจ้งเตือน** ใช้ flyout แม้มีรายการเดียว (`preferFlyout`)
- ผู้ใช้ไม่มีโมดูลบน home → redirect `/home`

### ยังไม่รวม (phase ถัดไป)

- ดึงข้อมูล `$system_alert_ar` / LINE notify จาก legacy
- CRUD ข้อความแจ้งเตือน

---

## bookobec — รับส่งหนังสือราชการ สพฐ.

**สถานะ:** เชื่อม SmartObec (hybrid) — รับพร้อมลงทะเบียน (native) + iframe รับ/ส่ง/รายงาน · กำหนดเจ้าหน้าที่ + รหัสเชื่อม สพฐ. (ก.ค. 2569)
**เทียบ amsscnt.com:** โมดูล `bookobec` — รายการหนังสือรับ/ส่ง สพฐ., คู่มือ (แยกจาก `book`)
**ADR:** [006-smartobec-sync.md](adr/006-smartobec-sync.md)

### ก่อนเริ่ม

- Login **ระดับเขต** (login_status 2–4 หรือ module admin) — โมดูล `where_work=1`
- โมดูล `bookobec` ต้อง active ใน `modules` (จาก import legacy) และแสดงบน `/home`
- ตาราง `system_sync_code` ต้องมี `office_code` + `sync_code` จริง (import legacy หรือตั้งที่ settings)
- ลงทะเบียนรับต้องมี `register_years` ที่ `year_active=true` และ `start_receive_num > 0`

### เดินลอง

| ลำดับ | ทำอะไร | URL |
|------|--------|-----|
| 1 | รายการหนังสือรับ สพฐ. — รับพร้อมลงทะเบียน + iframe รับ | `/modules/bookobec/inbox` |
| 2 | รายการหนังสือส่ง สพฐ. — iframe ส่ง + รายงาน | `/modules/bookobec/sent` |
| 3 | คู่มือรับส่งหนังสือราชการ สพฐ. (flyout **คู่มือ** · placeholder) | `/modules/bookobec/manual` |
| 4 | กำหนดเจ้าหน้าที่ (flyout **ตั้งค่าระบบ** · smss admin เท่านั้น) | `/modules/bookobec/permissions` |
| 5 | เชื่อมกับ SMART OBEC — รหัสหน่วยงาน + Sync | `/modules/bookobec/settings` |

### ก่อนทดสอบตั้งค่า

- Login ผู้ใช้ **`is_admin=true`** (เช่น `sastar` ใน dump สงขลา) — ผู้มี p1 แต่ไม่ใช่ smss admin **ไม่เห็น** เมนูตั้งค่าระบบ

### สิ่งที่ควรเช็ค

- **เมนู nav:** hover **รายการหนังสือรับ** / **รายการหนังสือส่ง** / **คู่มือ** → dropdown รายการย่อย (หัว flyout ไม่นำทาง)
- smss admin: เห็น **ตั้งค่าระบบ → กำหนดเจ้าหน้าที่** และ **เชื่อมกับ SMART OBEC**
- ผู้มี `p1_bookobec`: inbox แสดงตารางหนังสือรอรับจาก SmartObec + ปุ่ม «ลงทะเบียนหนังสือ» + iframe รับหนังสือ
- ผู้ไม่มี p1 แต่เข้าโมดูลได้: inbox แสดง iframe รายการหนังสือรับ สพฐ. (`receive_other`)
- ผู้มี `p2_bookobec`: sent แสดง iframe ส่งหนังสือ + รายการส่ง
- ลงทะเบียนสำเร็จ → มีรายการใน `/modules/bookregister/receive` และ `/modules/book/inbox`
- iframe ถูกบล็อก → ใช้ปุ่ม «เปิดในแท็บใหม่»
- manual: หัวข้อ **คู่มือ** + บรรทัดรอง **รับส่งหนังสือราชการ สพฐ.** + แบนเนอร์ placeholder
- `/modules/bookobec` redirect ไป inbox
- ผู้ใช้โรงเรียน / ไม่มีโมดูลบน home → redirect `/home`

### ตรวจสอบ CLI

```bash
npx tsx scripts/check-obec-sync.ts
```

- `OK: XML parse self-check` — parser ทำงาน
- `OK: OBEC fetch` — เชื่อม smart.obec.go.th ได้ (ต้องมี sync_code จริง)
- `SKIP` — ยังไม่ตั้ง sync_code

### ยังไม่รวม (phase ถัดไป)

- คู่มือ PDF จริง (`modules/bookobec/manual/bookobec.pdf`)
- native UI แทน iframe ทั้งหมด (ถ้า สพฐ. เปิด API เพิ่ม)

---

## leave — ระบบการลา

**สถานะ:** ยึดระเบียบ **2555** (มิ.ย. 2569) — ประเภทลาครบ, โควต้า, ครึ่งวัน, workflow หลายขั้น · รอ UAT
**มาตรฐาน:** ระเบียบสำนักนายกรัฐมนตรีว่าด้วยการลาของข้าราชการ พ.ศ. 2555 (2555 ชนะเมื่อขัด amsscnt.com)
**เทียบ amsscnt.com:** โมดูล `leave` — ยื่นคำขอลา, รายการ, พิจารณาอนุมัติ, ตั้งค่าปีและสิทธิ์

### ก่อนเริ่ม

- Login **ระดับเขต** (login_status 2–4 หรือ module admin) หรือ **โรงเรียน** (12–15)
- กำหนดปีงบประมาณ เจ้าหน้าที่ ผู้อนุมัติ และวันลาสะสม ในกลุ่ม **ตั้งค่าระบบ** — เฉพาะ **ผู้ดูแลระบบ SMSS** (`is_admin`) · p1 / module admin ไม่เห็นเมนูนี้

### ข้อมูล demo (dev / Mac mini — ไม่พึ่ง legacy dump)

สำหรับทดทะเบียนการลาและรายงานโดยไม่ต้อง `db:import-leave`:

```bash
docker compose up -d
npm run db:migrate
npm run db:seed-leave-demo
```

| รายการ | ค่า |
|--------|-----|
| กลุ่ม | `demo_staff` (สังเคราะห์ — ดู glossary `demo_staff` ใน CONTEXT.md) |
| username / person_id | `1701999990001` |
| รหัสผ่าน | `AMSS_IMPORT_PASSWORD` (default `Imported123`) |
| ปีงบ active | 2569 |
| คำขออนุมัติแล้ว | 3 รายการ (ป่วย 2 วัน · กิจ 1 วัน · พักผ่อน 1 วัน) |

**ทด:** `/modules/leave/requests` · `/modules/leave/reports/today`

**ลบเฉพาะ demo:** `npm run db:seed-leave-demo -- --reset`

**ข้อจำกัดรอบ minimal:** ไม่ seed `leave_permissions` / `leave_person_settings` — ดูรายการและรายงานได้ · ยื่นลาใหม่ผ่าน UI ต้องตั้งผู้อนุมัติเอง (หรือรอ phase 2)

รันได้เฉพาะ `DATABASE_URL` ชี้ localhost หรือตั้ง `AMSS_DEMO_SEED_OK=1`

### เดินลอง

**เมนู leave:** หัว flyout L3 (**ตั้งค่าระบบ** / **ขออนุญาตลา** / **พิจารณาอนุมัติ** / **ขอยกเลิกวันลา** / **รายงาน** / **คู่มือ**) — **hover เปิดเมนูย่อย คลิกหัวเมนูไม่นำทาง** · **ตั้งค่าระบบ** → **เมนูตั้งค่า** (5 รายการ) · **ขออนุญาตลา** (บันทึก `/new` · ทะเบียน · มอบงาน) · **พิจารณาอนุมัติ** (inbox ตามสิทธิ viewer) · **ขอยกเลิกวันลา** (3 รายการ) · **รายงาน** (6 รายการ) · **คู่มือ** → คู่มือการลา

| ลำดับ | ทำอะไร | URL |
|------|--------|-----|
| 1 | บันทึกขออนุญาตลา (เลือกประเภทลา 1–10 ในหน้าเดียว) — เมนูเข้าฟอร์มโดยตรง | `/modules/leave/requests/new` |
| 2 | ทะเบียนการลา (เฉพาะคำขอของตัวเอง) · แก้ไข/ลบก่อนอนุมัติ · ไม่มีปุ่มบันทึกซ้ำ | `/modules/leave/requests` |
| 3 | รับมอบงาน (inbox ผู้รับมอบ) | `/modules/leave/job-handover` |
| 4 | ผอ.กลุ่ม — inbox เห็นชอบ | `/modules/leave/approvals/group` |
| 4a | รอง ผอ.สพท. — inbox อนุมัติขั้นสุดท้าย (บุคลากรเขต) | `/modules/leave/approvals/group2` |
| 5 | ผอ.สพท. — inbox อนุมัติขั้นสุดท้าย (บุคลากรโรงเรียน) | `/modules/leave/approvals/commander` |
| 6 | รายละเอียด + อนุมัติ/ไม่อนุมัติ | `/modules/leave/requests/{id}` |
| 7 | รายการขอยกเลิกวันลา | `/modules/leave/cancellations` |
| 8 | บันทึกขอยกเลิกวันลา | `/modules/leave/cancellations/new` |
| 9 | รายละเอียดยกเลิก + อนุมัติ | `/modules/leave/cancellations/{id}` |
| 9a | ผอ.กลุ่ม — คิวยกเลิก | `/modules/leave/cancellations/approvals/group` |
| 9b | รอง ผอ.สพท. — คิวยกเลิก (เขต) | `/modules/leave/cancellations/approvals/group2` |
| 9c | ผอ.สพท. — คิวยกเลิก (รร.) | `/modules/leave/cancellations/approvals/commander` |
| 10 | กำหนดปีงบประมาณ (admin) | `/modules/leave/years` |
| 11 | กำหนดเจ้าหน้าที่ p1/p2 (admin) | `/modules/leave/permissions` |
| 12 | กำหนดผู้อนุมัติ สพท. (`leave_person_settings`) | `/modules/leave/grant-persons` |
| 13 | กำหนดผู้อนุมัติ รร. (รอง ผอ.เขต p1=0 p2=1) | `/modules/leave/school-grant-persons` |
| 14 | วันลาสะสม (`leave_collect`) | `/modules/leave/collection` |
| 15 | ศูนย์รายงานการลา (hub — เปิดทาง URL ไม่มีใน nav) | `/modules/leave/reports` |
| 16 | คู่มือการลา (สารบัญ + ลิงก์เมนูย่อย + ประเภทลา) | `/modules/leave/manual` |

### รายงาน (flyout **รายงาน**)

| ผู้ใช้ | เห็นใน flyout |
|--------|----------------|
| **เขต** | ครบ 6 รายการ |
| **ผอ.รร. / รักษาการ ผอ.รร.** | 5 รายการ (ซ่อน สถิติพักผ่อน) |
| **ครู/บุคลากร รร. ทั่วไป** | ขออนุญาตลาวันนี้ · ขออนุญาตลาทั้งหมด |

เกณฑ์ **ผอ./รก.:** `position_code` 1 หรือ `person_delegate` ครอบคลุมวันนี้

| ลำดับ | ทำอะไร | URL | Scope |
|------|--------|-----|-------|
| R1 | ขออนุญาตลาวันนี้ (เลือกวันพ.ศ.) | `/modules/leave/reports/today` | เขต + รร. |
| R2 | ขออนุญาตลาทั้งหมด (pagination) | `/modules/leave/reports/all` | เขต + รร. |
| R3 | ขอยกเลิกวันลาทั้งหมด | `/modules/leave/reports/cancellations` | เขต + ผอ./รก. |
| R4 | สถิติลาป่วย กิจ คลอด | `/modules/leave/reports/sick-privacy-birth?year=…&period=…` | เขต + ผอ./รก. |
| R5 | สถิติลาพักผ่อน | `/modules/leave/reports/vacation?year=…` | เขต |
| R6 | สถิติการลา ผอ.โรงเรียน | `/modules/leave/reports/school-principals?year=…` | เขต + ผอ./รก. |
| R7 | สถิติลาป่วย กิจ คลอด (รร.) | `/modules/leave/reports/school-staff?year=…` | รร. (ไม่อยู่ใน flyout v1) |
| R8 | ขอยกเลิกวันลา (รร.) | `/modules/leave/reports/school-cancellations` | รร. (ไม่อยู่ใน flyout v1) |

**เช็ครายงาน:**

- ไม่มีปีงบประมาณ → hub แจ้งให้ไป `/modules/leave/years`
- รายงานวันนี้: เปลี่ยนวันพ.ศ. → แสดงคนที่ `leave_start ≤ วัน ≤ leave_finish`
- รายการลา/ยกเลิก: pagination 25 รายการ · ปุ่ม **พิมพ์ / บันทึก PDF**
- สถิติป่วย/กิจ/คลอด: เลือกปีงบ + รอบ 12/6 เดือน · นับเฉพาะ `commander_grant = 1` หักยกเลิกที่อนุมัติ
- สถิติพักผ่อน: อ่าน `collect_day` / `this_year_day` จากหน้าวันลาสะสม
- **ยังไม่รวม v1:** แบบพิมพ์ใบลารายบุคคล (`print_report*`) · ส่งออก Excel

### สิ่งที่ควรเช็ค

- ประเภทลาครบ 10 แบบตาม 2555 (ป่วย, กิจ, คลอด, พักผ่อน, อุปสมบท, ตรวจเลือก/เตรียมพล, ติดตามคู่สมรส, ศึกษา/ฝึกอบรม, ช่วยภริยาคลอด, ฟื้นฟูสมรรถภาพ)
- **ฟอร์มบันทึกขออนุญาตลา** (`/modules/leave/requests/new`): Single-Page Task Form — เลือกประเภทลา dropdown + optgroup (ป่วย/กิจ/คลอด · พักผ่อน · อื่น 2555) แสดงโควต้าในรายการ · ประเภทหมดสิทธิ์ = disabled · วันลา/ครึ่งวัน · เหตุผลหลัก · optional collapsible (ติดต่อ/แนบ/มอบงาน) · preview หนังสือ on-demand · sticky สรุป+ยื่นบนมือถือ · เดสก์ท็อป aside (`leave_request_sidebar`) = สิทธิและสถิติ compact + สรุปคำขอ · มือถือ = สิทธิและสถิติในฟอร์มหลัก · ตาราง aside ไม่ scroll แนวนอน · กดบันทึกว่าง → «กรุณาเลือกประเภทการลา» ใต้ dropdown · `?group=sick|vacation` redirect ไป `/new` · แก้ไขคำขอ = หน้าเดียว scroll-to-error
- **ตำแหน่งบนฟอร์มลา:** บุคลากร `position_code = 14` → แสดง `ตำแหน่งนักวิเคราะห์นโยบายและแผน` (ไม่ใช่ "ตำแหน่งตำแหน่ง 14")
- ฟอร์มยื่นคำขอ: ปฏิทิน **จิ้มเลือกวัน** พ.ศ. · แสดงยอดโควต้าคงเหลือ (กิจ/คลอด/พักผ่อน/อุปสมบท)
- **ลาครึ่งวัน:** ติ๊กครึ่งวัน → เลือกช่วง (เช้า/บ่าย) → ปฏิทินเดียว (ไม่เห็น "ถึงวันที่") · เปลี่ยนวัน → finish sync อัตโนมัติ · มีกำหนด 0.5 · ยกเลิกติ๊ก → สองปฏิทิน · คงวันเดิม · ติ๊กครึ่งวันขณะมีช่วงหลายวัน → เหลือแค่วันเริ่ม
- **โควต้า:** ยื่นเกินสิทธิ์ → server ปฏิเสธ · ลาพักผ่อนต้องมี **วันเริ่มราชการ** ใน person (`service_start_date` จาก legacy `person_detail.start_day`) · ถ้ายังไม่มี → ข้อความ **"กรุณาระบุวันเริ่มราชการ..."** (ไม่ใช่ "หมดแล้ว") · backfill DB ที่มีอยู่: `npm run db:backfill-service-start`
- **Import ประวัติลา legacy (`legacy_leave` → `leave_*`):** แอปอ่าน **`leave_*` เท่านั้น** — ตาราง **`la_*`** ใน dump เป็น staging (ไม่ rename ตาราง) · map ผ่าน ETL · สถิติ "ลามาแล้ว" = `leave_requests` ที่ `commander_grant = 1` หัก `leave_cancellations` ที่อนุมัติแล้ว
  - **Full rebuild (แนะนำครั้งแรก / dev):** `npm run db:load-legacy` แล้ว **`npm run db:import-smart-area -- --scope=full --legacy-master`** — ต้องมี `--legacy-master` เพื่อให้ `people`/`schools` ตรง `person_id` ใน `la_*` (ไม่ใช้ Excel ชัยนาท) · ลบและสร้าง core + leave ใหม่
  - **Leave-only refresh** (เมื่อ core align แล้ว): **`npm run db:rebuild-leave-from-legacy`** หรือ `npm run db:import-leave -- --fresh-leave` · รันซ้ำได้ (idempotent) · ปิด stub people: `--no-backfill-leave-people`
  - **Orphan person_id:** import สร้าง **`legacy_leave_person`** อัตโนมัติจาก `person_id` ใน `la_*` ก่อน map คำขอ · คาด `requestsSkippedNoPerson = 0`
  - **ชื่อ stub → ชื่อจริง:** ถ้าเห็น "ประวัติลา {เลขบัตร}" — merge `person_main` / `person_sch_main` ยโสธรเข้า legacy DB แล้วรัน **`npm run db:refresh-leave-person-names`** (หรือ rebuild leave — refresh ชื่อรวมอยู่ใน import)
  - **Backfill วันเริ่มราชการ:** `npm run db:backfill-service-start` (หลัง load-legacy)
  - **Verify:** หลัง import สคริปต์แสดงเปรียบเทียบ `la_main`+`la_main_bk` vs `leave_requests` · login เป็น `person_id` จาก `la_main_bk` ที่ `commander_grant = 1` → `/modules/leave/requests/new` ตารางสถิติ "ลามาแล้ว" ไม่เป็น 0 ทั้งแถว (หลังหักยกเลิก)
- **ยกเลิกวันลา:** flyout **ขอยกเลิกวันลา** → รายการ / inbox ผอ.กลุ่ม / รอง ผอ.สพท. (เขต) / ผอ.สพท. (รร.) · `/modules/leave/cancellations` · ยื่นอ้างอิงคำขอลาที่ `commander_grant = 1` (1 คำขอยกเลิกต่อ 1 คำขอลา · partial วันในคำขอเดียวได้) · workflow 3 ขั้นเดียวกับคำขอลา · หลังอนุมัติยกเลิก → `used`/สถิติลดตาม `cancel_total` · ยื่นซ้ำคำขอเดิม → server ปฏิเสธ
- **เพศ / สิทธิ์ประเภทลา:** เลือกคำนำหน้าใน person (นาย/นาง/นางสาว) → sync sex อัตโนมัติ · ชายเห็นลาช่วยภริยาคลอด (9) ไม่เห็นลาคลอด (3) · หญิงตรงกันข้าม · ยังไม่เลือกคำนำหน้า → ยื่นลาป่วยได้ · tamper ส่ง type 3 → server ปฏิเสธ
- **ลาย้อนหลัง:** ลาป่วย / ลาคลอด — ได้ · ลากิจ / ลาพักผ่อน — ไม่ได้
- **Workflow:** ผู้ลายื่น → ผอ.กลุ่ม (`/approvals/group`) → ผู้อนุมัติขั้นสุดท้าย · **บุคลากรเขต** (`school_id` ว่าง): รอง ผอ.สพท. (`/approvals/group2`) · **บุคลากรโรงเรียน**: ผอ.สพท. (`/approvals/commander`) · ปฏิเสธที่ขั้น 2 หรือ 3 → `commander_grant = 0` · อนุมัติขั้นสุดท้าย → `commander_grant = 1` + sync โควต้า · เมนู **พิจารณาอนุมัติ** ไม่มีเจ้าหน้าที่ / school-deputy · คำขอค้างรอเจ้าหน้าที่ (legacy) จะไป inbox ผอ.กลุ่ม
- **ทะเบียนการลา** (`/modules/leave/requests`): แสดงเฉพาะคำขอของผู้ login · หัวกลาง "ทะเบียนการลา" + ชื่อผู้ใช้ + pagination ด้านบน · เข้าจากเมนู **ทะเบียนการลา** (ไม่มีปุ่มบันทึกซ้ำ — ยื่นใหม่ใช้เมนู **บันทึกขออนุญาตลา** → `/new`) · ตาราง 12 คอลัมน์ (เลขที่ · วันขออนุญาต · ประเภท · วันลา · เอกสาร · อนุมัติ · ดาวน์โหลด · รายละเอียด · ลบ · แก้ไข) · แก้ไข/ลบได้เมื่อ `commander_grant` ยังว่าง · รายการทั้งเขตใช้ `/modules/leave/reports/all`
- **ตั้งค่าระบบ (5 รายการ):** เห็น section เฉพาะผู้ดูแลระบบ SMSS (`is_admin`) · hover **เมนูตั้งค่า** ภายใต้ heading → 5 ลิงก์ย่อย · p1/module admin เข้าหน้า config โดยตรงไม่ได้
  - **กำหนดผู้อนุมัติ (สพท.):** รายการบุคลากรเขต · แก้ไขผู้เห็นชอบ (ผอ.กลุ่ม / รอง ผอ.สพท.) และผู้อนุมัติ → บันทึก `leave_person_settings`
  - **กำหนดผู้อนุมัติ (รร.):** CRUD รอง ผอ.เขต (position 2) ใน `leave_permissions` p1=0 p2=1 · ไม่ปนกับหน้าเจ้าหน้าที่
  - **วันลาสะสม:** แก้ `collect_day` / `this_year_day` ต่อคนตามปีงบปัจจุบัน → ฟอร์มยื่นลาพักผ่อนแสดงสะสม/ปีนี้ตามที่ตั้ง · import จาก `la_collect` → `leave_collect`
- **Validation ภาษาไทย:** กดบันทึกฟอร์มว่าง (ยื่นคำขอ / อนุมัติ / ปีงบ / สิทธิ์) → เห็นข้อความไทย **ใต้แต่ละช่องที่ผิด** (หลายช่องพร้อมกัน) ไม่ใช่ popup อังกฤษของ browser · ตัวอย่างยื่นคำขอว่าง: ใต้ประเภท "กรุณาเลือกประเภทการลา" / ใต้เหตุผล "กรุณาระบุเหตุผล" / ใต้วัน "กรุณาระบุวันเริ่มลา" · error จาก server (โควต้าเกิน ฯลฯ) → แบนเนอร์ล่าง · ยื่นคำขอครบฟิลด์ → ไม่ขึ้น "Invalid input: expected string, received null"
- **โทรศัพท์ติดต่อ:** ว่างได้ · hint `รูปแบบ 08 xxxx xxxx` · พิมพ์ `081` ขณะกรอกไม่ error · `0812345678` / paste `08-1234-5678` ผ่าน · ตัวอักษร → "กรุณากรอกเบอร์โทรศัพท์เป็นตัวเลขเท่านั้น" · ยื่นด้วย `08123` (ไม่ครบ) หรือ `0212345678` (ไม่ใช่มือถือ) → "กรุณากรอกเบอร์ให้ครบ 10 หลัก"
- **ไฟล์แนบ:** แสดงช่องเมื่อเลือกประเภทแล้ว (ทุกประเภท) · ไม่บังคับทั่วไป · ลาป่วย ≥30 วัน บังคับ (2555) · แนบได้ **PDF และรูปภาพ** · ดาวน์โหลดจากหน้ารายละเอียด
- **เคส UI แนบไฟล์:**
  - เลือกประเภทใดก็เห็นช่องแนบ
  - ลาป่วย 1–29 วัน → ไม่บังคับ
  - ลาป่วย 30 วัน → บังคับ ไม่แนบ → server ปฏิเสธ
  - ลากิจ / ลาคลอด → เห็นช่อง ไม่บังคับ
  - เลือกไฟล์ Word (.docx) → client แจ้ง error · PDF/รูปผ่าน
- **สถิติการลา:** ตาราง 4 แถว (ป่วย/กิจ/คลอด/พักผ่อน) อัปเดต live · บันทึก snapshot ในหน้ารายละเอียด
- **เขต:** เห็นคำขอทั้งหมด · **โรงเรียน:** เห็นในโรงเรียน + ของตนเอง
- สิทธิ์: p1 อนุมัติ · p2 ยื่นคำขอ · module admin ตั้งค่า
- **คู่มือการลา:** `/modules/leave/manual` — สารบัญ ลิงก์ไปหน้างานตามเมนู รายการประเภทลา 1–10 · ป้ายเมนู **ใช้งานได้** (ไม่ใช่ placeholder)
- Pagination: 25 รายการต่อหน้า

---

## permission — ขออนุญาตไปราชการ

**สถานะ:** v2 พร้อมทดสอบ (มิ.ย. 2569) — workflow 2 ขั้น, inbox อนุมัติ, รายงาน 3 รายการ, คู่มือ
**เทียบ amsscnt.com:** โมดูล `permission` — บันทึกขออนุญาตไปราชการ, พิจารณา 2 ขั้น, รายงาน, ตั้งค่าปี/สิทธิ์/ผู้อนุมัติรายบุคคล

### ก่อนเริ่ม

- Login **ระดับเขต** (login_status 2–4 หรือ module admin) หรือ **โรงเรียน** (12–15)
- กำหนดปีงบประมาณและสิทธิ์ที่ `/modules/permission/years` และ `/modules/permission/permissions` (ผู้ดูแล)
- กำหนดผู้บังคับบัญชาชั้นต้นและผู้อนุมัติต่อผู้ขอที่ `/modules/permission/grant-persons`

### เดินลอง

**เมนู permission (flyout 4 กลุ่ม):**

| กลุ่ม | รายการ |
|------|--------|
| ตั้งค่าระบบ | ปีงบประมาณ · สิทธิ์การใช้งาน · กำหนดผู้อนุมัติ |
| ขออนุญาตไปราชการ | บันทึกขออนุญาต · ผู้บังคับบัญชาชั้นต้น · ผู้บังคับบัญชา (ผู้อนุมัติ) |
| รายงาน | ขออนุญาตฯวันนี้ · ขออนุญาตฯทั้งหมด · พิมพ์การขออนุญาตฯ |
| คู่มือ | คู่มือการขออนุญาตไปราชการ |

| ลำดับ | ทำอะไร | URL |
|------|--------|-----|
| 1 | ยื่นคำขอใหม่ (home redirect) | `/modules/permission/requests/new` |
| 2 | คิวผู้บังคับบัญชาชั้นต้น | `/modules/permission/approvals/basic` |
| 3 | คิวผู้อนุมัติขั้นสุดท้าย | `/modules/permission/approvals/grant` |
| 4 | รายละเอียด + พิจารณา | `/modules/permission/requests/{id}` |
| 5 | รายงานวันนี้ | `/modules/permission/reports/today` |
| 6 | รายงานทั้งหมด | `/modules/permission/reports/all` |
| 7 | พิมพ์รายงาน | `/modules/permission/reports/print` |
| 8 | คู่มือ | `/modules/permission/manual` |
| 9 | กำหนดผู้อนุมัติ (admin) | `/modules/permission/grant-persons` |
| 10 | ปีงบประมาณ (admin) | `/modules/permission/years` |
| 11 | สิทธิ์ p1/p2 (admin) | `/modules/permission/permissions` |
| — | รายการเดิม (bookmark) | `/modules/permission/requests` |

### สิ่งที่ควรเช็ค

- ฟิลด์: เรื่อง/วัตถุประสงค์, สถานที่, ช่วงวันไปราชการ — เลือกวันจากปฏิทิน **พ.ศ.**
- **สรุปการขอไปราชการ (อ้างอิง)** ใต้ฟอร์มบันทึก (`/requests/new`): ตาราง read-only คำขอไปราชการของทุกคนในหน่วยงานที่สังกัด · **เขต:** เฉพาะบุคลากรสำนักงานเขต (`school_id` null) · **โรงเรียน:** ทุกคนในโรงเรียน · กรองปีงบ permission ที่เปิดใช้ · ลิงก์ไป `/modules/permission/reports/all` — **ไม่มี** ลิงก์ leave · **ไม่มี** แก้ไข/ยื่นจากหน้านี้
- Workflow: ยื่น → `basic_grant` (เห็นชอบ/ไม่เห็นชอบ) → `grant_status` (อนุมัติ/ไม่อนุมัติ) · ไม่เห็นชอบชั้นต้น = จบ flow
- Inbox แสดงเฉพาะคำขอที่ผู้ใช้ถูกกำหนดใน `permission_person_settings` (module admin เข้า inbox ได้)
- **เขต:** เห็นคำขอทั้งหมด · **โรงเรียน:** เห็นคำขอในโรงเรียน + คำขอของตนเอง
- รายงานวันนี้: `travel_start <= วันที่เลือก <= travel_finish`
- Pagination: 25 รายการต่อหน้า (รายงานทั้งหมด / inbox)

### ยังไม่รวม (phase ถัดไป)

- ปฏิทินเลือกวันแบบ legacy (`permission_date`)

---

## plan — การวางแผน

**สถานะ:** **ปิดโมดูลแล้ว (ก.ค. 2569)** — เมนูครบ Amssplus + ยุทธศาสตร์ + เงินเหลือจ่าย + SMSS + ตรวจสอบ/รายงาน
**เทียบ amsscnt.com:** โมดูล `plan` — `plan_year`, `plan_proj`, `plan_acti`, `plan_stregic`, `plan_permission`, `plan_acti_3` (surplus → `project_kind`)
**ADR:** [007-plan-module-full-menu.md](adr/007-plan-module-full-menu.md)

### ก่อนเริ่ม

- Login **ระดับเขต** (`login_status` 2–4 หรือ module admin)
- Top nav — กลุ่ม L1 **การวางแผน** → `/modules/plan`
- กำหนดปีงบประมาณที่ `/modules/plan/years` แล้วตั้งหนึ่งปีเป็น "ปีปัจจุบัน"
- กำหนดสิทธิ์ `perm_add/edit/dele` ที่ `/modules/plan/permissions` (module admin)
- หน้าตรวจสอบที่อ่าน `budget_receive` — ต้อง import legacy หรือมีข้อมูลจริง ไม่มีจะแสดง empty-state

### เดินลอง — ตั้งค่าระบบ

| ลำดับ | ทำอะไร | URL |
|------|--------|-----|
| 1 | กำหนดเจ้าหน้าที่ (add/edit/delete) | `/modules/plan/permissions` |
| 2 | กำหนดปีงบประมาณ | `/modules/plan/years` |
| 3 | กำหนดยุทธศาสตร์ | `/modules/plan/strategies` |

### เดินลอง — โครงการประจำปี

| ลำดับ | ทำอะไร | URL |
|------|--------|-----|
| 4 | รายการโครงการ + ค้นหา | `/modules/plan/projects` |
| 5 | เพิ่ม / แก้ไข / ลบโครงการ (เลือกยุทธศาสตร์) | `/modules/plan/projects/new`, `.../{id}`, `.../edit` |
| 6 | แนบเอกสารโครงการ | `/modules/plan/attachments` |
| 7 | เรียกข้อมูลจาก SMSS (preview + import) | `/modules/plan/smss-import` |

### เดินลอง — เงินเหลือจ่าย

| ลำดับ | ทำอะไร | URL |
|------|--------|-----|
| 8 | โครงการเงินเหลือจ่าย | `/modules/plan/surplus/projects` |
| 9 | รายงานการจัดสรรเงิน | `/modules/plan/surplus/reports/allocation` |
| 10 | หยุดกิจกรรม/โครงการ | `/modules/plan/surplus/activities/stop` |
| 11 | เหลือจ่ายจากยุติกิจกรรม | `/modules/plan/surplus/reports/remaining` |

### เดินลอง — ตรวจสอบ + รายงาน

| ลำดับ | ทำอะไร | URL |
|------|--------|-----|
| 12 | ทะเบียนเงินงวด | `/modules/plan/checks/installment-register` |
| 13 | ตรวจสอบการจัดสรรงบประมาณ | `/modules/plan/checks/allocation` |
| 14 | ตรวจสอบการใช้จ่ายโครงการ | `/modules/plan/checks/spending` |
| 15 | โครงการจำแนกตามกลุ่มงาน | `/modules/plan/reports/by-workgroup` |
| 16 | รายงานการจัดสรรงบประมาณ | `/modules/plan/reports/allocation-summary` |
| 17 | โครงการตามยุทธศาสตร์ | `/modules/plan/reports/by-strategy` |
| 18 | รายงานผลการดำเนินงาน | `/modules/plan/reports/owner-results` |
| 19 | โครงการเงินเหลือจ่าย | `/modules/plan/reports/surplus-projects` |
| 20 | คู่มือ | `/modules/plan/manual` |

### สิ่งที่ควรเช็ค

- **เมนู nav:** flyout 7 กลุ่ม — ตั้งค่าระบบ · โครงการประจำปี · เงินเหลือจ่าย · ตรวจสอบ · รายงานโครงการ · คู่มือ (กลุ่ม 2–4 เห็นเฉพาะ `login_status≤4` + มี perm add/edit/delete)
- ต้องมีปีปัจจุบันก่อนบันทึกโครงการ/กิจกรรม/ยุทธศาสตร์
- รหัสโครงการ annual (3 หลัก) / surplus (4 หลัก เริ่ม 1001) ไม่ซ้ำในปีเดียวกัน
- ลบโครงการไม่ได้ถ้ามีกิจกรรมอ้างอิง
- สิทธิ์: module admin ครบ · บุคลากรเขตต้องมีแถว `plan_permissions` ถึงจะ add/edit/delete
- ตรวจสอบ/รายงานจัดสรร: empty-state เมื่อไม่มี `budget_receive` · มีข้อมูลแล้วแสดงตาราง
- SMSS: ต้องมี `system_sync_smss_2` + เครือข่ายเข้าถึง SMSS ได้
- Pagination: 25 รายการต่อหน้า (โครงการ)

### ยังไม่รวม (phase ถัดไป)

- คู่มือ PDF จริง (`modules/plan/handbook/plan.pdf`)
- รายงานผลการดำเนินงานแบบฟอร์ม eval เต็ม (legacy eval_* fields)
- `budget_withdraw` / `budget_money_return` ในหน้ารายงานเหลือจ่าย (ต้องขยาย budget module)

---

## budget — การเงินและบัญชี

**สถานะ:** v2 พร้อมทดสอบ (ก.ค. 2569) — เมนูครบ Amssplus 9 กลุ่ม flyout + workflow เบิก→ฎีกา→จ่าย
**เทียบ amsscnt.com:** โมดูล `budget` — `budget_*` tables (~16 ตาราง)
**ADR:** [008-budget-module-full-menu.md](adr/008-budget-module-full-menu.md)

### ก่อนเริ่ม

- Login **ระดับเขต** (`login_status` 2–4) + สิทธิ์ `budget_permissions` (p1–p10) หรือ module admin
- Top nav — กลุ่ม L1 **การเงินและบัญชี** · in-module flyout 9 กลุ่ม
- กำหนดปีงบประมาณ + หมวดงบ (แผนงาน, งบรายจ่าย, ประเภทเงิน) ก่อนทดสอบ workflow

### เดินลอง (สรุป)

| ลำดับ | ทำอะไร | URL |
|------|--------|-----|
| 1 | หน้าโมดูล → รับงบประมาณ | `/modules/budget` |
| 2 | เจ้าหน้าที่การเงินฯ (admin) | `/modules/budget/permissions` |
| 3 | ปีงบ + หมวดงบ (p2) | `/modules/budget/years`, `/plans`, `/pay-types`, `/types` |
| 4 | รับจัดสรรงบประมาณ (p2) | `/modules/budget/allocation` |
| 5 | รับเงินงบ/นอกงบ/รายได้ (p5–p7) | `/modules/budget/receive/{budget,extra,income}` |
| 6 | ขอเบิกโครงการ (p3) | `/modules/budget/withdraw` |
| 7 | ฎีกา/คงคลัง (p4) | `/modules/budget/deega` |
| 8 | สั่งจ่าย (p5–p8) | `/modules/budget/pay/{budget,extra,income,reserve}` |
| 9 | อนุมัติ/จ่ายจริง (p1/p9) | `/modules/budget/approve/main`, `/pay-check/main` |
| 10 | เปลี่ยนแปลงสถานะ | `/modules/budget/status-change/budget` |
| 11 | ตรวจสอบ (p10) | `/modules/budget/checks/allocation` |
| 12 | รายงาน | `/modules/budget/reports/allocation` |

### สิ่งที่ควรเช็ค

- รับจัดสรร: CRUD `budget_receive` + แนบไฟล์ → ปลด empty-state ฝั่ง plan
- ขอเบิก: เชื่อม `plan_activities` ผ่าน `pj_activity`
- ฎีกา: เลือก `receive_num` จากใบงวด · อัปเดต `budget_withdraw.deega`
- สั่งจ่าย: อ้างอิง `refer_wd_id` / `refer_deega_id`
- MVP redirect: `/receive` → `/receive/budget`, `/disburse` → `/pay/budget`

### ข้อจำกัดที่ทราบ

- คู่มือ PDF placeholder (`/modules/budget/manual`)
- `approve/reserve` + `pay-check/reserve` รอบแรกเป็น read-only list
- ตรวจสอบบางรายการใช้ query ใกล้เคียง (ดู ADR 008)

---

## mail — ไปรษณีย์

**สถานะ:** **ปิดโมดูลแล้ว (มิ.ย. 2569)** — หนังสือรับ/ส่ง, เขียนหนังสือเวียน (ค้นหารายชื่อผู้รับ), ตอบรับ, แนบไฟล์, กลุ่มบุคลากร, เจ้าหน้าที่
**เทียบ amsscnt.com:** เมนู «**ไปรษณีย์**» (slug `mail`) — คู่มือ PDF/dump dev อาจเขียน «ระบบส่งหนังสือเวียน» แต่ production ชัยนาทใช้ชื่อสั้นนี้

### ก่อนเริ่ม

- Login บุคลากรที่ `login_status` ≤ 14 (หรือ module admin)
- ไฟล์แนบเก็บที่ `storage/mail/` (นอก public)
- ตั้งค่ากลุ่มและเจ้าหน้าที่: module admin ที่ `/modules/mail/groups` และ `/modules/mail/permissions`
- **ทดรายการเก่าจาก dump สงขลา (dev):** เหมือน [book](#book--รับส่งหนังสือราชการ) — `--scope=full --legacy-master` แล้ว login ด้วย `person_id` ที่มีใน `mail_sendto_answer`

### เดินลอง

| ลำดับ | ทำอะไร | URL |
|------|--------|-----|
| 1 | ทะเบียนจดหมายรับมา (flyout **ทะเบียนรับ** → รายการย่อย) + กรองตอบรับ | `/modules/mail/inbox` |
| 2 | ทะเบียนจดหมายส่งไป (flyout **ทะเบียนส่ง** → รายการย่อย) | `/modules/mail/sent` |
| 3 | เขียนหนังสือเวียน (drag-and-drop แนบไฟล์ก่อนส่ง) | `/modules/mail/new` |
| 4 | รายละเอียด + ตอบรับ + แนบไฟล์ | `/modules/mail/{id}` |
| 5 | กลุ่มบุคลากร (admin) | `/modules/mail/groups` |
| 6 | เจ้าหน้าที่ (admin) | `/modules/mail/permissions` |
| 7 | คู่มือไปรษณีย์ (flyout **คู่มือ** → รายการย่อย · placeholder) | `/modules/mail/manual` |

### สิ่งที่ควรเช็ค

- **เมนู nav:** hover **ทะเบียนรับ** → dropdown **ทะเบียนจดหมายรับมา** · hover **ทะเบียนส่ง** → dropdown **ทะเบียนจดหมายส่งไป** · hover **คู่มือ** → dropdown **คู่มือไปรษณีย์** (หัว flyout ไม่นำทาง) · หน้า inbox/sent หัวข้อตรงเมนูย่อย · หน้าคู่มือหัวข้อ **คู่มือ** + บรรทัดรอง **ไปรษณีย์** · ปุ่มบน `/modules/mail` ยังเป็น **ทะเบียนรับ** / **ทะเบียนส่ง**
- **ส่งถึง (2 section / 6 ตัวเลือก):** section «{ชื่อเขต}» — บุคลากรทุกคน · บุคลากรบางคน · ธุรการกลุ่ม/หน่วย (เลือกรายคนแยกตามกลุ่ม) · กลุ่ม/หน่วย (ติ๊กหลายกลุ่มได้ · ต่อกลุ่มเลือก «ส่งทั้งกลุ่ม» หรือ «เลือกรายคน» · โหมดรายคนต้องติ๊ก ≥1 คน) — section «โรงเรียนในสังกัด {ชื่อเขต}» — ผู้อำนวยการสถานศึกษา · ครูและบุคลากรในสถานศึกษา (เลือกรายคนแยกตามโรงเรียน)
- **หนังสือรับ:** เห็นเฉพาะที่ `send_to` = เลขบัตรของตนเอง
- **หนังสือส่ง:** เห็นเฉพาะที่ตนเป็นผู้ส่ง
- **ตอบรับ:** อัตโนมัติเมื่อผู้รับเปิดหน้ารายละเอียดครั้งแรก (เทียบ legacy `maildetail.php`)
- **แนบไฟล์ (หน้าเขียนจดหมาย):** ลากวางหรือคลิกเลือก · ไม่จำกัดจำนวนไฟล์ · ขนาดรวมสูงสุด 20MB ต่อจดหมาย · แสดง meter ขนาดรวมก่อนส่ง · doc/pdf/xls/รูป/zip · ตอนส่งแสดง progress แนบไฟล์
- **แนบไฟล์ (หน้ารายละเอียด):** ผู้ส่งแนบเพิ่มได้หลังส่งแล้ว · นับรวมขนาดกับไฟล์เดิมไม่เกิน 20MB ต่อจดหมาย · มีปุ่ม **ดาวน์โหลดทั้งหมด (ZIP)** เมื่อมี 2 ไฟล์ขึ้นไป
- **กลุ่มบุคลากร:** CRUD + เลือกสมาชิก · ใช้ตอนส่งหนังสือ
- **เจ้าหน้าที่:** กำหนด p1 (อนุญาตเป็นเจ้าหน้าที่) ตาม legacy `mail_permission`
- **Pagination:** 25 รายการต่อหน้า

### ยังไม่รวม (phase ถัดไป)

- popup เลือกโรงเรียน/บุคคลแบบละเอียด (legacy สำหรับผู้รับโรงเรียน)
- import ข้อมูล legacy `mail_main` จาก production

---

## meeting — ระบบจองห้องประชุม

**สถานะ:** v1 พร้อมทดสอบ (มิ.ย. 2569) — จองห้อง, ทะเบียน, ปฏิทินรายวัน, อนุมัติ, ห้อง, สิทธิ์ p1
**เทียบ amsscnt.com:** โมดูล `meeting` — จองห้องประชุม, ทะเบียนจอง, ปฏิทิน, อนุมัติเจ้าหน้าที่, กำหนดห้อง, สิทธิ์

### ก่อนเริ่ม

- Login **ระดับเขต** เท่านั้น (login_status 2–4 หรือ module admin)
- กำหนดห้องและสิทธิ์ที่ `/modules/meeting/rooms` และ `/modules/meeting/permissions` (ผู้ดูแลโมดูล)

### เดินลอง

| ลำดับ | ทำอะไร | URL |
|------|--------|-----|
| 1 | ทะเบียนจอง + กรองห้อง | `/modules/meeting/bookings` |
| 2 | จองห้องประชุมใหม่ | `/modules/meeting/bookings/new` |
| 3 | รายละเอียด + อนุมัติ/ลบ | `/modules/meeting/bookings/{id}` |
| 4 | ปฏิทินรายวัน (เลือกวัน/ห้อง) | `/modules/meeting/calendar` |
| 5 | กำหนดห้อง (admin) | `/modules/meeting/rooms` |
| 6 | สิทธิ์ p1 เจ้าหน้าที่ (admin) | `/modules/meeting/permissions` |

### สิ่งที่ควรเช็ค

- ฟิลด์: ห้อง, วันเริ่ม–สิ้นสุด (ปฏิทินจิ้ม **พ.ศ.**), เวลา 01–24 น., วัตถุประสงค์, จำนวนคน, อื่น ๆ
- **เขตเท่านั้น:** โรงเรียนเข้าโมดูลไม่ได้ (เทียบ legacy `login_status<=4`)
- สิทธิ์: p1 อนุมัติ · module admin จัดการห้อง/สิทธิ์
- สถานะ: รอพิจารณา / อนุมัติ / ไม่อนุมัติ
- ลบ: เฉพาะผู้จองรายการของตนเอง
- ปฏิทิน: แสดงรายการที่ครอบคลุมวันที่เลือก (ไม่ใช่ FullCalendar)
- Pagination: 20 รายการต่อหน้า

### ยังไม่รวม (phase ถัดไป)

- FullCalendar แบบ legacy (`calendar/fullcalendar`)
- หน้าอนุมัติแบบ batch (`main/officer` index 4)

---

## affair — ภารกิจผู้บริหาร

**สถานะ:** v1 พร้อมทดสอบ (มิ.ย. 2569) — รายการภารกิจ, บันทึก/แก้ไข, สิทธิ์ p1
**เทียบ amsscnt.com:** โมดูล `affair` — ภารกิจผู้อำนวยการ (legacy), รายการ, บันทึก, เจ้าหน้าที่

### ก่อนเริ่ม

- Top nav / หน้าแรก — กลุ่ม L1 **ภารกิจผู้บริหาร** มีรายการย่อย **ภารกิจผู้บริหาร** → `/modules/affair`
- Login **ระดับเขต** (login_status 2–4 หรือ module admin)
- กำหนดสิทธิ์ p1 ที่ `/modules/affair/permissions` (module admin)

### เดินลอง

| ลำดับ | ทำอะไร | URL |
|------|--------|-----|
| 1 | ภารกิจผู้บริหาร (flyout L1 → รายการย่อย) + ค้นหา | `/modules/affair` |
| 2 | บันทึกภารกิจใหม่ | `/modules/affair/new` |
| 3 | แก้ไขภารกิจ | `/modules/affair/{id}/edit` |
| 4 | สิทธิ์ p1 เจ้าหน้าที่ (admin) | `/modules/affair/permissions` |

### สิ่งที่ควรเช็ค

- **เมนู nav โมดูล:** แท็บ **ภารกิจผู้บริหาร** → รายการหลัก · **บันทึกภารกิจ** (ผู้มีสิทธิ์ p1)
- ฟิลด์: วันที่, เวลา, เรื่อง, สถานที่, ผู้ปฏิบัติ, หมายเหตุ
- ปุ่ม «เรียกข้อมูลล่าสุด» สำหรับเรื่อง/สถานที่ (เทียบ legacy livesearch)
- สิทธิ์: p1 + login_status≤4 บันทึกได้ · login_status≤14 ดูรายการได้
- Pagination: 20 รายการต่อหน้า

### ยังไม่รวม (phase ถัดไป)

- รายงานภารกิจ (`report_affair`, `report_delegate`)
- มุมมอง mobile แยก

---

## permission — ขออนุมัติไปราชการ

**สถานะ:** ยังไม่ implement — ข้าม

---

## car — ยานพาหนะ

**สถานะ:** v1 พร้อมทดสอบ (มิ.ย. 2569) — คำขอใช้รถ, อนุมัติ, ยานพาหนะ/คนขับ/ประเภท, สิทธิ์ p1
**เทียบ amsscnt.com:** โมดูล `car` — ขอใช้รถราชการ, รายการ, พิจารณาอนุมัติ, ตั้งค่ายานพาหนะและสิทธิ์

### ก่อนเริ่ม

- Login **ระดับเขต** (login_status 2–4 หรือ module admin)
- กำหนดประเภทรถ, ยานพาหนะ, พนักงานขับรถ และสิทธิ์ที่เมนูตั้งค่า (p1=1 เจ้าหน้าที่)

### เดินลอง

| ลำดับ | ทำอะไร | URL |
|------|--------|-----|
| 1 | รายการคำขอ + กรอง | `/modules/car/requests` |
| 2 | ขอใช้รถใหม่ | `/modules/car/requests/new` |
| 3 | รายละเอียด + อนุมัติ/ไม่อนุมัติ | `/modules/car/requests/{id}` |
| 4 | ยานพาหนะ CRUD | `/modules/car/vehicles` |
| 5 | พนักงานขับรถ | `/modules/car/drivers` |
| 6 | ประเภทรถ | `/modules/car/types` |
| 7 | สิทธิ์ p1 (1=เจ้าหน้าที่, 2=เห็นชอบ, 3=อนุมัติ) | `/modules/car/permissions` |

### สิ่งที่ควรเช็ค

- เลือกรถได้เฉพาะสถานะ «อนุญาตให้จองใช้งาน» (status=2)
- ฟิลด์: สถานที่, วัตถุประสงค์, ช่วงวันที่, เชื้อเพลิง
- สิทธิ์: p1=1 อนุมัติ/ดูรายการ · p1=3 อนุมัติคำขอ (บางโมดูล) · ตั้งค่าระบบโมดูลเฉพาะ `is_admin` · module admin ครบสิทธิ์งานปกติ
- สถานะคำขอ: รอพิจารณา / อนุมัติ / ไม่อนุมัติ
- Pagination: 25 รายการต่อหน้า

### ยังไม่รวม (phase ถัดไป)

- อัปโหลดรูปยานพาหนะ
- ขั้นตอนเจ้าหน้าที่/ผู้เห็นชอบแยกหน้า (officer, group)
- รายงานการใช้ยานพาหนะ (`car_report`) และใบเบิกน้ำมัน

---

## cabinet — ตู้เอกสาร / วาระประชุม

**สถานะ:** v1 พร้อมทดสอบ (มิ.ย. 2569) — รายการเอกสารตู้กลาง, อัปโหลด, สิทธิ์ p1
**เทียบ amsscnt.com:** โมดูล `cabinet` — เอกสารตู้กลาง (v1 แบบแบน, ยังไม่มีลิ้นชัก/แฟ้ม)

### ก่อนเริ่ม

- Login **ระดับเขต** (login_status 2–4 หรือ module admin / p1)

### เดินลอง

| ลำดับ | ทำอะไร | URL |
|------|--------|-----|
| 1 | รายการเอกสาร + ค้นหา | `/modules/cabinet` |
| 2 | อัปโหลดเอกสาร | `/modules/cabinet/upload` |
| 3 | ดาวน์โหลดไฟล์ | `/api/cabinet/{id}/download` |
| 4 | สิทธิ์ p1 (admin/p1) | `/modules/cabinet/permissions` |

### สิ่งที่ควรเช็ค

- ฟิลด์: ชื่อเรื่อง + ไฟล์แนบ (PDF/Office/รูป/ZIP สูงสุด 20MB)
- ลบ: เจ้าของเอกสาร หรือ p1/module admin
- Pagination: 20 รายการต่อหน้า

### ยังไม่รวม (phase ถัดไป)

- โครงสร้างตู้/ลิ้นชัก/แฟ้ม (`cabinet_cabinet`, `cabinet_tray`, `cabinet_file`)
- ตู้ส่วนบุคคล, ค้นหาเอกสาร, QR วาระประชุม

---

## news — ข่าว

**สถานะ:** v1 พร้อมทดสอบ (มิ.ย. 2569) — ชื่อเรื่อง, ประเภท, บันทึกข่าว, สิทธิ์ p1
**เทียบ amsscnt.com:** โมดูล `news` — ข่าวเรื่องปัจจุบัน, ประเภท, แนบไฟล์

### ก่อนเริ่ม

- Login **ระดับเขต** (login_status 2–4 หรือ module admin)
- กำหนดชื่อเรื่องที่ `/modules/news/mainitems` และประเภทที่ `/modules/news/sections`
- กำหนดสิทธิ์ p1 ที่ `/modules/news/permissions` (module admin)

### เดินลอง

| ลำดับ | ทำอะไร | URL |
|------|--------|-----|
| 1 | รายการข่าว + กรองประเภท | `/modules/news` |
| 2 | เพิ่มข่าว | `/modules/news/new` |
| 3 | แก้ไขข่าว | `/modules/news/{id}/edit` |
| 4 | ประเภทข่าว (admin) | `/modules/news/sections` |
| 5 | ชื่อเรื่องปัจจุบัน (admin) | `/modules/news/mainitems` |
| 6 | สิทธิ์ p1 (admin) | `/modules/news/permissions` |

### สิ่งที่ควรเช็ค

- ต้องมีชื่อเรื่อง `item_active=1` ก่อนบันทึกข่าว
- ฟิลด์: ประเภท, ข้อความ (250 ตัวอักษร), ไฟล์แนบ (ไม่บังคับ)
- สิทธิ์: p1 หรือ module admin บันทึกข่าวได้
- Pagination: 20 รายการต่อหน้า

### ยังไม่รวม (phase ถัดไป)

- รายงานข่าว (`report1`, `report2` ภายนอก)
- สิทธิ์โรงเรียน (`return_permission_sch`)

---

## achievement — ผลสัมฤทธิ์ทางการเรียน

**สถานะ:** v1 พร้อมทดสอบ (มิ.ย. 2569) — รายการคะแนน O-NET/NT, บันทึก/แก้ไข, สิทธิ์ p1/p2/p3
**เทียบ amsscnt.com:** โมดูล `achievement` — บันทึกคะแนน, รายงาน (รายงาน/นำเข้า CSV ยังไม่รวม v1)

### ก่อนเริ่ม

- Top nav / หน้าแรก — กลุ่ม L1 **บริหารงานวิชาการ** มีรายการย่อย **ผลสัมฤทธิ์ทางการเรียน** → `/modules/achievement`
- Login **ระดับเขต** (login_status 2–4 หรือ module admin)
- สิทธิ์ที่ `/modules/achievement/permissions` (module admin)

### เดินลอง

| ลำดับ | ทำอะไร | URL |
|------|--------|-----|
| 1 | รายการคะแนน + กรอง | `/modules/achievement/scores` |
| 2 | บันทึกคะแนนใหม่ | `/modules/achievement/scores/new` |
| 3 | แก้ไขคะแนน | `/modules/achievement/scores/{id}/edit` |
| 4 | สิทธิ์ (admin) | `/modules/achievement/permissions` |

### สิ่งที่ควรเช็ค

- ประเภท O-NET / NT · ชั้น ป.6 / ม.3 / ม.6
- คะแนน 8 วิชา + เฉลี่ยอัตโนมัติ
- ไม่ซ้ำ: โรงเรียน + ปี + ประเภท + ชั้น
- สิทธิ์: p1 O-NET · p2 NT · module admin จัดการสิทธิ์

---

## student_main — ข้อมูลนักเรียน

**สถานะ:** v1 พร้อมทดสอบ (มิ.ย. 2569) — รายชื่อ + ฟอร์ม, ปีการศึกษา, สิทธิ์ p1/p2 (login นักเรียนยังไม่รวม)
**เทียบ amsscnt.com:** โมดูล `student_main` — รายชื่อนักเรียน, ปรับปรุงข้อมูล, ปีการศึกษา

### ก่อนเริ่ม

- Top nav / หน้าแรก — กลุ่ม L1 **บริหารงานวิชาการ** มีรายการย่อย **ข้อมูลนักเรียน** → `/modules/student_main`
- Login **เขต** (2–4) หรือ **โรงเรียน** (12–15)
- กำหนดปีการศึกษาที่ `/modules/student_main/years` (ผู้ดูแล)

### เดินลอง

| ลำดับ | ทำอะไร | URL |
|------|--------|-----|
| 1 | รายชื่อ + ค้นหา/กรอง | `/modules/student_main/students` |
| 2 | เพิ่มนักเรียน | `/modules/student_main/students/new` |
| 3 | แก้ไข | `/modules/student_main/students/{id}/edit` |
| 4 | ปีการศึกษา (admin) | `/modules/student_main/years` |
| 5 | สิทธิ์ (admin) | `/modules/student_main/permissions` |

### สิ่งที่ควรเช็ค

- **เขต:** เห็นทุกโรงเรียน · **โรงเรียน:** เห็น/แก้ไขเฉพาะโรงเรียนตน
- ฟิลด์: เลขนักเรียน, เลขบัตร, ชื่อ, ชั้น, ห้อง
- ปีการศึกษา active ใช้เป็นค่าเริ่มต้นบนรายการ
- ไม่ซ้ำเลขนักเรียนต่อปี/โรงเรียน

---

## spacial_student — นักเรียนพิเศษ

**สถานะ:** v1 พร้อมทดสอบ (มิ.ย. 2569) — รายการนักเรียนพิเศษ + ฟอร์ม, สิทธิ์ p1/p2/p3
**เทียบ amsscnt.com:** โมดูล `spacial_student` — นักเรียนที่มีความต้องการพิเศษ (รายงาน/รูป/ช่วยเหลือ ยังไม่รวม v1)

### ก่อนเริ่ม

- Top nav / หน้าแรก — กลุ่ม L1 **บริหารงานวิชาการ** มีรายการย่อย **นักเรียนพิเศษ** → `/modules/spacial_student`
- Login **เขต** หรือ **โรงเรียน**
- มีข้อมูลนักเรียนใน `student_main` (เชื่อมด้วยเลขบัตร)

### เดินลอง

| ลำดับ | ทำอะไร | URL |
|------|--------|-----|
| 1 | รายการ + กรอง | `/modules/spacial_student/students` |
| 2 | เพิ่มรายการ | `/modules/spacial_student/students/new` |
| 3 | แก้ไข | `/modules/spacial_student/students/{id}/edit` |
| 4 | สิทธิ์ (admin) | `/modules/spacial_student/permissions` |

### สิ่งที่ควรเช็ค

- ประเภทความพิการ 9 ชนิด (ตาม legacy)
- **โรงเรียน:** บันทึกได้เฉพาะโรงเรียนตน
- ไม่ซ้ำ person_id + school_code
- แสดงชื่อจาก student_main เมื่อมีข้อมูล

---

<a id="bug-template"></a>

## เทมเพลตบั๊ก

```text
โมดูล (slug):
URL ระบบใหม่:
เทียบ amsscnt.com (เมนู/หน้า):
คาดหวัง:
เกิดจริง:
สิทธิ์ผู้ทดสอบ (p1/p2/p3, เขต/โรงเรียน):
```

ส่งข้อความแบบนี้ในแชทได้เลย ไม่ต้องอ้าง P###
