# โมดูลและเมนู AMSS (Legacy)

เอกสารอ้างอิง domain จากระบบ `smart_kpp2` สำหรับ migrate ไป AMSS-Laravel

**แหล่งข้อมูล:** `system_menugroup`, `system_module` (MySQL `smart_area`), `modules/*/menu.php`, `admin/menu.php`, `menu.php`

## สถาปัตยกรรมเมนู

1. **เมนูหลัก** — DB `system_menugroup` → `system_module` ( [`smart_kpp2/menu.php`](../smart_kpp2/menu.php) )
2. **เมนูย่อยในโมดูล** — PHP [`smart_kpp2/modules/{code}/menu.php`](../smart_kpp2/modules/)
3. **Routing** — `?option={module}&task={path}` → include `modules/{option}/{task}.php`

## ภาพรวมกลุ่มเมนู

| menugroup | ชื่อไทย | จำนวน module |
|-----------|---------|--------------|
| 1 | บริหารงานทั่วไป | 16 |
| 2 | บริหารงบประมาณ | 3 |
| 3 | บริหารงานบุคคล | 3 |
| 4 | บริหารงานวิชาการ | 7 |
| 5 | แจ้งเตือน | 1 |

## สารบัญ Module (ตามกลุ่ม)

### กลุ่ม 1 — บริหารงานทั่วไป

| module | ชื่อไทย | active | โฟลเดอร์ | สถานะ migrate |
|--------|---------|--------|----------|---------------|
| la | ระบบการลา | 1 | modules/leave/ | — |
| permission | ขออนุมัติไปราชการ | 1 | modules/permission/ | — |
| idocument | ระบบบันทึกข้อความ | 1 | modules/idocument/ | — |
| car | ยานพาหนะ | 1 | modules/car/ | placeholder |
| security_duty | เวรรักษาการณ์ | 0 | — | — |
| affair | ภารกิจผู้อำนวยการ | 1 | modules/affair/ | — |
| bookpv | รับส่งหนังสือราชการศธจ. | 0 | — | — |
| delegate | การรักษาราชการแทน | 1 | modules/delegate/ | — |
| bookobec | รับส่งหนังสือราชการสพฐ | 1 | modules/bookobec/ | migrated |
| bookregister | ทะเบียนหนังสือราชการ | 1 | modules/bookregister/ | placeholder |
| book | รับส่งหนังสือราชการ | 1 | modules/book/ | — |
| mail | ระบบส่งหนังสือเวียน | 1 | modules/mail/ | — |
| meeting | ระบบจองห้องประชุม | 1 | modules/meeting/ | placeholder |
| work | ลงเวลาการปฏิบัติราชการ | 0 | modules/work/ | — |
| cabinet | ระบบวาระประชุมแผ่นเดียว QR-CODE | 0 | modules/cabinet/ | — |
| time | ระบบลงเวลา | 0 | — | — |

### กลุ่ม 2 — บริหารงบประมาณ

| module | ชื่อไทย | active | โฟลเดอร์ | สถานะ migrate |
|--------|---------|--------|----------|---------------|
| asset | ระบบบริหารพัสดุ | 1 | — | — |
| plan | การวางแผน | 1 | modules/plan/ | — |
| budget | การเงินและบัญชี | 1 | modules/budget/ | — |

### กลุ่ม 3 — บริหารงานบุคคล

| module | ชื่อไทย | active | โฟลเดอร์ | สถานะ migrate |
|--------|---------|--------|----------|---------------|
| award | ระบบรายงานการได้รับรางวัลประเภทต่างๆ | 1 | modules/award/ | — |
| homework | ขออนุญาตปฏิบัติราชการที่บ้าน | 0 | — | — |
| person | ระบบบริหารงานบุคคล | 1 | modules/person/ | — |

### กลุ่ม 4 — บริหารงานวิชาการ

| module | ชื่อไทย | active | โฟลเดอร์ | สถานะ migrate |
|--------|---------|--------|----------|---------------|
| warroom | วิเคราะห์สภาพการณ์ | 1 | — | — |
| opportunity | สิทธิและโอกาสทางการศึกษา | 1 | — | — |
| supervision | นิเทศ ติดตาม และประเมินผล | 1 | modules/supervision/ | — |
| student_main | ข้อมูลนักเรียน | 1 | modules/student_main/ | — |
| achievement | ผลสัมฤทธิ์ทางการเรียน | 1 | modules/achievement/ | — |
| bets | ระบบทดสอบการศึกษา | 1 | modules/bets/ | — |
| spacial_student | นักเรียนพิเศษ | 1 | modules/spacial_student/ | — |

### กลุ่ม 5 — แจ้งเตือน

| module | ชื่อไทย | active | โฟลเดอร์ | สถานะ migrate |
|--------|---------|--------|----------|---------------|
| alert | แจ้งเตือน | 1 | modules/alert/ | — |

## เมนูย่อยแต่ละ Module

### la — ระบบการลา

| เมนู | legacy URL | หมายเหตุ |
|------|------------|----------|
|  รายการหลัก | `?option=leave` | DB option=la |
|  ตั้งค่าระบบ | `?option=leave` | DB option=la |
|  กำหนดปีงบประมาณ | `?option=leave&task=budget_year` | DB option=la |
|  กำหนดเจ้าหน้าที่ | `?option=leave&task=permission` | DB option=la |
|  กำหนดผู้อนุมัติ(ในสพท) | `?option=leave&task=set_grant_person` | DB option=la |
|  กำหนดผู้อนุมัติผอ.โรงเรียน | `?option=leave&task=permission2` | DB option=la |
|  วันลาสะสม | `?option=leave&task=main/collection` | DB option=la |
|  ขออนุญาตลา | `?option=leave` | DB option=la |
|  บันทึกขออนุญาตลา | `?option=leave&task=main/leave_main` | DB option=la |
|  รับมอบงาน | `?option=leave&task=main/job_person` | DB option=la |
|  เจ้าหน้าที่การลา | `?option=leave&task=main/leave_officer_comment` | DB option=la |
|  ผู้บังคับบัญชาขั้นต้น (ผอ.กลุ่ม) | `?option=leave&task=main/basic_comment` | DB option=la |
|  ผู้บังคับบัญชาขั้นต้น (รอง ผอ.สพท.) | `?option=leave&task=main/basic_comment2` | DB option=la |
|  ผู้บังคับบัญชา (ผู้อนุมัติ) | `?option=leave&task=main/grant` | DB option=la |
|  ผู้ปฏิบัติราชการแทนอนุมัติในส่วนโรงเรียน | `?option=leave&task=main/grant2` | DB option=la |
|  ขอยกเลิกวันลา | `?option=leave&task=main/leave_cancel` | DB option=la |
|  ขอยกเลิกวันลา | `?option=leave` | DB option=la |
|  เจ้าหน้าที่การลา | `?option=leave&task=main/cancel_leave_officer_comment` | DB option=la |
|  ผู้บังคับบัญชาขั้นต้น | `?option=leave&task=main/cancel_basic_comment` | DB option=la |
|  ผู้บังคับบัญชา (ผู้อนุมัติ) | `?option=leave&task=main/cancel_grant` | DB option=la |
|  รายงาน | `?option=leave` | DB option=la |
|  ขออนุญาตลาวันนี้ | `?option=leave&&task=main/report_1` | DB option=la |
|  ขออนุญาตลาทั้งหมด | `?option=leave&&task=main/report_2` | DB option=la |
|  ขอยกเลิกวันลาทั้งหมด | `?option=leave&&task=main/report_3` | DB option=la |
|  สถิติการลาป่วย กิจ คลอด | `?option=leave&&task=main/report_4` | DB option=la |
|  สถิติการลาพักผ่่อน | `?option=leave&&task=main/report_5` | DB option=la |
|  สถิติการลาผอ.โรงเรียน | `?option=leave&task=main/report_4_sch` | DB option=la |
|  รายงาน | `?option=leave&task=main/report_4_sch` | DB option=la |
|  สถิติการลาป่วย กิจ คลอด | `?option=leave&task=main/report_4_sch2` | DB option=la |
| ขอยกเลิกวันลา | `?option=leave&&task=main/report_3_sch` | DB option=la |
|  คู่มือ | `?option=leave` | DB option=la |
|  คู่มือการลา | `modules/leave/manual/la.pdf` | external |

