import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PersonDistrictSignaturesTable } from "@/components/person/person-district-signatures-table";
import {
  canManagePersonStaffPermissions,
  getPersonPermissions,
} from "@/lib/person/permissions";
import { listAllDistrictPeople } from "@/lib/person/queries";

const DISTRICT_SIGNATURE_FULL_DATA = [
  { id: 1, personId: "3720800097597", prefix: "นาย", firstName: "นิรุตต์", lastName: "เข็มเงิน", positionName: "ผู้อำนวยการสำนักงานเขตพื้นที่การศึกษา", groupName: null, hasSignature: true },
  { id: 2, personId: "3460600378340", prefix: "นาย", firstName: "สมศักดิ์", lastName: "วันโนนาม", positionName: "รองผู้อำนวยการสำนักงานเขตพื้นที่การศึกษา", groupName: null, hasSignature: true },
  { id: 3, personId: "1140700051624", prefix: "นาย", firstName: "อนุพงษ์", lastName: "คล้องการ", positionName: "รองผู้อำนวยการสำนักงานเขตพื้นที่การศึกษา", groupName: null, hasSignature: true },
  { id: 4, personId: "3601000116394", prefix: "ว่าที่ ร.ต.", firstName: "ธนโชติ", lastName: "หร่ายรา", positionName: "รองผู้อำนวยการสำนักงานเขตพื้นที่การศึกษา", groupName: null, hasSignature: true },
  { id: 5, personId: "5330400026692", prefix: "นาย", firstName: "ธีรทัศน์", lastName: "ปิติภาคย์พงษ์", positionName: "ผู้อำนวยการกลุ่ม", groupName: "กลุ่มอำนวยการ", hasSignature: false },
  { id: 6, personId: "1729900021179", prefix: "นางสาว", firstName: "รพีพร", lastName: "ศรีศักดา", positionName: "นักจัดการงานทั่วไป", groupName: "กลุ่มอำนวยการ", hasSignature: false },
  { id: 7, personId: "1170600179343", prefix: "นางสาว", firstName: "ปิยะธิดา", lastName: "เสนาผัน", positionName: "นักจัดการงานทั่วไป", groupName: "กลุ่มอำนวยการ", hasSignature: false },
  { id: 8, personId: "3180300280827", prefix: "นาง", firstName: "ธนรรพร", lastName: "ทาสวิง", positionName: "นักจัดการงานทั่วไป", groupName: "กลุ่มอำนวยการ", hasSignature: false },
  { id: 9, personId: "1180600018323", prefix: "นางสาว", firstName: "พรทิพย์", lastName: "รุ่งศรี", positionName: "เจ้าพนักงานธุรการ", groupName: "กลุ่มอำนวยการ", hasSignature: false },
  { id: 10, personId: "1189900029167", prefix: "นาย", firstName: "นวพล", lastName: "จบศรี", positionName: "นักประชาสัมพันธ์", groupName: "กลุ่มอำนวยการ", hasSignature: false },
  { id: 11, personId: "1609900468395", prefix: "นางสาว", firstName: "ทิพย์สิรินทร์", lastName: "อินทร์เหมือน", positionName: "นักประชาสัมพันธ์", groupName: "กลุ่มอำนวยการ", hasSignature: false },
  { id: 12, personId: "118990075916", prefix: "นางสาว", firstName: "ศศิวิมล", lastName: "ดีสม", positionName: "พนักงานธุรการ", groupName: "กลุ่มอำนวยการ", hasSignature: false },
  { id: 13, personId: "1103700991271", prefix: "นางสาว", firstName: "เมริน", lastName: "แก้วเกตุ", positionName: "ลูกจ้างชั่วคราว", groupName: "กลุ่มอำนวยการ", hasSignature: false },
  { id: 14, personId: "1179900374913", prefix: "นางสาว", firstName: "เฌศรา", lastName: "วิทยาบุเคราะห๋", positionName: "ลูกจ้างชั่วคราว", groupName: "กลุ่มอำนวยการ", hasSignature: false },
  { id: 15, personId: "3180400388557", prefix: "นาย", firstName: "สัมฤทธิ์", lastName: "มณีรอด", positionName: "พนักงานขับรถยนต์", groupName: "กลุ่มอำนวยการ", hasSignature: false },
  { id: 16, personId: "1189900128149", prefix: "นาย", firstName: "ฐาปกร", lastName: "สุขเกษม", positionName: "พนักงานขับรถยนต์", groupName: "กลุ่มอำนวยการ", hasSignature: false },
  { id: 17, personId: "3120500328611", prefix: "นาย", firstName: "สุรชาติ", lastName: "จันทร์กรอง", positionName: "พนักงานขับรถยนต์", groupName: "กลุ่มอำนวยการ", hasSignature: false },
  { id: 18, personId: "3180100534833", prefix: "นางสาว", firstName: "ชีวาพร", lastName: "สุขสันต์", positionName: "แม่บ้าน", groupName: "กลุ่มอำนวยการ", hasSignature: false },
  { id: 19, personId: "3189900122651", prefix: "นาย", firstName: "บุญยะ", lastName: "เพิ่มคล้าย", positionName: "ยาม", groupName: "กลุ่มอำนวยการ", hasSignature: false },
  { id: 20, personId: "3180100407432", prefix: "นาย", firstName: "ไพศาล", lastName: "ฉิมให้", positionName: "ช่างไม้ชั้น 4", groupName: "กลุ่มอำนวยการ", hasSignature: false },
  { id: 21, personId: "3180500036989", prefix: "นางสาว", firstName: "สมาภรณ์", lastName: "แสงกู่อารีย์", positionName: "ผู้อำนวยการกลุ่ม", groupName: "กลุ่มนโยบายและแผน", hasSignature: true },
  { id: 22, personId: "3180100096577", prefix: "นาง", firstName: "วราภรณ์", lastName: "บุญเกตุ", positionName: "เจ้าพนักงานธุรการ", groupName: "กลุ่มนโยบายและแผน", hasSignature: false },
  { id: 23, personId: "1650100091680", prefix: "นาย", firstName: "ณัฐวุฒิ", lastName: "คุ้มเงิน", positionName: "นักวิเคราะห์นโยบายและแผน", groupName: "กลุ่มนโยบายและแผน", hasSignature: false },
  { id: 24, personId: "1619900161117", prefix: "นางสาว", firstName: "ธนพร", lastName: "ยุวดี", positionName: "นักวิเคราะห์นโยบายและแผน", groupName: "กลุ่มนโยบายและแผน", hasSignature: false },
  { id: 25, personId: "1609700165305", prefix: "นาย", firstName: "อภิวัฒน์", lastName: "เมืองร่วม", positionName: "นักวิเคราะห์นโยบายและแผน", groupName: "กลุ่มนโยบายและแผน", hasSignature: false },
  { id: 26, idNum: 26, personId: "3180400460363", prefix: "นาง", firstName: "อินทิรา", lastName: "บูรณา", positionName: "นักวิเคราะห์นโยบายและแผน", groupName: "กลุ่มนโยบายและแผน", hasSignature: false },
  { id: 27, personId: "1619900107791", prefix: "นาย", firstName: "เอกวิชช์", lastName: "จันทร์", positionName: "นักวิชาการคอมพิวเตอร์", groupName: "กลุ่มนโยบายและแผน", hasSignature: false },
  { id: 28, personId: "1180600011256", prefix: "นาย", firstName: "หยก", lastName: "มีผิว", positionName: "นักวิชาการคอมพิวเตอร์", groupName: "กลุ่มนโยบายและแผน", hasSignature: true },
  { id: 29, personId: "1189900317111", prefix: "นาย", firstName: "จิรกฤต", lastName: "บูรณา", positionName: "ลูกจ้างชั่วคราว", groupName: "กลุ่มนโยบายและแผน", hasSignature: false },
  { id: 30, personId: "1610100082737", prefix: "นางสาว", firstName: "ปัทมา", lastName: "สาระกิจ", positionName: "เจ้าพนักงานธุรการ", groupName: "กลุ่มบริหารงานบุคคล", hasSignature: false },
  { id: 31, personId: "3141000094000", prefix: "นางสาว", firstName: "เฉลิมศิริ", lastName: "กลิ่นเกษร", positionName: "นักทรัพยากรบุคคล", groupName: "กลุ่มบริหารงานบุคคล", hasSignature: false },
  { id: 32, personId: "3180100330499", prefix: "นาง", firstName: "บุณย์สิตา", lastName: "ทองลอย", positionName: "นักทรัพยากรบุคคล", groupName: "กลุ่มบริหารงานบุคคล", hasSignature: false },
  { id: 33, personId: "1619900223155", prefix: "นาย", firstName: "พสิษฐ์", lastName: "ศรีกรด", positionName: "นักทรัพยากรบุคคล", groupName: "กลุ่มบริหารงานบุคคล", hasSignature: false },
  { id: 34, personId: "1189900002064", prefix: "นาง", firstName: "อัญญารัตน์", lastName: "สุจริตจันทร์", positionName: "นักทรัพยากรบุคคล", groupName: "กลุ่มบริหารงานบุคคล", hasSignature: false },
  { id: 35, personId: "3180100289111", prefix: "นางสาว", firstName: "ภัสทิรา", lastName: "แชนอก", positionName: "นักทรัพยากรบุคคล", groupName: "กลุ่มบริหารงานบุคคล", hasSignature: false },
  { id: 36, personId: "1601000005413", prefix: "นางสาว", firstName: "นีรนุช", lastName: "จงเจริญ", positionName: "นักทรัพยากรบุคคล", groupName: "กลุ่มบริหารงานบุคคล", hasSignature: false },
  { id: 37, personId: "1600100725239", prefix: "นางสาว", firstName: "ปนัดดา", lastName: "มหากาญจน์", positionName: "นักทรัพยากรบุคคล", groupName: "กลุ่มบริหารงานบุคคล", hasSignature: false },
  { id: 38, personId: "1620400220035", prefix: "นางสาว", firstName: "ภานุมาศ", lastName: "คันศร", positionName: "นักทรัพยากรบุคคล", groupName: "กลุ่มบริหารงานบุคคล", hasSignature: false },
  { id: 39, personId: "1180200080773", prefix: "นาย", firstName: "วรัญญูกร", lastName: "ขันตะ", positionName: "พนักงานพิมพ์ดีด", groupName: "กลุ่มบริหารงานบุคคล", hasSignature: false },
  { id: 40, personId: "1179900204759", prefix: "นางสาว", firstName: "ชนม์ณานันต์", lastName: "ราชาตัน", positionName: "เจ้าพนักงานธุรการ", groupName: "กลุ่มส่งเสริมการจัดการศึกษา", hasSignature: false },
  { id: 41, personId: "3180100079338", prefix: "นางสาว", firstName: "นภาพร", lastName: "เทียมทอง", positionName: "เจ้าพนักงานธุรการ", groupName: "กลุ่มส่งเสริมการจัดการศึกษา", hasSignature: false },
  { id: 42, personId: "1600100406354", prefix: "นางสาว", firstName: "ณัทรสรันต์", lastName: "บุญรักษา", positionName: "เจ้าพนักงานธุรการ", groupName: "กลุ่มส่งเสริมการจัดการศึกษา", hasSignature: false },
  { id: 43, personId: "3180400509290", prefix: "นาง", firstName: "วีนัส", lastName: "เปรมทอง", positionName: "นักวิชาการศึกษา", groupName: "กลุ่มส่งเสริมการจัดการศึกษา", hasSignature: false },
  { id: 44, personId: "3769800017761", prefix: "นาง", firstName: "ชุติมา", lastName: "โพธิ์เรือง", positionName: "นักวิชาการศึกษา", groupName: "กลุ่มส่งเสริมการจัดการศึกษา", hasSignature: false },
  { id: 45, personId: "3180100096542", prefix: "นาง", firstName: "สุกัญญา", lastName: "มิ่งไชย", positionName: "นักวิชาการศึกษา", groupName: "กลุ่มส่งเสริมการจัดการศึกษา", hasSignature: false },
  { id: 46, personId: "3189900091934", prefix: "นาย", firstName: "ชนพัฒน์", lastName: "ตั้งสกุลมงคล", positionName: "นักวิชาการศึกษา", groupName: "กลุ่มส่งเสริมการจัดการศึกษา", hasSignature: false },
  { id: 47, personId: "1189900129749", prefix: "นางสาว", firstName: "ชุติมา", lastName: "เกิดมงคล", positionName: "นักวิชาการศึกษา", groupName: "กลุ่มส่งเสริมการจัดการศึกษา", hasSignature: false },
  { id: 48, personId: "3180400445836", prefix: "นาย", firstName: "ปราโมทย์", lastName: "เลยะวัฒนะ", positionName: "นักวิชาการศึกษา", groupName: "กลุ่มส่งเสริมการจัดการศึกษา", hasSignature: false },
  { id: 50, personId: "1279800003254", prefix: "นางสาว", firstName: "ศิริรัตน์", lastName: "รัตนเพชร", positionName: "นักจิตวิทยาโรงเรียนประจำเขตพื้นที่การศึกษา", groupName: "กลุ่มส่งเสริมการจัดการศึกษา", hasSignature: false },
  { id: 51, personId: "1189900158374", prefix: "นางสาว", firstName: "สาวิณี", lastName: "อินคล้าย", positionName: "ลูกจ้างชั่วคราว", groupName: "กลุ่มส่งเสริมการจัดการศึกษา", hasSignature: false },
  { id: 52, personId: "3180600142683", prefix: "นาง", firstName: "ราราพรรณ", lastName: "ศรีเดช", positionName: "พนักงานธุรการ ส4", groupName: "กลุ่มส่งเสริมการจัดการศึกษา", hasSignature: false },
  { id: 53, personId: "3180100287577", prefix: "นาย", firstName: "ประสาธพร", lastName: "แสงทอง", positionName: "รอง สว.(ป) กก.ตชด 13", groupName: "กลุ่มส่งเสริมการจัดการศึกษา", hasSignature: false },
  { id: 54, personId: "3180100510934", prefix: "นาย", firstName: "อนันต์ศักดิ์", lastName: "มาทิพย์", positionName: "ผู้อำนวยการกลุ่ม", groupName: "กลุ่มนิเทศติดตามและประเมินผลฯ", hasSignature: false },
  { id: 55, personId: "1180600012902", prefix: "นางสาว", firstName: "รุ่งรวี", lastName: "บุญเงิน", positionName: "ศึกษานิเทศก์", groupName: "กลุ่มนิเทศติดตามและประเมินผลฯ", hasSignature: false },
  { id: 56, personId: "1179900069738", prefix: "นาย", firstName: "สุรวุฒิ", lastName: "ตั้งดี", positionName: "ศึกษานิเทศก์", groupName: "กลุ่มนิเทศติดตามและประเมินผลฯ", hasSignature: false },
  { id: 57, personId: "3180500183078", prefix: "นางสาว", firstName: "พิศ", lastName: "ศรีสวัสดิ์", positionName: "ศึกษานิเทศก์", groupName: "กลุ่มนิเทศติดตามและประเมินผลฯ", hasSignature: false },
  { id: 58, personId: "1180600013321", prefix: "นาย", firstName: "กิตติชัย", lastName: "อุดมศักดิ์ศรี", positionName: "ศึกษานิเทศก์", groupName: "กลุ่มนิเทศติดตามและประเมินผลฯ", hasSignature: false },
  { id: 59, personId: "1180200017940", prefix: "นางสาว", firstName: "เมรปิยา", lastName: "สุพรรณ์", positionName: "ศึกษานิเทศก์", groupName: "กลุ่มนิเทศติดตามและประเมินผลฯ", hasSignature: false },
  { id: 60, personId: "3180600172744", prefix: "นาง", firstName: "กวิสรา", lastName: "ศรีศักดา", positionName: "ศึกษานิเทศก์", groupName: "กลุ่มนิเทศติดตามและประเมินผลฯ", hasSignature: false },
  { id: 61, personId: "3620400910836", prefix: "นาย", firstName: "กีรติ", lastName: "จุลเนตร", positionName: "ศึกษานิเทศก์", groupName: "กลุ่มนิเทศติดตามและประเมินผลฯ", hasSignature: false },
  { id: 62, personId: "3180100121024", prefix: "นาง", firstName: "รพีพร", lastName: "สุ่มเย็นทอง", positionName: "ศึกษานิเทศก์", groupName: "กลุ่มนิเทศติดตามและประเมินผลฯ", hasSignature: false },
  { id: 63, personId: "1189900020046", prefix: "นางสาว", firstName: "เพียงมณี", lastName: "โพธิ์ทวี", positionName: "ศึกษานิเทศก์", groupName: "กลุ่มนิเทศติดตามและประเมินผลฯ", hasSignature: false },
  { id: 64, personId: "2670500025071", prefix: "นางสาว", firstName: "แววดาว", lastName: "ชุ่มอิ่ม", positionName: "ศึกษานิเทศก์", groupName: "กลุ่มนิเทศติดตามและประเมินผลฯ", hasSignature: false },
  { id: 65, personId: "3610400073489", prefix: "นางสาว", firstName: "อุทุมพร", lastName: "พรายอินทร์", positionName: "ศึกษานิเทศก์", groupName: "กลุ่มนิเทศติดตามและประเมินผลฯ", hasSignature: false },
  { id: 66, personId: "3102001896488", prefix: "นางสาว", firstName: "วรินทร์", lastName: "วิริยะธรรมรักษ์", positionName: "ศึกษานิเทศก์", groupName: "กลุ่มนิเทศติดตามและประเมินผลฯ", hasSignature: false },
  { id: 67, personId: "1619900103761", prefix: "นาย", firstName: "บรรทูรย์", lastName: "สิงห์ดี", positionName: "ศึกษานิเทศก์", groupName: "กลุ่มนิเทศติดตามและประเมินผลฯ", hasSignature: false },
  { id: 68, personId: "1659900505649", prefix: "นางสาว", firstName: "แพรวา", lastName: "เนติยศิน", positionName: "ศึกษานิเทศก์", groupName: "กลุ่มนิเทศติดตามและประเมินผลฯ", hasSignature: false },
  { id: 69, personId: "3321000973770", prefix: "นางสาว", firstName: "พิมพญาน", lastName: "พงศ์พิศาลชัย", positionName: "ศึกษานิเทศก์", groupName: "กลุ่มนิเทศติดตามและประเมินผลฯ", hasSignature: false },
  { id: 70, personId: "3180600298225", prefix: "นาย", firstName: "จำนงค์", lastName: "ศิริโรจน์", positionName: "ศึกษานิเทศก์", groupName: "กลุ่มนิเทศติดตามและประเมินผลฯ", hasSignature: false },
  { id: 71, personId: "3180500570721", prefix: "นางสาว", firstName: "อินทิรา", lastName: "จำนงค์คำ", positionName: "ศึกษานิเทศก์", groupName: "กลุ่มนิเทศติดตามและประเมินผลฯ", hasSignature: false },
  { id: 72, personId: "3180600347455", prefix: "นาง", firstName: "ลักขณา", lastName: "กสิกรรม", positionName: "ศึกษานิเทศก์", groupName: "กลุ่มนิเทศติดตามและประเมินผลฯ", hasSignature: false },
  { id: 73, personId: "3149900226341", prefix: "นาง", firstName: "สาธิตา", lastName: "ชาตะรูปะ", positionName: "เจ้าพนักงานธุรการ", groupName: "กลุ่มนิเทศติดตามและประเมินผลฯ", hasSignature: false },
  { id: 74, personId: "1610100133480", prefix: "นางสาว", firstName: "วิไลลักษณ์", lastName: "ดิษหงษ์", positionName: "พนักงานราชการ", groupName: "กลุ่มนิเทศติดตามและประเมินผลฯ", hasSignature: false },
  { id: 75, personId: "3180400040119", prefix: "นางสาว", firstName: "กิ่งดาว", lastName: "บุญสรรเสริญ", positionName: "ผู้อำนวยการกลุ่ม", groupName: "กลุ่มบริหารงานการเงินและสินทรัพย์", hasSignature: false },
  { id: 76, personId: "1100200828387", prefix: "นาง", firstName: "นุชรี", lastName: "เขียนเสาร์", positionName: "นักวิชาการเงินและบัญชี", groupName: "กลุ่มบริหารงานการเงินและสินทรัพย์", hasSignature: false },
  { id: 77, personId: "3180100075961", prefix: "นางสาว", firstName: "พัธนรรถ", lastName: "เกตุกฤษดา", positionName: "นักวิชาการเงินและบัญชี", groupName: "กลุ่มบริหารงานการเงินและสินทรัพย์", hasSignature: false },
  { id: 78, personId: "3180100080051", prefix: "นาง", firstName: "จรรยาพัชร์", lastName: "วรบุญเสริมทรัพย์", positionName: "นักวิชาการเงินและบัญชี", groupName: "กลุ่มบริหารงานการเงินและสินทรัพย์", hasSignature: false },
  { id: 79, personId: "1189900177549", prefix: "นางสาว", firstName: "วิมาลา", lastName: "ทองน้อย", positionName: "นักวิชาการเงินและบัญชี", groupName: "กลุ่มบริหารงานการเงินและสินทรัพย์", hasSignature: false },
  { id: 80, personId: "1600100517075", prefix: "นางสาว", firstName: "กมลชนก", lastName: "รัตนเสถียร", positionName: "นักวิชาการเงินและบัญชี", groupName: "กลุ่มบริหารงานการเงินและสินทรัพย์", hasSignature: false },
  { id: 81, personId: "1104700008048", prefix: "นางสาว", firstName: "ณิชากร", lastName: "หมีทอง", positionName: "นักวิชาการเงินและบัญชี", groupName: "กลุ่มบริหารงานการเงินและสินทรัพย์", hasSignature: false },
  { id: 82, personId: "1669800141246", prefix: "นางสาว", firstName: "ชุลีพร", lastName: "ทองยิ้ม", positionName: "นักวิชาการพัสดุ", groupName: "กลุ่มบริหารงานการเงินและสินทรัพย์", hasSignature: false },
  { id: 83, personId: "1189900324801", prefix: "นางสาว", firstName: "ศรันย์พร", lastName: "อนันตนนท์", positionName: "ลูกจ้างชั่วคราว", groupName: "กลุ่มบริหารงานการเงินและสินทรัพย์", hasSignature: false },
  { id: 84, personId: "1189900068693", prefix: "นางสาว", firstName: "กัลยวีร์", lastName: "แสงทอง", positionName: "ลูกจ้างชั่วคราว", groupName: "กลุ่มบริหารงานการเงินและสินทรัพย์", hasSignature: false },
  { id: 85, personId: "3600500572177", prefix: "นางสาว", firstName: "ปทิตตา", lastName: "สุวรรณวัฒนา", positionName: "ผู้อำนวยการกลุ่ม", groupName: "กลุ่มกฎหมายและคดี", hasSignature: false },
  { id: 86, personId: "3180200028409", prefix: "นาย", firstName: "เจริญชัย", lastName: "ปินชัย", positionName: "นิติกร", groupName: "กลุ่มกฎหมายและคดี", hasSignature: false },
  { id: 87, personId: "3180400504743", prefix: "นางสาว", firstName: "กมลวรรณ", lastName: "แจ้งดี", positionName: "นักวิชาการตรวจสอบภายใน", groupName: "หน่วยตรวจสอบภายใน", hasSignature: false },
  { id: 88, personId: "1400500019899", prefix: "นางสาว", firstName: "มลฤดี", lastName: "เกตุเวียง", positionName: "นักวิชาการตรวจสอบภายใน", groupName: "หน่วยตรวจสอบภายใน", hasSignature: false },
  { id: 89, personId: "3710600928983", prefix: "นาง", firstName: "เจษฎา", lastName: "ปานพรม", positionName: "นักทรัพยากรบุคคล", groupName: "กลุ่มพัฒนาครูและบุคลากรทางการศึกษา", hasSignature: false },
  { id: 90, personId: "3400500324558", prefix: "นางสาว", firstName: "รุ่งรัตน์", lastName: "พานพรม", positionName: "นักทรัพยากรบุคคล", groupName: "กลุ่มพัฒนาครูและบุคลากรทางการศึกษา", hasSignature: false },
];

export default async function PersonDistrictSignaturesSettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const perms = await getPersonPermissions(Number(session.user.id));
  if (!canManagePersonStaffPermissions(session.user)) {
    redirect("/modules/person/staff");
  }

  const dbPeople = await listAllDistrictPeople();
  const data = dbPeople.length > 0 ? dbPeople : DISTRICT_SIGNATURE_FULL_DATA;

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-primary">
          ลายเซ็นบุคลากร สพท. (ไฟล์ PNG)
        </h2>
        <p className="text-xs text-muted-foreground">
          จัดการไฟล์ภาพลายเซ็นประจำตัวบุคลากรสังกัด สพท. สำหรับใช้งานในเอกสารหนังสือราชการ ({data.length} รายการ)
        </p>
      </div>

      <PersonDistrictSignaturesTable initialData={data} />
    </section>
  );
}
