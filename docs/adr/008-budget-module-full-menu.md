# ADR 008: budget — เมนูครบ Amssplus + workflow เบิก→ฎีกา→จ่าย

## Status

Accepted (ก.ค. 2569)

## Context

โมดูล `budget` v1 (MVP) มีแค่ปีงบประมาณ + ทะเบียนรับ/จ่าย `type_id=200` · legacy Amssplus มี 9 กลุ่ม flyout ~50 เมนู รวม `budget_receive`, `budget_withdraw`, `budget_deega`, อนุมัติ/จ่าย, ตรวจสอบ 11 รายการ, รายงาน 12 รายการ · plan module อ่าน `budget_receive` แต่ไม่มี UI รับจัดสรรจนกว่าจะขยาย budget

## Decision

1. **In-module flyout** ตรง Amssplus 9 กลุ่ม — `src/lib/budget/nav-config.ts` · L1 ยังเป็นรายการเดียว «การเงินและบัญชี»
2. **Schema legacy** — migration `0034_budget_full_menu.sql` เพิ่ม 12 ตาราง (รวม `budget_reserve_money`)
3. **สิทธิ์** — `budget_permissions` p1–p10 ตาม `menu.php` (p2=ตั้งค่า+จัดสรร, p3=เบิก, p4=ฎีกา, p5–p7=รับ/จ่าย/เปลี่ยนสถานะตามประเภทเงิน, p8=ทดรอง, p1=อนุมัติ, p9=จ่ายจริง, p10=ตรวจสอบ)
4. **MVP redirect** — `/receive` → `/receive/budget`, `/disburse` → `/pay/budget`
5. **Workflow** — withdraw → deega → pay (`refer_wd_id`/`refer_deega_id` ใน `budget_main`)
6. **Self-check** — `src/lib/budget/nav-self-check.ts`

## Consequences

- รับนอกงบ/รายได้ต้องตั้ง `budget_type` ก่อน (empty-state ชี้ไปตั้งค่า)
- `approve/reserve` + `pay-check/reserve` รอบแรกเป็น read-only list
- คู่มือ PDF ยัง placeholder (`/modules/budget/manual`)
- ตรวจสอบบางรายการใช้ query ใกล้เคียงแทน bespoke SQL (ponytail)
