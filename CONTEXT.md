# มาตรฐานการเขียนโค้ด

นโยบายสำหรับ agent ทุก session — อ่านก่อน implement · รายละเอียดเพิ่มใน [`.cursor/rules/project-coding.mdc`](.cursor/rules/project-coding.mdc) และ [`.cursor/rules/ponytail.mdc`](.cursor/rules/ponytail.mdc)

## coding_rigor

เขียนโค้ดอย่างรัดกุม ไม่ให้เกิดบั๊ก และปลอดภัย

- diff เล็ก โฟกัสเฉพาะงานที่ขอ — ไม่ refactor นอก scope
- validate ที่ trust boundary: auth/scope guard · Zod schema ฝั่ง server · สิทธิ์โมดูล (`canAccess*`, `require*`)
- อัปโหลดไฟล์ใช้ **StandardAttachment** + path ที่ resolve จาก storage helper
- match conventions รอบไฟล์ที่แก้ (`@/` imports, naming เดิม)
- **การเชื่อมต่อและอ้างอิงฐานข้อมูล:** ให้เขียนโปรแกรมและอ้างอิงโครงสร้าง/ข้อมูลจาก [`AMSS.sql`](AMSS.sql) เท่านั้น ห้ามเชื่อมต่อหรือใช้อ้างอิงจากฐานข้อมูลอื่นนอกจากนี้โดยเด็ดขาด

_Avoid_: ข้าม page guard · ใส่ secret ใน repo · SQL string concat นอก Drizzle · อ้างอิง DB file อื่นนอกจาก [`AMSS.sql`](AMSS.sql)

## coding_tech_stack

check/update version ของ tech stack ในการเขียนโค้ดแต่ละครั้ง

- ก่อนเพิ่ม dependency หรือใช้ API ใหม่ — อ่าน [`package.json`](package.json) + lockfile ว่า version ปัจจุบันคืออะไร
- เมื่อแตะ toolchain หรือเจอ error จาก version mismatch — รัน `npm outdated` เปรียบเทียบ
- align runtime กับ [`engines`](package.json) / [`.nvmrc`](.nvmrc) (Node `>=22`)
- patch/minor ใน semver เดียวกันอัปได้ · major (TypeScript 7, ESLint 10) รอ ecosystem — ไม่ข้ามโดยไม่ตั้งใจ
- stack ปัจจุบัน: Next 16 · React 19 · TS 5 (build/lint) · TS7 native `tsgo` (`npm run typecheck`) · Drizzle 0.45 · PG 16/17

_Avoid_: ติด dependency ใหม่ถ้า stdlib หรือ package ที่มีอยู่ทำได้ · downgrade major โดยไม่วางแผน

## coding_low_code

เขียนโค้ดแบบ low code แต่ code ต้องใช้งานได้จริง

- YAGNI — ลบ/reuse มากกว่าเขียนใหม่ · ไม่สร้าง abstraction ใช้ครั้งเดียว
- ต่อ route → action → query ครบถ้วน · ไม่ทิ้ง stub/placeholder แทน feature ที่ user ขอ
- หลังแก้ app code ต้อง `npm run build` ผ่าน (type-check รวม)
- UI งานเดียวใช้ component ที่มีอยู่ก่อนสร้างใหม่

_Avoid_: dead code · TODO แทน implementation · helper 1 บรรทัดที่ไม่จำเป็น

# Glossary

## module_settings_menu

กลุ่มเมนู L3 ชื่อ **ตั้งค่าระบบ** ใน nav โมดูล — รวมลิงก์ config (ปี, สิทธิ์, master data) · **system_admin** (`canAccessModuleSettings`) เห็นลิงก์ครบ (`module_settings_nav_mode = full`) · **module_admin** เห็น section แต่เฉพาะ `…/permissions` (`mode = permissions`) · p1 / เจ้าหน้าที่ทั่วไปไม่เห็น section (`none`) · UI: heading **ตั้งค่าระบบ** + flyout **เมนูตั้งค่า** (บางโมดูล) · helper: `buildModuleSettingsNavSection` · ADR: [`docs/adr/004-module-settings-nav-visibility.md`](docs/adr/004-module-settings-nav-visibility.md)

## module_admin

ผู้ดูแลโมดูลใน `module_admins` (legacy `system_module_admin`) · มักได้สิทธิ์ตั้งค่าด้วย แต่ไม่เท่ากับ p1 หรือเจ้าหน้าที่ที่มีสิทธิ์ใน `{slug}_permissions`