### permission — ขออนุมัติไปราชการ

| เมนู | legacy URL | หมายเหตุ |
|------|------------|----------|
| รายการหลัก | `?option=permission` |  |
| ตั้งค่าระบบ | `?option=permission` |  |
| กำหนดเจ้าหน้าที่ | `?option=permission&task=permission` |  |
| กำหนดปีปฏิทิน สพท. | `?option=permission&task=year` |  |
| กำหนดปีปฏิทิน รร. | `?option=permission&task=year_sch` |  |
| อัพโหลดลายเซ็นต์ ผู้อนุมัติ | `?option=permission&task=main/sign` |  |
| กำหนดผู้อนุมัติ | `?option=permission&task=set_grant_person` |  |
| อัพโหลดลายเซ็นต์ ผู้อนุมัติ | `?option=permission&task=main/sign_sch` |  |
| ทะเบียนไปราชการ(ส่วนบุคคล) | `?option=permission` |  |
| บันทึกขออนุมัติไปราชการ | `?option=permission&task=main/permission_main` |  |
| ผู้บังคับบัญชาขั้นต้น | `?option=permission&task=main/basic_comment` |  |
| เสนอผู้บังคับบัญชาอนุมัติ (คำขอโรงเรียน) | `?option=permission&task=main/basic_comment_sch` |  |
| ขอไปราชการ(ผอ.รร./รก.) | `?option=permission&task=main/permission_main` |  |
| ขอไปราชการ(ในจังหวัด) | `?option=permission&task=main/permission_main_sch` |  |
| ผู้บังคับบัญชาอนุมัติ | `?option=permission&task=main/grant_permission_sch` |  |
| ขออนุมัติไปราชการ | `?option=permission&task=main/permission_main_sch` |  |
| ทะเบียนไปราชการ(โรงเรียน) | `?option=permission` |  |
| รออนุมัติ | `?option=permission&task=main/report_2_sch_wait` |  |
| อนุมัติแล้ว | `?option=permission&task=main/report_2_sch_ok` |  |
| ไม่อนุมัติ | `?option=permission&task=main/report_2_sch_no` |  |
| อนุมัติ บุคลากรเขต | `?option=permission` |  |
| ความเห็น รอง ผอ.สพท. | `?option=permission&task=main/basic_comment2` |  |
| รออนุมัติ | `?option=permission&task=main/grant` |  |
| อนุมัติแล้ว | `?option=permission&task=main/grant_ok` |  |
| ไม่อนุมัติ | `?option=permission&task=main/grant_no` |  |
| อนุมัติ โรงเรียน (ผอ.รร.) | `?option=permission` |  |
| รออนุมัติ | `?option=permission&task=main/grant_sch` |  |
| อนุมัติแล้ว | `?option=permission&task=main/grant_ok_sch` |  |
| ไม่อนุมัติ | `?option=permission&task=main/grant_no_sch` |  |
| รายงาน | `?option=permission` |  |
| ขออนุมัติฯวันนี้ | `?option=permission&&task=main/report_1` |  |
| ขออนุมัติทั้งหมด | `?option=permission&&task=main/report_2` |  |
| พิมพ์ขออนุมัติ(ส่วนบุคคล) | `?option=permission&&task=main/print_report` |  |
| พิมพ์ขออนุมัติ(เขตพื้นที่) | `?option=permission&&task=main/print_report_area` |  |
| พิมพ์ขออนุมัติ(โรงเรียน) | `?option=permission&&task=main/print_report_school` |  |
| ทะเบียนไปราชการ(สำหรับเจ้าหน้าที่) | `?option=permission` |  |
| ทะเบียนขออนุมัติ(เขตพื้นที่) | `?option=permission&&task=main/print_report_area` |  |
| ทะเบียนขออนุมัติ(โรงเรียน) | `?option=permission&&task=main/print_report_school_all` |  |
| คู่มือ | `?option=permission` |  |
| คู่มือการขออนุมัติไปราชการ | `modules/permission/manual/permission.pdf` | external |

### idocument — ระบบบันทึกข้อความ

| เมนู | legacy URL | หมายเหตุ |
|------|------------|----------|
|  รายการหลัก | `?option=idocument` |  |
|  ตั้งค่าระบบ | `?#` |  |
| &task=main/signature&index=1'> อัพโหลดลายเซ็น | `?option=<?php echo $_GET[` |  |
|  บันทึกเสนอ | `?#` |  |
| &task=add'> เพิ่มบันทึกเสนอใหม่ | `?option=<?php echo $_GET[` |  |
| &task=view'> รายการบันทึกเสนอ | `?option=<?php echo $_GET[` |  |
|  ลงความเห็น/สั่งการ | `?#` |  |
| &task=book_pass"> ลงความเห็น/สั่งการ | `?option=<?php echo $_GET[` |  |
|  รายงาน | `?#` |  |
| &task=viewlist'> บันทึกข้อความทั้งหมด | `?option=<?php echo $_GET[` |  |
|  คู่มือ | `?#` |  |
|  คู่มือการใช้งาน | `modules/idocument/manual/manual.pdf` | external |

### car — ยานพาหนะ