## system_admin

ผู้ดูแลระบบ SMSS ทั้งหมด — `users.is_admin` (= legacy `system_user.smss_admin`) · เข้า `/admin/*` และ bypass สิทธิ์โมดูล · หลัง `npm run db:migrate-system-admin` มอบให้บุคลากรเขต `position_code=15` (นักวิชาการคอมพิวเตอร์) ที่มีแถว `users` · ไม่ใช้ `username=admin` · แยกจาก `module_admin`

## menu_group_general

กลุ่มเมนู L1 **บริหารงานทั่วไป** (`menu_groups.legacy_id = 1`) — flyout บน top nav และการ์ด `/home` แสดงเฉพาะ whitelist 6 โมดูลตามลำดับ: bookobec · bookregister · book · mail · permission · leave · โมดูลอื่นใน workgroup เดิม (car, meeting ฯลฯ) ไม่แสดงใน UI · config: `GENERAL_MENU_MODULES` ใน `get-app-menu.ts`

## menu_group_plan

กลุ่มเมนู L1 **การวางแผน** (legacy `menu_groups.legacy_id = 2`, DB ชื่อ «บริหารงบประมาณ») — flyout + การ์ด `/home` แสดงเฉพาะ `plan` ชื่อ **การวางแผน** · แยกจาก flyout **การเงินและบัญชี** ใน workgroup เดียวกัน · `preferFlyout` บังคับ dropdown แม้มีโมดูลเดียว · in-module flyout 7 กลุ่ม Amssplus · config: `PLAN_MENU_MODULES` ใน `get-app-menu.ts`

## plan_strategy

ยุทธศาสตร์ประจำปีงบ — legacy `plan_stregic` (`id_tegic`, `strategic`) · โครงการอ้างอิงผ่าน `plan_projects.code_tegy` (= `id_tegic`)

## plan_surplus

โครงการจากเงินเหลือจ่าย — legacy แยกตาราง `plan_proj_2` / `plan_acti_2` / `plan_acti_3` · Next.js ใช้ `plan_projects.project_kind = 'surplus'` + `plan_activity_funding` · รหัสโครงการ surplus มัก ≥ 1001

## code_approve

รหัสอ้างอิงงบจัดสรรต่อกิจกรรม — รูปแบบ `2_{budget_receive.num}` เชื่อม `plan_activities` กับ `budget_receive`

## deega

ฎีกา/ทะเบียนเงินคงคลัง — ตาราง `budget_deega` · เลข `deega_num` · อ้างอิง `receive_num` (ใบงวดจาก `budget_receive`) · เชื่อม `budget_withdraw.deega` เมื่อวางฎีกา

## budget_type

ประเภทย่อยของเงิน (per year) — `budget_type` · `category_id` 1=นอกงบ, 2=งบประมาณ, 3=รายได้แผ่นดิน · `type_id=200` ใน `budget_main` = งบประมาณหลัก

## menu_group_budget

กลุ่มเมนู L1 **การเงินและบัญชี** (virtual จาก legacy id 2) — flyout + การ์ด `/home` แสดงเฉพาะ `budget` ชื่อ **การเงินและบัญชี** · ซ่อน asset จาก UI · `preferFlyout` · config: `BUDGET_MENU_MODULES` ใน `get-app-menu.ts`

## menu_group_person

กลุ่มเมนู L1 **บริหารงานบุคคล** (legacy `menu_groups.legacy_id = 3`) — flyout + การ์ด `/home` แสดงเฉพาะ `person` ชื่อ **ข้อมูลพื้นฐานครูและบุคลากร** · ซ่อน award/homework จาก UI · `preferFlyout` · config: `PERSON_MENU_MODULES` ใน `get-app-menu.ts`

## menu_group_idocument

กลุ่มเมนู L1 **บันทึกข้อความ** (virtual จาก legacy id 1) — flyout + การ์ด `/home` แสดงเฉพาะ `idocument` ชื่อ **บันทึกข้อความ** · อยู่ถัดจาก **บริหารงานวิชาการ** · แยกจาก flyout **บริหารงานทั่วไป** · เขตเท่านั้น (`where_work = 1`) · `preferFlyout` · config: `IDOCUMENT_MENU_MODULES` ใน `get-app-menu.ts` · route `/modules/idocument` scaffold (empty list, `in_progress`)