| เมนู | legacy URL | หมายเหตุ |
|------|------------|----------|
|  รายการหลัก | `?option=car` |  |
|  ตั้งค่าระบบ | `?option=car` |  |
|  กำหนดเจ้าหน้าที่ | `?option=car&task=main/permission` |  |
|  กำหนดประเภท | `?option=car&task=main/car_type` |  |
|  กำหนดยานพาหนะ | `?option=car&task=main/car_list` |  |
|  กำหนดพนักงานขับรถ | `?option=car&task=main/set_driver` |  |
|  ขอใช้ยานพาหนะ | `?option=car` |  |
|  ขอใช้รถราชการ | `?option=car&task=main/car_request` |  |
|  เจ้าหน้าที่ | `?option=car` |  |
|  แก้ไขการขอใช้รถราชการ | `?option=car&task=main/car_request` |  |
|  เจ้าหน้าที่ลงความเห็น | `?option=car&task=main/car_officer` |  |
|  ใบเบิกน้ำมัน | `?option=car&task=main/oil_withdraw` |  |
|  ลงความเห็น/อนุมัติ | `?option=car` |  |
|  ผู้ให้ความเห็นชอบ | `?option=car&task=main/car_group` |  |
|  ผู้อนุมัติ | `?option=car&task=main/car_commander` |  |
|  รายงาน | `?option=car` |  |
|  รายงานการใช้ยานหานะ | `?option=car&task=main/car_report` |  |
|  ปฏิทินการใช้ยานพาหนะ | `?option=car&task=main/car_calendar` |  |
|  คู่มือ | `?option=car` |  |
|  คู่มือ | `modules/car/manual/car.pdf` | external |

### security_duty — เวรรักษาการณ์

_ไม่มี `modules/security_duty/menu.php` ใน legacy codebase_

### affair — ภารกิจผู้อำนวยการ

| เมนู | legacy URL | หมายเหตุ |
|------|------------|----------|
| รายการหลัก | `?option=affair` |  |
| ตั้งค่าระบบ | `?option=affair` |  |
| กำหนดเจ้าหน้าที่ | `?option=affair&task=permission` |  |
| บันทึกข้อมูล | `?option=affair&task=main/affair&index=1` |  |
| ภารกิจผู้อำนวยการ | `?option=affair&task=main/affair` |  |
| รายงาน | `?option=affair&task=main/report_affair` |  |
| ภารกิจผู้อำนวยการ | `?option=affair&task=main/report_affair` |  |
| คู่มือ | `?option=affair` |  |
| คู่มือ | `modules/affair/manual/affair.pdf` | external |

### bookpv — รับส่งหนังสือราชการศธจ.

_ไม่มี `modules/bookpv/menu.php` ใน legacy codebase_

### delegate — การรักษาราชการแทน

| เมนู | legacy URL | หมายเหตุ |
|------|------------|----------|
| รายการหลัก | `?option=delegate` |  |
| ตั้งค่าระบบ | `?option=delegate` |  |
| กำหนดเจ้าหน้าที่ | `?option=delegate&task=permission` |  |
| บันทึกข้อมูล | `?option=delegate&task=main/delegate` |  |
| การรักษาราชการแทน | `?option=delegate&task=main/delegate` |  |
| รายงาน | `?option=delegate&task=main/report_delegate` |  |
| การรักษาราชการแทน | `?option=delegate&task=main/report_delegate` |  |
| คู่มือ | `?option=delegate` |  |
| คู่มือการรักษาราชการแทน | `modules/delegate/manual/delegate.pdf` | external |

### bookobec — รับส่งหนังสือราชการสพฐ

**Production requirements (ADR 006):**
- ตาราง `system_sync_code` ต้องมี `office_code` + `sync_code` สำหรับเชื่อม SmartObec — ตั้งที่ `/modules/bookobec/settings` หรือ import legacy
- ลงทะเบียนรับต้องมี `bookregister_year` ที่ `year_active=1` (office)
- สิทธิ์ผ่าน `bookobec_permission` (`p1_bookobec` รับ, `p2_bookobec` ส่ง) หรือ module admin

| เมนู | legacy URL | หมายเหตุ |
|------|------------|----------|
|  รายการหลัก | `?option=bookobec` |  |
|  ตั้งค่าระบบ | `?option=bookobec` |  |
|  กำหนดเจ้าหน้าที่ | `?option=bookobec&task=permission` |  |
|  รับหนังสือ | `?option=bookobec` |  |
|  รับหนังสือ | `?option=bookobec&task=main/receive` |  |
|  รับหนังสือพร้อมลงทะเบียน | `?option=bookobec&task=main/receive_register` |  |
|  รายการหนังสือรับ | `?option=bookobec` |  |
| รายการหนังสือรับ สพฐ. | `?option=bookobec&task=main/receive_other` |  |
|  ส่งหนังสือ | `?option=bookobec&task=main/send` |  |
|  ส่งหนังสือ สพฐ. | `?option=bookobec&task=main/send` |  |
|  รายการหนังสือส่ง | `?option=bookobec&task=main/send_report` |  |
|  รายการหนังสือส่ง สพฐ. | `?option=bookobec&task=main/send_report` |  |
|  คู่มือ | `?option=bookobec` |  |
|  คู่มือ | `modules/bookobec/manual/bookobec.pdf` | external |

### bookregister — ทะเบียนหนังสือราชการ

| เมนู | legacy URL | หมายเหตุ |
|------|------------|----------|
| รายการหลัก | `?option=bookregister` |  |
| ตั้งค่าระบบ | `?option=bookregister` |  |
| กำหนดเจ้าหน้าที่ | `?option=bookregister&task=permission` |  |
| กำหนดปีปฏิทิน | `?option=bookregister&task=year` |  |
| กำหนดเลขที่หนังสือ | `?option=bookregister&task=main/office_no` |  |
| กำหนดผู้ลงนามเกียรติบัตร | `?option=bookregister&task=main/cer_sign` |  |
| กำหนดผู้ตรวจสอบการลงทะเบียนเกียรติบัตร | `?option=bookregister&task=cer_officer` |  |
| ตั้งค่าระบบ(ร.ร.) | `?option=bookregister` |  |
| กำหนดเจ้าหน้าที่ | `?option=bookregister&task=permission_sch` |  |
| กำหนดปีปฏิทิน | `?option=bookregister&task=year_sch` |  |
| กำหนดเลขที่หนังสือ | `?option=bookregister&task=main/office_no_sch` |  |
| ทะเบียนหนังสือรับ | `?option=bookregister&task=main/receive` |  |
| ทะเบียนหนังสือส่ง | `?option=bookregister&task=main/send` |  |
| ทะเบียนคำสั่ง | `?option=bookregister&task=main/command` |  |
| ทะเบียนเกียรติบัตร | `?option=bookregister&task=main/certificate` |  |
| เจ้าหน้าที่ทะเบียนเกียรติบัตร | `?option=bookregister&task=main/certificate_officer` |  |
| ทะเบียนหนังสือรับ | `?option=bookregister&task=main/receive_sch` |  |
| ทะเบียนหนังสือส่ง | `?option=bookregister&task=main/send_sch` |  |
| ทะเบียนคำสั่ง | `?option=bookregister&task=main/command_sch` |  |
| ทะเบียนเกียรติบัตร | `?option=bookregister&task=main/certificate_sch` |  |
| เกียรติบัตร สพท. | `?option=bookregister&task=main/certificate_school_print` |  |
| คู่มือ | `?option=bookregister` |  |
| คู่มือ | `modules/bookregister/manual/bookregister.pdf` | external |