## menu_group_affair

กลุ่มเมนู L1 **ภารกิจผู้บริหาร** (virtual จาก legacy id 1) — flyout + การ์ด `/home` แสดงเฉพาะ `affair` ชื่อ **ภารกิจผู้บริหาร** · อยู่ถัดจาก **บันทึกข้อความ** · แยกจาก flyout **บริหารงานทั่วไป** · `preferFlyout` · config: `AFFAIR_MENU_MODULES` ใน `get-app-menu.ts` · route `/modules/affair`

## menu_group_questionnaire

กลุ่มเมนู L1 **แบบสอบถาม** (virtual จาก legacy id 1) — flyout + การ์ด `/home` แสดงเฉพาะ `questionnaire` ชื่อ **แบบสอบถาม** · อยู่ถัดจาก **ภารกิจผู้บริหาร** · เขตและโรงเรียน (`where_work = 0`) · `preferFlyout` · config: `QUESTIONNAIRE_MENU_MODULES` ใน `get-app-menu.ts` · seed `npm run db:seed-questionnaire-module` · route `/modules/questionnaire` scaffold (empty list, `in_progress`)

## menu_group_academic

กลุ่มเมนู L1 **บริหารงานวิชาการ** (legacy `menu_groups.legacy_id = 4`) — flyout + การ์ด `/home` แสดง whitelist 5 รายการ: dltv · student_main · achievement · bets · spacial_student · ซ่อน warroom/opportunity/supervision/news จาก UI · config: `ACADEMIC_MENU_MODULES` ใน `get-app-menu.ts` · โมดูล `dltv` seed ด้วย `npm run db:seed-dltv-module`

## menu_group_alert

กลุ่มเมนู L1 **แจ้งเตือน** (legacy `menu_groups.legacy_id = 5`) — flyout + การ์ด `/home` แสดงเฉพาะ `alert` ชื่อ **แจ้งเตือน** · ท้ายสุดตาม legacy · เขตและโรงเรียน (`where_work = 0`) · `preferFlyout` · config: `ALERT_MENU_MODULES` ใน `get-app-menu.ts` · route `/modules/alert` scaffold (empty list, `in_progress`)

## mail