### book — รับส่งหนังสือราชการ

| เมนู | legacy URL | หมายเหตุ |
|------|------------|----------|
|  รายการหลัก | `?option=book` |  |
|  ตั้งค่าระบบ | `?option=book` |  |
| กำหนดสารบรรณ สพท, | `?option=book&task=permission` |  |
| กำหนดสารบรรณ สถานศึกษา | `?option=book&task=permission_sch_khet` |  |
| กำหนดกลุ่มสถานศึกษา | `?option=book&task=main/group` |  |
| กำหนดสมาชิกกลุ่มสถานศึกษา | `?option=book&task=main/group_member` |  |
| รายงานกลุ่มและสมาชิก | `?option=book&task=main/group_member_report` |  |
| ย้ายหนังสือราชการเกิน 2 ปี ไปเก็บสำรอง | `?option=book&task=main/move_book` |  |
| กำหนดเจ้าหน้าที่ | `?option=book&task=permission_sch` |  |
|  หนังสือรับ | `?option=book&task=main/receive` |  |
|  หนังสือรับมา | `?option=book&task=main/receive` |  |
|  หนังสือส่ง | `?option=book&task=main/send` |  |
|  หนังสือส่งไป | `?option=book&task=main/send` |  |
|  ส่งหนังสือราชการ | `?option=book&task=main/send&index=1` |  |
| $mpic1 หนังสือที่ยังไม่รับเกิน 3 วัน | `?option=book&task=main/book_delay` |  |
| หนังสืออายุเกิน 2 ปี | `?option=book&task=main/send&index=1` |  |
| หนังสือรับ | `?option=book&task=main/report_1` |  |
| หนังสือส่ง | `?option=book&task=main/report_2` |  |
|  คู่มือ | `?option=book` |  |
|  คู่มือ | `modules/book/manual/book.pdf` | external |

### mail — ระบบส่งหนังสือเวียน

| เมนู | legacy URL | หมายเหตุ |
|------|------------|----------|
| รายการหลัก | `?option=mail` |  |
| ตั้งค่าระบบ | `?option=mail` |  |
| กำหนดเจ้าหน้าที่ | `?option=mail&task=main/permission` |  |
| กำหนดกลุ่มบุคลากร | `?option=mail&task=main/group` |  |
| กำหนดสมาชิกกลุ่มบุคลากร | `?option=mail&task=main/group_member` |  |
| รายงานกลุ่มและสมาชิก | `?option=mail&task=main/group_member_report` |  |
| ทะเบียนรับ | `?option=mail&task=main/receive` |  |
| ทะเบียนหนังสือเวียนรับมา | `?option=mail&task=main/receive` |  |
| ทะเบียนส่ง | `?option=mail&task=main/send` |  |
| ทะเบียนจหนังสือเวียนส่งไป | `?option=mail&task=main/send` |  |
| ส่งหนังสือเวียน | `?option=mail&task=main/send&index=1` |  |
| คู่มือ | `?option=mail` |  |
| คู่มือ | `modules/mail/manual/mail.pdf` | external |

### meeting — ระบบจองห้องประชุม

| เมนู | legacy URL | หมายเหตุ |
|------|------------|----------|
| รายการหลัก | `?option=meeting` |  |
| ตั้งค่าระบบ | `?option=meeting` |  |
| กำหนดเจ้าหน้าที่ | `?option=meeting&task=main/permission` |  |
| กำหนดห้องประชุม | `?option=meeting&task=main/set_room` |  |
| กำหนดประเภทการใช้งาน | `?option=meeting&task=main/set_type_obj` |  |
| จองห้องประชุม | `?option=meeting` |  |
| จองห้องประชุม | `?option=meeting&task=main/meeting` |  |
| อนุญาตให้ใช้ห้องประชุม | `?option=meeting&task=main/officer` |  |
| ปฎิทินการใช้ห้องประชุม | `?option=meeting&task=calendar/fullcalendar` |  |
| รายงาน | `?option=meeting` |  |
| พิมพ์ปฏิทินการใช้ห้องประชุม | `?option=meeting&task=main/calMonthPrint&room_index=$room_index&Date=$Date` |  |
| สรุปข้อมูลสถิติการใช้ห้องประชุม | `?option=meeting&task=main/statistic&month=$index_month&year=$index_year` |  |
| คู่มือ | `?option=meeting` |  |
| คู่มือจองห้องประชุม | `modules/meeting/manual/meeting.pdf` | external |

### work — ลงเวลาการปฏิบัติราชการ

| เมนู | legacy URL | หมายเหตุ |
|------|------------|----------|
| รายการหลัก | `?option=work` |  |
| ตั้งค่าระบบ | `?option=work` |  |
| กำหนดเจ้าหน้าที่ | `?option=work&task=permission` |  |
| บันทึกข้อมูล | `?option=work` |  |
| บันทึกข้อมูลการปฏิบัติราชการวันนี้ | `?option=work&task=check` |  |
| บันทึกข้อมูลการปฏิบัติราชการย้อนหลัง | `?option=work&task=check_2` |  |
| รายงาน | `?option=work` |  |
| สรุปการปฏิบัติราชการรายวัน | `?option=work&task=report_1` |  |
| สรุปการปฏิบัติราชการรอบเดือน | `?option=work&task=report_2` |  |
| คู่มือ | `?option=work` |  |
| คู่มือการปฏิบัติราชการ | `modules/work/manual/work.pdf` | external |

### cabinet — ระบบวาระประชุมแผ่นเดียว QR-CODE

| เมนู | legacy URL | หมายเหตุ |
|------|------------|----------|
| รายการหลัก | `?option=cabinet` |  |
| ตั้งค่าระบบ | `?option=cabinet` |  |
| กำหนดเจ้าหน้าที่ | `?option=cabinet&task=main/permission` |  |
| กำหนดตู้เอกสาร | `?option=cabinet&task=main/cabinet_set` |  |
| ลิ้นชักและแฟ้ม | `?option=cabinet` |  |
| ตู้เอกสารกลาง | `?option=cabinet&task=main/ctr_tray_set` |  |
| ตู้เอกสารส่วนบุคคล | `?option=cabinet&task=main/private_tray_set` |  |
| เอกสาร | `?option=cabinet` |  |
| เอกสารตู้กลาง | `?option=cabinet&task=main/ctr_document` |  |
| เอกสารตู้ส่วนบุคคล | `?option=cabinet&task=main/private_document` |  |
| ค้นหาเอกสาร | `?option=cabinet&task=main/search_document` |  |
| คู่มือ | `?option=cabinet` |  |
| คู่มือตู้เอกสาร | `modules/cabinet/manual/cabinet.pdf` | external |

### time — ระบบลงเวลา

_ไม่มี `modules/time/menu.php` ใน legacy codebase_

### asset — ระบบบริหารพัสดุ

_ไม่มี `modules/asset/menu.php` ใน legacy codebase_

### plan — การวางแผน