โมดูลไปรษณีย์ภายใน — slug `mail`, URL `/modules/mail/...` · nav L3: **ตั้งค่าระบบ** · **ไปรษณีย์** (รายการหลัก · ทะเบียนรับ flyout · ทะเบียนส่ง flyout · เขียนจดหมาย · คู่มือ flyout) · แผนที่เมนู legacy: [context.html §2.2](context.html#legacy-menu-mail)

## mail_receive_nav

หัว flyout nav **ทะเบียนรับ** ในโมดูล mail — กลุ่มเมนูรับจดหมาย (คลิกหัวไม่นำทาง · hover เปิดรายการย่อย)

## mail_inbox_register

**ทะเบียนจดหมายรับมา** — รายการจดหมายที่ส่งถึงผู้ login · URL `/modules/mail/inbox`

## mail_sent_nav

หัว flyout nav **ทะเบียนส่ง** ในโมดูล mail — กลุ่มเมนูส่งจดหมาย (คลิกหัวไม่นำทาง · hover เปิดรายการย่อย)

## mail_sent_register

**ทะเบียนจดหมายส่งไป** — รายการจดหมายที่ผู้ login เป็นผู้ส่ง · URL `/modules/mail/sent`

## mail_manual_nav

หัว flyout nav **คู่มือ** ในโมดูล mail — กลุ่มเมนูคู่มือ (คลิกหัวไม่นำทาง · hover เปิดรายการย่อย)

## mail_manual

**คู่มือไปรษณีย์** — หน้าคู่มือใช้งานโมดูล mail (placeholder) · URL `/modules/mail/manual`

## bookobec

โมดูลรับส่งหนังสือราชการ **สพฐ.** — slug `bookobec`, URL `/modules/bookobec/...` · แยกจาก `book` (รับส่งภายใน สพป.) · nav flyout: **ตั้งค่าระบบ** (smss admin) · **รายการหนังสือรับ** · **รายการหนังสือส่ง** · **คู่มือ** · แผนที่เมนู legacy: [context.html §2.2](context.html#legacy-menu-bookobec)

## bookobec_settings

เมนู L3 **ตั้งค่าระบบ** ในโมดูล bookobec — เฉพาะ `is_admin` (smss admin) เห็นและเข้า route ได้ · ย่อย: **กำหนดเจ้าหน้าที่** → `/modules/bookobec/permissions`

## bookobec_permissions

ตาราง `bookobec_permissions` — สิทธิ์เจ้าหน้าที่ bookobec (p1=รับ, p2=ส่ง, officer_person_id) · import จาก legacy `bookobec_permission` (`p1_bookobec`, `p2_bookobec`)

## bookobec_inbox

**รายการหนังสือรับ สพฐ.** — รายการหนังสือรับจากระบบ สพฐ. (legacy `receive_other`) · URL `/modules/bookobec/inbox`

## bookobec_sent

**รายการหนังสือส่ง สพฐ.** — รายการหนังสือส่งไป สพฐ. (legacy `send_report`) · URL `/modules/bookobec/sent`

## bookobec_manual_nav

หัว flyout nav **คู่มือ** ในโมดูล bookobec

## bookobec_manual

**คู่มือรับส่งหนังสือราชการ สพฐ.** — หน้าคู่มือ (placeholder) · URL `/modules/bookobec/manual`

## leave

โมดูลระบบการลา (ยื่นคำขอ อนุมัติ ปีงบ สิทธิ์ p1/p2) — slug `leave`, URL `/modules/leave/...` · มาตรฐาน **ระเบียบ 2555** · nav L3: **ตั้งค่าระบบ** · **ขออนุญาตลา** (บันทึก `/requests/new` · ทะเบียน `/requests` · มอบงาน) · **พิจารณาอนุมัติ** (inbox ตามสิทธิ viewer) · **ขอยกเลิกวันลา** · **รายงาน** · **คู่มือ** · แผนที่เมนู legacy: [context.html §2.2](context.html#s2-2)

## leave_register

ทะเบียนคำขอลาของตัวเอง — URL `/modules/leave/requests` · แก้ไข/ลบได้ก่อนอนุมัติ · เมนูแยกจาก **บันทึกขออนุญาตลา** (`/requests/new`)

## leave_type

ประเภทการลาตามระเบียบ 2555 — บางประเภทจำกัดสิทธิ์ตาม **sex** ของบุคลากร (เช่น ลาคลอดบุตร, ลาอุปสมบท)

## leave_request

คำขอลาหนึ่งรายการของบุคลากร — มีประเภทลา ช่วงวัน จำนวนวัน และสถานะการอนุมัติ

## leave_request_form

ฟอร์มยื่นคำขอลา — Single-Page Task Form: เลือกประเภทลาครบ 10 แบบ 2555 ในหน้าเดียว (dropdown + optgroup กรองตามเพศ · แสดงโควต้าในรายการ) · วันลา/ครึ่งวัน · เหตุผลหลัก · optional collapsible (ติดต่อ/แนบ/มอบงาน) · preview หนังสือ on-demand · sticky สรุป+ยื่นบนมือถือ · เดสก์ท็อป = `leave_request_sidebar` · มือถือ = สิทธิและสถิติในฟอร์มหลักเต็มความกว้าง · URL `/modules/leave/requests/new` · ไม่แยกทางเข้าป่วย/พักผ่อนแบบ legacy
_Avoid_: wizard หลายขั้น · การ์ดประเภทลา 10 ใบ · radio list ประเภทลา · preview หนังสือเต็มหน้าบังฟอร์ม · intent chips / `?group=` preset

## leave_request_sidebar

aside sticky เดสก์ท็อป — รวม `สิทธิและสถิติ` (ตาราง compact ไม่ scroll แนวนอน) ต่อด้วย `leave_request_summary` · มือถือไม่ใช้ sidebar นี้

## leave_request_summary

แถบยืนยันคำขอก่อนยื่น — aside เดสก์ท็อป = สรุปอย่างเดียว · มือถือ sticky = สรุป + ปุ่มยื่น/ยกเลิก · ปุ่มบนเดสก์ท็อปอยู่ท้ายฟอร์มเต็มความกว้าง · แสดงประเภท · ช่วงวันลา · ครึ่งวัน · จำนวนวัน · สิทธิคงเหลือ · เตือนเกินโควต้า · **ไม่** รวมตารางสถิติ 4 แถว (อยู่ในแผงโควต้าใน `leave_request_sidebar`)

## legacy_leave

ตาราง `la_*` จาก dump PHP — staging อ่านอย่างเดียวสำหรับ import · แอป runtime ใช้ `leave_*` เท่านั้น

## legacy_leave_person

บุคลากรที่สร้างจาก import เพื่ออ้างอิงประวัติลา legacy — เมื่อ `person_id` ใน `la_*` ไม่มีใน master ปัจจุบัน · ชื่อจาก `person_main`/`person_sch_main` ถ้ามี · ไม่มีใช้ placeholder **ประวัติลา** + เลขบัตร · **อัปเดตเป็นชื่อจริงได้** เมื่อโหลด `person_main` เข้า legacy แล้วรัน refresh ชื่อ

## demo_staff

บุคลากรสังเคราะห์สำหรับ dev/UAT — ช่วง `person_id` `1701999990xxx` (สพป.ชัยนาท) · แยกจาก `legacy_leave_person` และข้อมูล production · seed ด้วย `npm run db:seed-leave-demo` · ลบด้วย `--reset`

## leave_cancellation

คำขอยกเลิกวันลาที่อนุมัติแล้ว — อ้างอิง `leave_request` หนึ่งรายการ · มี workflow อนุมัติของตัวเอง · หนึ่งคำขอยกเลิกต่อหนึ่งคำขอลา

## leave_person_settings

ตั้งค่าผู้ลงนามรายบุคคล (legacy `la_person_set`) — `comment_person_id` ผอ.กลุ่ม · `comment_person2_id` รอง ผอ.สพท. · `grant_person_id` ผู้อนุมัติ · UI `/modules/leave/grant-persons`

## leave_collect

วันลาพักผ่อนสะสมต่อปีงบ (legacy `la_collect`) — `collect_day` สะสม · `this_year_day` ประจำปี · ถ้ามีแถวปีปัจจุบัน ฟอร์มยื่นลาพักผ่อนใช้ค่านี้แทนการคำนวณอัตโนมัติ

## permission_period

ช่วงลาที่อนุมัติแล้วที่อ้างอิงในคำขอยกเลิก — snapshot จากคำขอต้นทาง (เริ่ม/สิ้นสุด/จำนวนวัน/ประเภท)

## leave_quota

สิทธิ์ลาคงเหลือต่อปีงบประมาณตามประเภท — คำนวณจากระเบียบ 2555 และคำขอที่อนุมัติแล้ว

## leave_approval

ขั้นตอนการพิจารณาคำขอลา (ระเบียบ 2555 + legacy) — **เจ้าหน้าที่** → **ผอ.กลุ่ม** (`group_sign`) → (รอง ผอ. `group_sign2` คู่ขนาน ไม่บล็อก) → **ผู้อนุมัติ** (ผอ.เขต หรือ รอง ผอ. p2 สำหรับบุคลากร รร.) · มอบงานแสดงสถานะอย่างเดียว ไม่บล็อก

## leave_statistics

สถิติการลาในปีงบประมาณบนฟอร์มยื่น — คำนวณอัตโนมัติ read-only (ลามาแล้ว · ลาครั้งนี้ · รวม) สำหรับป่วย/กิจ/คลอด/พักผ่อน · บันทึก snapshot ลงคำขอตอนยื่น

## leave_reports

กลุ่มรายงานโมดูลการลา — รายการลา/ยกเลิก (pagination, พิมพ์) และสถิติป่วย/กิจ/คลอด/พักผ่อน · แบบพิมพ์ใบลารายบุคคล (`print_report*`) ยังไม่รวม v1

## leave_reports_menu

เมนู flyout **รายงาน** ในโมดูลการลา — ลิงก์ตรงไปแต่ละรายงาน (ไม่ผ่าน hub ใน nav) · hub `/modules/leave/reports` ยังเปิดได้ทาง URL · รายการหลัก 6 แบบตาม legacy เขต · ป้ายเมนู **ใช้งานได้** (`route status: ready`)

## school_principal_report_viewer

ผู้ใช้โรงเรียนที่ดูรายงานระดับเขตได้ (ยกเว้นสถิติพักผ่อน) — **ผู้อำนวยการสถานศึกษา** (`position_code` 1) หรือ **รักษาการในตำแหน่ง ผอ.รร.** (บันทึกใน `person_delegate` ครอบคลุมวันปัจจุบัน)
_Avoid_: ผอ.รร., รก.ผอ. (ใช้ในคำพูดได้ แต่ในโค้ด/เอกสารใช้คำนี้)

## leave_manual

คู่มือใช้งานโมดูลการลา — flyout **คู่มือ** → **คู่มือการลา** · หน้า `/modules/leave/manual` · เนื้อหา in-app (สารบัญ เมนูย่อย ลิงก์ไปหน้างาน ประเภทลา 1–10) · legacy เดิมเป็น `la.pdf`

## leave_job_handover

การมอบงานระหว่างลา — ผู้ยื่นเลือก `job_person_id` บนฟอร์ม · ผู้รับเห็น inbox ที่ `/modules/leave/job-handover` และกดรับมอบ (`job_person_signed`) · **ไม่บล็อก** ขั้นอนุมัติ (officer/group/commander) — แสดงสถานะอย่างเดียว ตาม legacy

## leave_approval_loop

ขอบเขตงานอนุมัติคำขอลาแบบครบวงจร — **ทั้งเขตและโรงเรียน** (`leave_request` ของ `person_main` และ `person_sch_main`) ตั้งแต่ยื่นจน `commander_grant = 1` · รวม inbox เจ้าหน้าที่ ชั้นต้น ผู้อนุมัติเขต และ **grant2** (รอง ผอ.สพท. p2 อนุมัติแทนในส่วนโรงเรียน) · **ยังไม่รวม** `leave_cancellation` ในรอบนี้
_Avoid_: loop การลา (กว้างเกิน — ใช้ระบุขอบเขตงาน)

## module_approval_nav

pattern การมองเห็นหน้าอนุมัติทุกโมดูล — resolver ใน layout (`resolve*ApprovalNav*`) · nav กรองรายการ/flyout · page guard `canAccess*Inbox` · detail ซ่อนฟอร์มด้วย check เดียวกัน · แหล่งสิทธิ์: person settings (leave/permission) หรือ module p1 (car/meeting บน detail) · บันทึกใน [ADR 003](docs/adr/003-module-approval-visibility.md)
_Avoid_: hardcode inbox ใน nav client โดยไม่ผ่าน resolver · หน้า inbox ไม่มี redirect เมื่อไม่มีสิทธิ์

## leave_approval_nav

flyout **พิจารณาอนุมัติ** ใน nav โมดูลการลา — inbox คำขอลาเท่านั้น (group · group2 · commander) ตาม `leave_person_settings` · คิวยกเลิกวันลาอยู่ flyout **ขอยกเลิกวันลา** (`resolveLeaveCancellationApprovalNavItems`) · ซ่อน flyout/รายการถ้า viewer ไม่มีสิทธิ์ · แยกจาก flyout **ขออนุญาตลา**
_Avoid_: ซ่อน inbox อนุมัติใต้ “ขออนุญาตลา” · แสดงคิวอนุมัติให้บุคลากรทั่วไป

## leave_approval_inbox

คิวพิจารณาตามบทบาท — workflow 3 ขั้น: ผู้ลา → ผอ.กลุ่ม → ผู้อนุมัติขั้นสุดท้าย · **คำขอลา (เขต):** `/modules/leave/approvals/group` · `/modules/leave/approvals/group2` (รอง ผอ.สพท.) · **คำขอลา (บุคลากร รร.):** `/modules/leave/approvals/group` · `/modules/leave/approvals/commander` (ผอ.สพท.) · **ขอยกเลิกวันลา:** `/modules/leave/cancellations/approvals/group` · `/modules/leave/cancellations/approvals/group2` (เขต) · `/modules/leave/cancellations/approvals/commander` (รร.) · URL เดิม `/approvals/officer` และ `/approvals/school-deputy` redirect ไปทะเบียนการลา

## last_leave

ลาครั้งสุดท้ายของประเภทเดียวกัน — ดึงจากคำขอที่อนุมัติแล้วล่าสุด · แสดง read-only บนฟอร์ม (ไม่ให้แก้มือ)

## leave_group_approval

ขั้นอนุมัติหลังยื่นคำขอ — **ลำดับเดียว (ไม่คู่ขนาน):**
- **group_sign** (`comment_person` / ผอ.กลุ่ม) — inbox `/modules/leave/approvals/group` · ลงนามแล้วตั้ง `group_date`
- **ขั้นสุดท้าย (เขต):** `comment_person2` / รอง ผอ.สพท. — inbox `/modules/leave/approvals/group2` · ลงนามแล้วตั้ง `group_date2` + `commander_grant = 1`
- **ขั้นสุดท้าย (บุคลากร รร.):** `grant_person` / ผอ.สพท. — inbox `/modules/leave/approvals/commander` · ลงนามแล้วตั้ง `commander_*` + `commander_grant = 1`
_Avoid_: ขั้นเจ้าหน้าที่ (`officer_date`) และ inbox school-deputy (grant2) — ตัดออกจาก workflow แล้ว

## no_comment

คอลัมน์ legacy `no_comment` ยังอยู่ใน DB · **ไม่มีในฟอร์มยื่นแล้ว** — ทุกคำขอต้องผ่านผอ.กลุ่ม

## grant_person_selected

คอลัมน์ legacy `grant_person_selected` ยังอยู่ใน DB · **ไม่มีในฟอร์มยื่นแล้ว** — ผู้อนุมัติขั้นสุดท้ายมาจาก `leave_person_settings` ตาม `school_id`

## school_grant_deputy

รองผู้อำนวยการ สพท. ใน `leave_permissions` p1=0 p2=1 (legacy `permission2` / `grant2`) — ตั้งค่าที่ `/modules/leave/school-grant-persons` · **ไม่ใช้ใน workflow อนุมัติแล้ว** (เดิม inbox `/approvals/school-deputy`) · บุคลากรโรงเรียนอนุมัติขั้นสุดท้ายที่ `grant_person` ใน `leave_person_settings` เท่านั้น

## half_day

ลา 0.5 วัน — ต้องเป็นวันเดียว · เลือกช่วงเช้าหรือบ่าย · บนฟอร์มยื่นเลือกโหมดครึ่งวันและช่วงก่อนปฏิทิน · ระบบ sync วันสิ้นสุดให้เท่าวันเริ่มอัตโนมัติ

## leave_attachment

ไฟล์หลักฐานประกอบคำขอลา — แสดงช่องแนบ **ทุกประเภท** เมื่อเลือกประเภทแล้ว · ไม่บังคับทั่วไป · **ลาป่วย ≥30 วัน** ยังบังคับ (ข้อ 18, 2555 ชนะ legacy) · ชนิดไฟล์ตาม **StandardAttachment**

## StandardAttachment

ชนิดไฟล์ที่อนุญาตอัปโหลดใหม่ทุกโมดูล — docx, xlsx, pptx, pdf, jpg, jpeg, png · ดู [ADR 002](docs/adr/002-standard-attachment-file-types.md) · config: `src/lib/form/attachment-allowed-types.ts`

## form_validation

ฟอร์มตรวจข้อมูลฝั่ง client ด้วย Zod schema เดียวกับ server · ใช้ `noValidate` ปิด popup ภาษาอังกฤษของ browser · แสดงข้อความภาษาไทย **inline ใต้ช่องที่ผิด** (ทุกช่องพร้อมกัน) · แบนเนอร์เฉพาะ error จาก server (เช่น โควต้าเกิน)

## thai_mobile_phone

ช่องเบอร์มือถือไทย — ว่างได้ถ้าไม่บังคับ · ถ้ากรอกต้องเป็น **10 หลัก** ขึ้นต้น **06, 08 หรือ 09** · เก็บเป็นตัวเลขล้วน · paste `+66` / ขีดคั่น normalize ได้ · UI hint `รูปแบบ 08 xxxx xxxx` · ขณะพิมพ์ error เฉพาะตัวอักษร · ยื่นไม่ครบ/ไม่ถูก → "กรุณากรอกเบอร์ให้ครบ 10 หลัก" · utility: `src/lib/form/thai-mobile-phone.ts`

## permission

โมดูลขออนุญาต**ไปราชการ** — ไม่ใช่การลา (slug `permission`) · workflow 2 ขั้น: `basic_grant` (ผู้บังคับบัญชาชั้นต้น) → `grant_status` (ผู้อนุมัติขั้นสุดท้าย) · ตั้งค่าผู้อนุมัติรายบุคคลที่ `permission_person_settings` (`/modules/permission/grant-persons`)

## permission_nav

เมนู flyout โมดูล permission 4 กลุ่ม: ตั้งค่าระบบ · ขออนุญาตไปราชการ · รายงาน · คู่มือ

## permission_basic_comment

ขั้นผู้บังคับบัญชาชั้นต้น — inbox `/modules/permission/approvals/basic` · คอลัมน์ `basic_grant` / `basic_comment`

## permission_grant

ขั้นผู้อนุมัติขั้นสุดท้าย — inbox `/modules/permission/approvals/grant` · คอลัมน์ `grant_status`

## permission_person_settings

กำหนด `group_person_id` / `grant_person_id` ต่อผู้ขอ (เทียบ `leave_person_settings`) · UI `/modules/permission/grant-persons`

## permission_vehicle

ตัวเลือกพาหนะตอนยื่นคำขอ (ว่างได้) — รถยนต์สำนักงาน นข1565 / บจ543 ชัยนาท · รถยนต์ส่วนตัว (ต้องระบุหมายเลขทะเบียน) · อื่น ๆ (ต้องระบุข้อความ) · เก็บข้อความสรุปใน `permission_requests.vehicle` · ไม่ผูกโมดูล `car`

## permission_attachment

ไฟล์แนบคำขอไปราชการ (ไม่บังคับ) · ถ้าแนบต้องเป็น **StandardAttachment** (docx, xlsx, pptx, pdf, jpg, jpeg, png) · ตาราง `permission_request_files` · storage `storage/permission/requests/` · ดาวน์โหลด `/api/permission/requests/{id}/files/{fileId}` · คอลัมน์ `document` เก็บชื่อไฟล์ต้นฉบับเมื่อมีไฟล์

## permission_report_today

รายงานคนที่ช่วงไปราชการครอบคลุม**วันนี้** (timezone Bangkok) — `/modules/permission/reports/today` · ไม่มี date picker · ไม่รับ `?date=`

## permission_report_print

รายการคำขอไปราชการของผู้ใช้ที่ล็อกอินทั้งหมด สำหรับพิมพ์/PDF — `/modules/permission/reports/print` · ไม่มี scope selector · ไม่รับ `?scope=`

## permission_manual

คู่มือ in-app — `/modules/permission/manual`

## permission_register

ทะเบียนคำขอไปราชการของผู้ใช้ที่ล็อกอิน — `/modules/permission/requests` · เมนู **บันทึกขออนุญาตไปราชการ** เปิดหน้านี้ · ปุ่ม **เขียนขออนุญาตไปราชการ** ไปฟอร์ม `/modules/permission/requests/new` · แยกจาก `permission_org_travel_reference` (ตารางอ้างอิงหน่วยงานใต้ฟอร์ม)

## permission_org_travel_reference

ตารางอ้างอิง read-only บนหน้าบันทึกขอไปราชการ (`/modules/permission/requests/new`) — รายการคำขอไปราชการของทุกคนในหน่วยงานที่ user สังกัด (สำนักงานเขต: `school_id` null · โรงเรียน: `school_id` ตรง scope) · กรองตามปีงบ permission ที่เปิดใช้ (ถ้ามี) · **ไม่ใช่**โมดูล `leave` · CRUD อยู่ `/modules/permission/requests` · รายงานเต็ม `/modules/permission/reports/all`

## person

บันทึกข้อมูลบุคลากร (ข้าราชการ/พนักงาน) ในองค์กร — แหล่ง master ของตัวตนและคุณลักษณะส่วนบุคคลที่โมดูลอื่นอ้างอิง

## position_code

รหัสตำแหน่งบุคลากรใน `people.position_code` — อ้าง master legacy **`person_position`** (รหัส 1–22) · ค่า 0 = ยังไม่ระบุ/ทั่วไปใน Next.js

## person_position

รายการชื่อตำแหน่งมาตรฐาน สพป. — static map ในโค้ด (ตรง legacy `person_position`) · **ไม่รวม**ระดับวิทยฐานะ (`person_position_class`)

## prefix

คำนำหน้าชื่อข้าราชการ — เลือกจาก **นาย**, **นาง**, **นางสาว** (ตรง legacy `person_main.prename`)

## sex

เพศชายหรือหญิงของบุคลากร — **ได้จาก prefix อัตโนมัติ** เมื่อบันทึก (นาย → ชาย, นาง/นางสาว → หญิง) · ใช้กำหนดสิทธิ์ประเภทลาตามระเบียบ 2555 · ไม่แก้แยกในฟอร์ม

_Avoid_: gender (ใน domain นี้ใช้ **sex**)