อ้างอิง [`Amssplus/modules/plan/menu.php`](../Amssplus/modules/plan/menu.php) (superset)

| เมนู | legacy URL | Next.js |
|------|------------|---------|
| รายการหลัก | `?option=plan` | `/modules/plan` → projects |
| **ตั้งค่าระบบ** | | |
| กำหนดเจ้าหน้าที่ | `?option=plan&task=planproject/plan_setuser` | `/modules/plan/permissions` |
| กำหนดปีงบประมาณ | `?option=plan&task=planproject/plan_year` | `/modules/plan/years` |
| กำหนดยุทธศาสตร์ | `?option=plan&task=planproject/plan_setgic` | `/modules/plan/strategies` |
| **โครงการประจำปี** | | |
| กำหนดโครงการ | `?option=plan&task=planproject/plan_in_proj` | `/modules/plan/projects` |
| แนบเอกสารโครงการ | `?option=plan&task=planproject/plan_upload_detail` | `/modules/plan/attachments` |
| เรียกข้อมูลจาก SMSS | `?option=plan&task=getxml_plan` | `/modules/plan/smss-import` |
| **เงินเหลือจ่าย** | | |
| กำหนดโครงการ | `?option=plan&task=planproject/plan_in_proj_2` | `/modules/plan/surplus/projects` |
| รายงานการจัดสรรเงิน | `?option=plan&task=check/report_13` | `/modules/plan/surplus/reports/allocation` |
| หยุดกิจกรรม/โครงการ | `?option=plan&task=check/check_3` | `/modules/plan/surplus/activities/stop` |
| เหลือจ่ายจากยุติกิจกรรม/โครงการ | `?option=plan&task=check/report_11` | `/modules/plan/surplus/reports/remaining` |
| **ตรวจสอบ** | | |
| ทะเบียนเงินงวด | `?option=plan&task=check/receive_report` | `/modules/plan/checks/installment-register` |
| ตรวจสอบการจัดสรรงบประมาณ | `?option=plan&task=check/check_2` | `/modules/plan/checks/allocation` |
| ตรวจสอบการใช้จ่ายโครงการ | `?option=plan&task=check/report_10` | `/modules/plan/checks/spending` |
| **รายงานโครงการ** | | |
| โครงการจำแนกตามกลุ่ม(งาน) | `?option=plan&task=planproject/plan_show_plan` | `/modules/plan/reports/by-workgroup` |
| รายงานการจัดสรรงบประมาณ | `?option=plan&task=check/check_1` | `/modules/plan/reports/allocation-summary` |
| โครงการตามยุทธศาสตร์ | `?option=plan&task=planproject/plan_show_plan2` | `/modules/plan/reports/by-strategy` |
| รายงานผลการดำเนินงาน | `?option=plan&task=planproject/plan_owner_report` | `/modules/plan/reports/owner-results` |
| โครงการเพิ่มเติมจากเงินเหลือจ่าย | `?option=plan&task=check/report_12` | `/modules/plan/reports/surplus-projects` |
| **คู่มือ** | | |
| คู่มือการใช้งาน | `modules/plan/handbook/plan.pdf` | `/modules/plan/manual` |

**สิทธิ์:** `plan_permissions` — `perm_add` / `perm_edit` / `perm_dele` (legacy `mpms_*`) · โครงการเงินเหลือจ่ายใช้ `project_kind=surplus` แทน `plan_proj_2`

### budget — การเงินและบัญชี

อ้างอิง [`Amssplus/modules/budget/menu.php`](../Amssplus/modules/budget/menu.php) (superset) · ADR [008](adr/008-budget-module-full-menu.md)

| เมนู | legacy URL | Next.js |
|------|------------|---------|
| รายการหลัก | `?option=budget` | `/modules/budget` → receive/budget |
| **ตั้งค่าระบบ** | | |
| เจ้าหน้าที่การเงินฯ | `task=main/permission` | `/modules/budget/permissions` |
| ปีงบประมาณ | `task=main/budget_year` | `/modules/budget/years` |
| แผนงาน | `task=category/plan_project` | `/modules/budget/plans` |
| ผลผลิตโครงการ | `task=category/proj_product` | `/modules/budget/project-products` |
| กิจกรรมหลัก | `task=category/key_activity` | `/modules/budget/key-activities` |
| แหล่งของเงิน | `task=category/money_source` | `/modules/budget/money-sources` |
| งบรายจ่าย | `task=category/pay_type` | `/modules/budget/pay-types` |
| ประเภท(หลัก)ของเงิน | `task=category/edit_category` | `/modules/budget/categories` |
| ประเภท(ย่อย)ของเงิน | `task=category/edit_type` | `/modules/budget/types` |
| **ทะเบียนรับ** | | |
| รับการจัดสรรงบประมาณ | `task=budget_unit/receive` | `/modules/budget/allocation` |
| รับเงินงบประมาณ | `task=main/receive_bud` | `/modules/budget/receive/budget` |
| รับเงินนอกงบประมาณ | `task=main/receive_ex_bud` | `/modules/budget/receive/extra` |
| รับเงินรายได้แผ่นดิน | `task=main/receive_income_bud` | `/modules/budget/receive/income` |
| **ทะเบียนขอเบิก** | | |
| ขอเบิก/ยืมโครงการ | `task=main/withdraw` | `/modules/budget/withdraw` |
| คืนเงินโครงการ | `task=main/return_withdraw` | `/modules/budget/withdraw/returns` |
| ขอเบิกเงินคงคลัง (ฎีกา) | `task=deega/deega` | `/modules/budget/deega` |
| คืนเงินคงคลัง | `task=deega/return_deega` | `/modules/budget/deega/returns` |
| ยกเลิกฎีกา | `task=main/cancel_deega` | `/modules/budget/deega/cancel` |
| เงินกันเหลื่อมปี | `task=deega/po` | `/modules/budget/deega/carryover` |
| **ทะเบียนจ่าย** | | |
| สั่งจ่ายงบประมาณ | `task=main/pay_bud` | `/modules/budget/pay/budget` |
| สั่งจ่ายนอกงบ | `task=main/pay_ex_bud` | `/modules/budget/pay/extra` |
| สั่งจ่ายรายได้แผ่นดิน | `task=main/pay_income_bud` | `/modules/budget/pay/income` |
| เงินทดรองราชการ | `task=main/reserve_money` | `/modules/budget/pay/reserve` |
| อนุมัติจ่ายประเภทหลัก | `task=main/approve` | `/modules/budget/approve/main` |
| อนุมัติจ่ายทดรอง | `task=main/approve_reserve` | `/modules/budget/approve/reserve` |
| จ่ายเงินประเภทหลัก | `task=main/pay_check` | `/modules/budget/pay-check/main` |
| จ่ายเงินทดรอง | `task=main/pay_check_reserve` | `/modules/budget/pay-check/reserve` |
| **เปลี่ยนแปลงสถานะ** | | |
| เงินงบประมาณ | `task=main/change_bud` | `/modules/budget/status-change/budget` |
| เงินนอกงบ | `task=main/change_ex_bud` | `/modules/budget/status-change/extra` |
| เงินรายได้แผ่นดิน | `task=main/change_income_bud` | `/modules/budget/status-change/income` |
| **ตรวจสอบ** | `task=check/*` | `/modules/budget/checks/*` (11 รายการ) |
| **รายงาน** | `task=main/report_*` | `/modules/budget/reports/*` (12 รายการ) |
| **คู่มือ** | `modules/budget/manual/budget.pdf` | `/modules/budget/manual` |

**สิทธิ์:** `budget_permissions` p1–p10 ตาม legacy · `type_id=200` = งบประมาณ · นอกงบ/รายได้จาก `budget_type` · MVP `/receive` `/disburse` redirect ไป route ใหม่

### award — ระบบรายงานการได้รับรางวัลประเภทต่างๆ

| เมนู | legacy URL | หมายเหตุ |
|------|------------|----------|
| รายการหลัก | `?option=award` |  |
| ตั้งค่าระบบ | `?option=award` |  |
| กำหนดเจ้าหน้าที่ | `?option=award&task=main/permission` |  |
| กำหนดชื่อเรื่อง | `?option=award&task=main/mainitem` |  |
| กำหนดประเภท | `?option=award&task=main/section` |  |
| บันทึกรางวัล | `?option=award` |  |
| บันทึกรางวัลครูรายบุคคล | `?option=award&task=main/award` |  |
| รายงาน | `?option=award` |  |
| รายงานรางวัล | `?option=award&task=main/report1` |  |
| รายงานเรียกได้จากภายนอก AMSS++ | `?modules/award/main/report2.php` |  |
| คู่มือ | `?option=award` |  |
| คู่มือการรายงาน | `modules/award/manual/award.pdf` | external |

### homework — ขออนุญาตปฏิบัติราชการที่บ้าน

_ไม่มี `modules/homework/menu.php` ใน legacy codebase_

### person — ระบบบริหารงานบุคคล

| เมนู | legacy URL | หมายเหตุ |
|------|------------|----------|
| รายการหลัก | `?option=person` |  |
| หน้าแรก - งานบุคลากร | `?option=person` |  |
| ตั้งค่าระบบ | `?option=person` |  |
| เจ้าหน้าที่งานบุคคล สพท. | `?option=person&task=permission` |  |
| เจ้าหน้าที่งานบุคลากร สถานศึกษา | `?option=person&task=permission_sch_khet` |  |
| กำหนดตำแหน่งครูและบุคลากรในสพท. | `?option=person&task=position` |  |
| กำหนดตำแหน่งครูและบุคลากรในสถานศึกษา | `?option=person&task=position&school_code=all` |  |
| กำหนดวิทยฐานะ | `?option=person&task=position_class` |  |
| กำหนดระดับการศึกษา | `?option=person&task=education_class` |  |
| นำเข้าข้อมูลครูและบุคลากรในสพท.จาก Text File | `?option=person&task=person_import` |  |
| ปรับปรุงข้อมูลรูปภาพบุคลากร สพท. | `?option=person&task=update_picture1` |  |
| นำเข้าข้อมูลครูและบุคลากรในสถานศึกษาจาก Text File | `?option=person&task=person_import&school_code=all` |  |
| ปรับปรุงข้อมูลรูปภาพบุคลากรสถานศึกษา | `?option=person&task=update_picture2` |  |
| ชื่อและรหัสสถานศึกษา | `?option=person&task=school` |  |
| กำหนดเจ้าหน้าที่ | `?option=person&task=permission_sch` |  |
| งานบำเน็จความชอบ | `?option=person` |  |
| นำเข้าไฟล์ แจ้งผลการเลื่อนเงินเดือน | `?option=person&task=bonus` |  |
| ตรวจสอบ ผลการเลื่อนเงินเดือน | `?option=person&task=bonus_list` |  |
| งานทะเบียนประวัติ | `?option=person` |  |
| แฟ้มประวัติ ครูและบุคลากร สพท. | `?option=person&task=history_records` |  |
| แฟ้มประวัติ ครูและบุคลากร สถานศึกษา | `?option=person&task=history_records&school_code=all` |  |
| ครูและบุคลากรปัจจุบัน | `?option=person` |  |
| ครูและบุคลากร สพท. | `?option=person&task=person` |  |
| ครูและบุคลากร สถานศึกษา | `?option=person&task=person&school_code=all` |  |
| ครูและบุคลากร สถานศึกษารอการรับรอง | `?option=person&task=person_sch2` |  |
| บุคลากรในสถานศึกษาปฏิบัติงานมากกว่า 1 แห่ง | `?option=person&task=person_sch_other` |  |
| รักษาการในตำแหน่ง ผอ.รร. | `?option=person&task=delegate_sch` |  |
| เรียกข้อมูลจากSMSS | `?option=person&task=getxml_person` |  |
| ครูและบุคลากรในอดีต | `?option=person` |  |
| ครูและบุคลากร สพท. | `?option=person&task=change_status_person` |  |
| ครูและบุคลากร สถานศึกษา | `?option=person&task=change_status_person&school_code=all` |  |
| แฟ้มประวัติ ครูและบุคลากร สถานศึกษา | `?option=person&task=history_records` |  |
| ครูและบุคลากร สถานศึกษา | `?option=person&task=person` |  |
| รายงาน | `?option=person` |  |
| ครูและบุคลากร สพท. | `?option=person&task=person_report1` |  |
| ครูและบุคลากร สถานศึกษา | `?option=person&task=person_report1&school_code=all` |  |
| บุคลากรเกษียณอายุราชการ ปี ".$year_thai." | `?option=person&task=retire_report&year=$year` |  |
| ส่งออกข้อมูลครูและบุคลากรสพท.เป็นไฟล์ Excel | `?modules/person/export_to_excel.php` |  |
| คู่มือ | `?option=person` |  |
| คู่มือข้อมูลพื้นฐานบุคลากร | `modules/person/manual/person.pdf` | external |
| คู่มือ สพป.เลย เขต ๑ | `modules/person/manual/person-loei1.pdf` | external |
| ตัวอย่างไฟล์ Excel ข้อมูลครูและบุคลากรในสพท. | `?modules/person/manual/person.xls` |  |
| ตัวอย่างไฟล์ Excel ข้อมูลครูและบุคลากรในสถานศึกษา | `?modules/person/manual/school_person.xls` |  |

### warroom — วิเคราะห์สภาพการณ์

_ไม่มี `modules/warroom/menu.php` ใน legacy codebase_

### opportunity — สิทธิและโอกาสทางการศึกษา

_ไม่มี `modules/opportunity/menu.php` ใน legacy codebase_

### supervision — นิเทศ ติดตาม และประเมินผล

| เมนู | legacy URL | หมายเหตุ |
|------|------------|----------|
| รายการหลัก | `?option=supervision` |  |
| ตั้งค่าระบบ | `?option=supervision` |  |
| กำหนดเจ้าหน้าที่ | `?option=supervision&task=main/permission` |  |
| รายการนิเทศฯ | `?option=supervision&task=main/supervision_item` |  |
| มาตรฐานการจัดการศึกษา | `?#` |  |
| มาตรฐาน | `?option=supervision&task=main/supervision_year` |  |
| รายการมาตรฐาน | `?option=supervision&task=main/standard` |  |
| รายการตัวชี้วัด | `?option=supervision&task=main/indicator` |  |
| นิเทศ ติดตาม ประเมินผล | `?#` |  |
| บันทึกการนิเทศ ฯ | `?option=supervision&task=main/sp1` |  |
| รายงาน | `?#` |  |
| รายงานการนิเทศ | `?option=supervision&task=main/report_1` |  |
| รายงานผลการประเมิน | `?option=supervision&task=main/report_2` |  |
| รายงานการนิเทศฯ ระดับเขต | `?option=supervision&task=main/report_3` |  |
| คู่มือ | `?option=supervision` |  |
| คู่มือไปรษณีย์ | `modules/supervision/manual/supervision.pdf` | external |

### student_main — ข้อมูลนักเรียน

| เมนู | legacy URL | หมายเหตุ |
|------|------------|----------|
| รายการหลัก | `?option=student_main` |  |
| ตั้งค่าระบบ | `?option=student_main` |  |
| กำหนดเจ้าหน้าที่ ระดับสพท. | `?option=student_main&task=permission` |  |
| กำหนดปีการศึกษา | `?option=student_main&task=ed_year` |  |
| กำหนดเจ้าหน้าที่ ระดับสถานศึกษา | `?option=student_main&task=permission_sch_khet` |  |
| ข้อมูลนักเรียน(เจ้าหน้าที่) | `?option=student_main` |  |
| นำเข้าข้อมูลจากไฟล์ | `?option=student_main&task=student_import` |  |
| ปรับปรุงข้อมูลนักเรียน | `?option=student_main&task=student_khet_update` |  |
| เลื่อนชั้นนักเรียน | `?option=student_main&task=student_tranfer` |  |
| Student_XML | `?option=student_main&task=student_getxml` |  |
| กำหนดเจ้าหน้าที่ | `?option=student_main&task=permission_sch` |  |
| ปรับปรุงข้อมูลนักเรียน | `?option=student_main&task=student_sch_update` |  |
| รายงานข้อมูลนักเรียน | `?option=student_main` |  |
| รายชื่อนักเรียน | `?option=student_main&task=student_report1` |  |
| จำนวนนักเรียนรายชั้น | `?option=student_main&task=student_report2` |  |
| ค้นหานักเรียน | `?option=student_main&task=student_report3` |  |
| คู่มือ | `?option=student_main` |  |
| คู่มือข้อมูลนักเรียน | `modules/student_main/manual/student.pdf` | external |
| ตัวอย่างไฟล์สำหรับนำเข้าข้อมูล | `?modules/student_main/manual/student.csv` |  |

### achievement — ผลสัมฤทธิ์ทางการเรียน

| เมนู | legacy URL | หมายเหตุ |
|------|------------|----------|
| รายการหลัก | `?option=achievement` |  |
| ตั้งค่าระบบ | `?option=achievement` |  |
| กำหนดเจ้าหน้าที่ | `?option=achievement&task=main/permission` |  |
| บันทึกคะแนน | `?option=achievement` |  |
| บันทึกคะแนน O-NET | `?option=achievement&task=main/add_score_1` |  |
| บันทึกคะแนน NT | `?option=achievement&task=main/add_score_2` |  |
| บันทึกคะแนน LAS | `?option=achievement&task=main/add_score_3` |  |
| นำเข้าข้อมูลจากไฟล์ CSV | `?option=achievement&task=main/test_import` |  |
| รายงาน(กราฟ) | `?option=achievement` |  |
| O-NET แบบ 1 | `?option=achievement&task=main/report1` |  |
| O-NET แบบ 2 | `?option=achievement&task=main/report11` |  |
| NT แบบที่ 1 | `?option=achievement&task=main/report4` |  |
| NT แบบที่ 2 | `?option=achievement&task=main/report41` |  |
| LAS แบบที่ 1 | `?option=achievement&task=main/report6` |  |
| LAS แบบที่ 2 | `?option=achievement&task=main/report61` |  |
| รายงาน(ข้อมูล) | `?option=achievement` |  |
| O-NET แบบที่ 1 | `?option=achievement&task=main/report1_1` |  |
| O-NET แบบที่ 2 | `?option=achievement&task=main/report1_2` |  |
| NT แบบที่ 1 | `?option=achievement&task=main/report4_1` |  |
| NT แบบที่ 2 | `?option=achievement&task=main/report4_2` |  |
| LAS แบบที่ 1 | `?option=achievement&task=main/report6_1` |  |
| LAS แบบที่ 2 | `?option=achievement&task=main/report6_2` |  |
| คู่มือ | `?option=achievement` |  |
| คู่มือผลสัมฤทธิ์ทางการเรียน | `modules/achievement/manual/achievement.pdf` | external |
| ตัวอย่างไฟล์ CSV | `?modules/achievement/manual/onet_p6_55.csv` |  |

### bets — ระบบทดสอบการศึกษา

| เมนู | legacy URL | หมายเหตุ |
|------|------------|----------|
| รายการหลัก | `?option=bets` |  |
| ตั้งค่าระบบ | `?#` |  |
| กำหนดเจ้าหน้าที่ | `?option=bets&task=main/permission` |  |
| มาตรฐานการศึกษา | `?#` |  |
| หลักสูตรแกนกลาง | `?option=bets&task=main/curriculum` |  |
| สาระ | `?option=bets&task=main/substance` |  |
| มาตรฐานการศึกษา | `?option=bets&task=main/standard` |  |
| ตัวชี้ัวัด | `?option=bets&task=main/indicator` |  |
| ข้อสอบและแบบทดสอบ | `?#` |  |
| คลังข้อสอบ | `?option=bets&task=main/test_item` |  |
| แบบทดสอบ(ต้นฉบับ) | `?option=bets&task=main/test_master` |  |
| บริหารการสอบ(สพท.) | `?option=bets&task=main/test_admin` |  |
| บริหารการสอบ | `?option=bets&task=main/test_admin` |  |
| บริหารการสอบ(สถานศึกษา) | `?#` |  |
| รายการทดสอบ(สพท) | `?option=bets&task=main/test_sch` |  |
| รายการสอบของสถานศึกษา | `?option=bets&task=main/test_sch_2` |  |
| ทดสอบ | `?option=bets&task=main/test_student` |  |
| รายการสอบ | `?option=bets&task=main/test_student` |  |
| รายงานผลการสอบ | `?#` |  |
| ภาพรวมเขตพื้นที่การศึกษา | `?option=bets&task=main/khet_report_1` |  |
| รายละเอียดรายสถานศึกษา | `?option=bets&task=main/khet_report_2` |  |
| รายงานผลการสอบ | `?option=bets&task=main/sch_report_1` |  |
| รายงานผลการสอบ | `?option=bets&task=main/student_report_1` |  |
| คู่มือ | `?#` |  |
| คู่มือระบบทดสอบการศึกษา | `modules/bets/manual/bets.pdf` | external |

### spacial_student — นักเรียนพิเศษ

| เมนู | legacy URL | หมายเหตุ |
|------|------------|----------|
| รายการหลัก | `?option=spacial_student` |  |
| ตั้งค่าระบบ | `?option=spacial_student` |  |
| กำหนดเจ้าหน้าที่ ระดับสพท. | `?option=spacial_student&task=permission` |  |
| กำหนดเจ้าหน้าที่ ระดับสถานศึกษา | `?option=spacial_student&task=permission_sch_khet` |  |
| งานเจ้าหน้าที่(สพท) | `?option=spacial_student` |  |
| นักเรียนที่มีความต้องการพิเศษ | `?option=spacial_student&task=student_khet_disable` |  |
| กำหนดเจ้าหน้าที่ | `?option=spacial_student&task=permission_sch` |  |
| งานเจ้าหน้าที่(สถานศึกษา) | `?option=spacial_student` |  |
| นักเรียนที่มีความต้องการพิเศษ | `?option=spacial_student&task=student_sch_disable` |  |
| รายงาน | `?option=spacial_student` |  |
| สรุปจำนวนนักเรียนพิเศษ | `?option=spacial_student&task=student_sch_disable_report3` |  |
| รายละเอียดนักเรียนพิเศษ | `?option=spacial_student&task=student_sch_disable_report2` |  |
| นักเรียนพิเศษ | `?option=spacial_student&task=student_sch_disable_report1` |  |
| คู่มือ | `?option=spacial_student` |  |
| คู่มือนักเรียนพิเศษ | `modules/spacial_student/manual/spacial_student.pdf` | external |

### alert — แจ้งเตือน

| เมนู | legacy URL | หมายเหตุ |
|------|------------|----------|
| รายการหลัก | `?option=alert` |  |

## โมดูลบน disk ที่ไม่มีใน system_module

### news

| เมนู | legacy URL | หมายเหตุ |
|------|------------|----------|
| รายการหลัก | `?option=news` |  |
| ตั้งค่าระบบ | `?option=news` |  |
| กำหนดเจ้าหน้าที่ | `?option=news&task=main/permission` |  |
| กำหนดชื่อเรื่อง | `?option=news&task=main/mainitem` |  |
| กำหนดประเภท | `?option=news&task=main/section` |  |
| บันทึกข่าว | `?option=news` |  |
| บันทึกข่าวเรื่องปัจจุบัน | `?option=news&task=main/news` |  |
| รายงาน | `?option=news` |  |
| รายงานข่าวเรื่องปัจจุบัน | `?option=news&task=main/report1` |  |
| รายงานเรียกได้จากภายนอก AMSS++ | `?modules/news/main/report2.php` |  |
| คู่มือ | `?option=news` |  |
| คู่มือการรายงานข่าว | `modules/news/manual/news.pdf` | external |

### line_notify

| เมนู | legacy URL | หมายเหตุ |
|------|------------|----------|
| รายการหลัก | `?option=line_notify` |  |
| ตั้งค่าระบบ | `?option=line_notify` |  |
| กำหนดรหัส Token Line กลุ่ม | `?option=line_notify&task=line_group` |  |

## เมนู Admin

จาก [`smart_kpp2/admin/menu.php`](../smart_kpp2/admin/menu.php)

| กลุ่ม | เมนู | legacy URL |
|-------|------|------------|
| ตั้งค่าระบบ | ชื่อหน่วยงาน | `?file=office_name` |
|  | กลุ่ม(งาน)ในองค์กร | `?file=workgroup` |
|  | กลุ่มระบบงานย่อย(menu) | `?file=menugroup` |
|  | กลุ่มสถานศึกษา | `?file=school_group` |
|  | สถานศึกษา | `?file=school` |
|  | รายละเอียดสถานศึกษา(เพิ่มเติม) | `?file=school_detail` |
| ระบบงานย่อย | ระบบงานย่อย(Module) | `?file=module` |
|  | ผู้ดูแล(Admin)ระบบงานย่อย | `?file=module_admin` |
| การเชื่อมกับระบบต่าง ๆ | เชื่อมกับ SMART OBEC | `?file=sync_code` |
|  | เปิดสิทธิ์ให้ SMSS | `?file=smss_permission` |
|  | เชื่อมกับ SMSS | `?file=sync_smss_code` |
| การส่งต่อข้อมูล | ผู้ขอข้อมูลจากAMSS++ | `?file=data_requester` |
|  | รายงานการให้บริการข้อมูล | `?file=data_requester_log` |
| ลงทะเบียน | ลงทะเบียนการใช้ AMSS++ | `?file=register` |
| ผู้ใช้ (User) | เปลี่ยนรหัสผ่านตนเอง | `?file=user_change_pwd` |
|  | คืนค่า(Reset)รหัสผ่านผู้ใช้ ระดับ สพท. | `?file=reset_pwd` |
|  | คืนค่า(Reset)รหัสผ่านผู้ใช้ ระดับ สถานศึกษา | `?file=reset_pwd_sch` |
|  | เพิ่ม แก้ไข ผู้ใช้(User) ระดับ สพท. | `?file=add_user` |
|  | เพิ่ม แก้ไข ผู้ใช้(User) ระดับ สถานศึกษา | `?file=add_user_sch` |
|  | เปลี่ยน Token Line | `?file=line_group` |

## เมนูผู้ใช้ (root)

จาก [`smart_kpp2/menu.php`](../smart_kpp2/menu.php) — ไม่ได้มาจาก DB

| เมนู | legacy URL | เงื่อนไข |
|------|------------|----------|
| เปลี่ยนรหัสผ่าน | `?file=user_change_pwd` | login_status ไม่ใช่ 5 หรือ 15 |
| ลงทะเบียนผู้ใช้ | `?file=register` | login_status = 5 หรือ 15 |

## ข้อสังเกต / ช่องว่าง

| ประเด็น | รายละเอียด |
|---------|------------|
| `la` vs `leave` | DB ใช้ `option=la` แต่โค้ดอยู่ `modules/leave/` และ menu ใช้ `option=leave` |
| `defualt` | โฟลเดอร์สะกดผิด — fallback module (`modules/defualt/`) ไม่มี menu.php |
| DB ไม่มีโฟลเดอร์ | `asset`, `homework`, `warroom`, `opportunity`, `security_duty`, `time`, `bookpv` |
| โฟลเดอร์ไม่มีใน DB | `news`, `line_notify` |
| `spacial_student` | สะกดผิด (special) — เก็บชื่อ legacy ไว้ |
| BOM ในชื่อ module | บาง `module_desc` ใน DB มี BOM (เช่น ยานพาหนะ) — strip เมื่อแสดงผล |
