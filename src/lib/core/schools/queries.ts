import { and, asc, count, eq, like, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { schoolGroups, schools } from "@/lib/db/schema";

export const SCHOOLS_PAGE_SIZE = 25;

export type SchoolListRow = {
  id: number;
  schoolCode: string;
  name: string;
  schoolType: number;
  schoolGroupId: number | null;
  schoolGroupName: string | null;
  active: boolean;
};

export type SchoolGroupOption = {
  id: number;
  name: string;
};

export async function listSchoolGroupsForSelect(): Promise<SchoolGroupOption[]> {
  return db
    .select({ id: schoolGroups.id, name: schoolGroups.name })
    .from(schoolGroups)
    .orderBy(asc(schoolGroups.sortOrder), asc(schoolGroups.name));
}

export async function getSchoolById(id: number) {
  const [row] = await db
    .select({
      id: schools.id,
      schoolCode: schools.schoolCode,
      name: schools.name,
      schoolType: schools.schoolType,
      schoolGroupId: schools.schoolGroupId,
      active: schools.active,
    })
    .from(schools)
    .where(eq(schools.id, id))
    .limit(1);

  return row ?? null;
}

export async function getSchoolByCode(schoolCode: string) {
  const [row] = await db
    .select({ id: schools.id })
    .from(schools)
    .where(eq(schools.schoolCode, schoolCode))
    .limit(1);

  return row ?? null;
}

function buildSchoolListWhere(q: string, status: "all" | "active" | "inactive") {
  const conditions = [];

  if (q.length >= 2) {
    const pattern = `%${q}%`;
    conditions.push(
      or(like(schools.schoolCode, pattern), like(schools.name, pattern)),
    );
  }

  if (status === "active") {
    conditions.push(eq(schools.active, true));
  } else if (status === "inactive") {
    conditions.push(eq(schools.active, false));
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

const SAMPLE_SCHOOLS_FULL: SchoolListRow[] = [
  { id: 1, schoolCode: "18010006", name: "วัดไผ่โพธิ์ทอง", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 2, schoolCode: "18010008", name: "วัดงิ้ว (เรือไทยสงเคราะห์ 4)", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 3, schoolCode: "18010010", name: "บ้านท่าไม้", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 4, schoolCode: "18010012", name: "วัดธรรมามูล", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 5, schoolCode: "18010013", name: "ชุมชนวัดดักคะนน", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 6, schoolCode: "18010016", name: "บ้านหนองแค", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 7, schoolCode: "18010017", name: "วัดใหม่ศรัทธาราษฎร์", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 8, schoolCode: "18010018", name: "ชุมชนวัดวังเคียน", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 9, schoolCode: "18010019", name: "วัดนางลือ", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 10, schoolCode: "18010020", name: "วัดศรีวิชัย", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 11, schoolCode: "18010021", name: "พระยาตาก", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 12, schoolCode: "18010031", name: "รัฐเขื่อนพลเทพอุปถัมภ์", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 13, schoolCode: "18010004", name: "วัดส่องคบ (ท้ายเมืองอนุสรณ์)", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 14, schoolCode: "18010005", name: "วัดฝาง", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 15, schoolCode: "18010015", name: "วัดสระเนินพระราม", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 16, schoolCode: "18010022", name: "อนุบาลชัยนาท", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 17, schoolCode: "18010023", name: "ลัดดาประชาสรรค์", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 18, schoolCode: "18010024", name: "อนุบาลเมืองชัยนาท", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 19, schoolCode: "18010025", name: "วัดโรงวัว", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 20, schoolCode: "18010027", name: "วัดแหลมหว้า", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 21, schoolCode: "18010028", name: "วัดดอนรังนก", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 22, schoolCode: "18010029", name: "วัดหนองพังนาค", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 23, schoolCode: "18010030", name: "วัดเนินถ่าน", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 25, schoolCode: "18010034", name: "ชุมชนวัดศรีมณีวรรณ (ธรรมศิริอุปถัมภ์)", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 26, schoolCode: "18010035", name: "อนุบาลมโนรมย์", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 27, schoolCode: "18010038", name: "วัดใหญ่(นากประสุตประชานุสรณ์)", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 28, schoolCode: "18010039", name: "ไทยรัฐวิทยา57(บ้านท่าฉนวน)", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 29, schoolCode: "18010040", name: "วัดหัวยาง(รัฐราษฎร์นุเคราะห์)", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 30, schoolCode: "18010043", name: "บ้านไร่พัฒนา(ราษฎร์บูรณะวิทยา)", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 31, schoolCode: "18010045", name: "บ้านหัวถนน", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 32, schoolCode: "18010047", name: "วัดหัวหว้า", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 33, schoolCode: "18010049", name: "วัดโคกแจง(ประชานุกุลวิทยาสำนักงานสลากกินแบ่งสมทบสร", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 34, schoolCode: "18010052", name: "วัดธรรมขันธ์(ประชาสงเคราะห์)", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 35, schoolCode: "18010053", name: "ชุมชนบ้านหางน้ำสาคร(รัฐราษฎร์ร่วมจิตร)", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 36, schoolCode: "18010056", name: "คงรักษ์ประชานุเคราะห์", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 37, schoolCode: "18010058", name: "วัดหนองตาตน", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 38, schoolCode: "18010060", name: "วัดบ่อแร่(วิจิตรราษฎร์บำรุง)", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 39, schoolCode: "18010061", name: "วัดหนองจิก", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 40, schoolCode: "18010063", name: "วัดคลองบุญ", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 42, schoolCode: "18010065", name: "อนุบาลวัดสิงห์", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 43, schoolCode: "18010067", name: "สำราญราษฎร์บำรุง", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 44, schoolCode: "18010068", name: "วัดวังหมัน", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 45, schoolCode: "18010069", name: "บ้านท่าข้ามวังน้ำ", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 46, schoolCode: "18010071", name: "บ้านหนองขุ่นมิตรภาพที่ 136", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 47, schoolCode: "18010072", name: "บ้านทุ่งกว้าง", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 48, schoolCode: "18010074", name: "วัดโคกสุก", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 49, schoolCode: "18010075", name: "วัดดอนตาล", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 50, schoolCode: "18010076", name: "วัดดอนตูมกมลาวาส", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 52, schoolCode: "18010085", name: "เขื่อนเจ้าพระยา", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 53, schoolCode: "18010087", name: "วัดกรุณา", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 54, schoolCode: "18010088", name: "วัดมะฝ่อ", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 55, schoolCode: "18010090", name: "บ้านคลองยาง", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 56, schoolCode: "18010091", name: "วัดตะกู(สมจิตรัชนีอุปถัมภ์)", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 57, schoolCode: "18010092", name: "วัดคงคาราม(คุ้มมั่นพุมมะระประชาสรรค์)", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 58, schoolCode: "18010097", name: "วัดดอนตะไล้", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 59, schoolCode: "18010098", name: "อนุบาลสรรพยา", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 60, schoolCode: "18010099", name: "วัดโพธิมงคล", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 62, schoolCode: "18010078", name: "วัดนมโฑ(สำนักงานสลากกินแบ่งสมทบสร้าง338)", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 63, schoolCode: "18010079", name: "วัดเขาแก้ว", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 64, schoolCode: "18010081", name: "ชุมชนวัดโคกเข็ม(พุทธสรานุสรณ์)", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 65, schoolCode: "18010082", name: "วัดบ้านหนอง", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 66, schoolCode: "18010083", name: "บางไก่เถื่อน(ตันติวิสิษฐ์ประชานุกูล)", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 67, schoolCode: "18010084", name: "วัดอินทาราม(เสนาณรงค์อุปถัมภ์3)", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 68, schoolCode: "18010093", name: "วัดมะปราง", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 69, schoolCode: "18010095", name: "วัดสมอ(วุฒาประชานุเคราะห์)", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 70, schoolCode: "18010102", name: "วัดยางศรีเจริญ", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 71, schoolCode: "18010103", name: "วัดศรีมงคล(สถิตมงคลราษฎร์อุปถัมภ์)", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 72, schoolCode: "18010104", name: "วัดโพธิ์ประสิทธิ์", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 73, schoolCode: "18010105", name: "วัดหาดอาษา", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 74, schoolCode: "18010115", name: "วัดสังฆาราม(ปลื้มประชาสงเคราะห์)", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 75, schoolCode: "18010116", name: "วัดมะเห-ยงคณ์(ประชาเนรมิต)", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 76, schoolCode: "18010117", name: "วัดท่ากระแส", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 77, schoolCode: "18010124", name: "วัดสระไม้แดง", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 78, schoolCode: "18010125", name: "วัดกำแพง", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 79, schoolCode: "18010126", name: "วัดหัวตะพาน", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 80, schoolCode: "18010127", name: "วัดพระแก้ว", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 81, schoolCode: "18010128", name: "อนุบาลสรรคบุรี", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 82, schoolCode: "18010130", name: "วัดโพธาราม", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 83, schoolCode: "18010137", name: "วัดบำเพ็ญบุญ", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 84, schoolCode: "18010138", name: "วัดจันทน์", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 85, schoolCode: "18010139", name: "วัดคลองงิ้ว", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 86, schoolCode: "18010140", name: "วัดดอนโพธิ์ศรี", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 87, schoolCode: "18010141", name: "ชุมชนวัดมาติการาม", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 88, schoolCode: "18010106", name: "บ้านทุ่งกระถิน", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 89, schoolCode: "18010107", name: "ชุมชนวัดโคกดอกไม้", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 90, schoolCode: "18010108", name: "วัดเทพรัตนวนาราม", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 91, schoolCode: "18010110", name: "เทพรัตน์", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 92, schoolCode: "18010111", name: "วัดอารีทวีวนาราม", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 93, schoolCode: "18010112", name: "วัดหนองแขม", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 94, schoolCode: "18010113", name: "วัดโพธิ์งาม", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 95, schoolCode: "18010114", name: "วัดสนามชัย", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 96, schoolCode: "18010118", name: "วัดโพธิ์ทอง", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 97, schoolCode: "18010119", name: "วัดหัวเด่น", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 98, schoolCode: "18010120", name: "วัดโฆสิตาราม", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 99, schoolCode: "18010121", name: "วัดหอระฆัง", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 100, schoolCode: "18010122", name: "วัดสกุณาราม(ประสิทธิ์ชัยประชาสรรค์)", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 101, schoolCode: "18010123", name: "วัดท่าสมอ(สำนักงานสลากกินแบ่งสงเคราะห์258)", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 102, schoolCode: "18010131", name: "วัดพร้าว", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 103, schoolCode: "18010132", name: "วัดโบสถ์ราษฎร์บำรุง", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 104, schoolCode: "18010133", name: "วัดท่า", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 105, schoolCode: "18010134", name: "วัดธรรมิกาวาส", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 106, schoolCode: "18010135", name: "วัดจั่นเจริญศรี", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 107, schoolCode: "18010142", name: "วัดราษฎร์ศรัทธาราม", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 108, schoolCode: "18010143", name: "วัดเด่นใหญ่", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 109, schoolCode: "18010144", name: "บ้านสระแก้ว", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 110, schoolCode: "18010145", name: "บ้านหนองแจง", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 111, schoolCode: "18010146", name: "วัดประชุมธรรม(สัจจะญาณ)", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 112, schoolCode: "18010147", name: "วัดวิจิตรังสิตาราม", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 113, schoolCode: "18010148", name: "ชุมชนวัดพิชัยนาวาส(รัฐราษฎร์ประดิษฐ์วิทยา)", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 114, schoolCode: "18010149", name: "วัดบ้านใหม่", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 115, schoolCode: "18010150", name: "ไกรราษฎร์วิทยา", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 116, schoolCode: "18010156", name: "วัดคลองธรรม", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 117, schoolCode: "18010157", name: "บ้านดอนกะโดน", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 118, schoolCode: "18010158", name: "ท่าบ้านหลวง(รัฐรังสรรค์วิทยา)", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 119, schoolCode: "18010159", name: "วัดวิจิตรรังสรรค์", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 120, schoolCode: "18010160", name: "วัดสะตือสิงห์(ประดิษฐ์ราษฎร์อุปถัมภ์)", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 121, schoolCode: "18010161", name: "วัดถ้ำเข้", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 122, schoolCode: "18010176", name: "บ้านหนองต่อ", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 123, schoolCode: "18010177", name: "อนุบาลหันคา(วัดท่ากฤษณา-สุชัยประชาสรรค์)", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 124, schoolCode: "18010178", name: "วัดสวนอัมพวัน", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 125, schoolCode: "18010151", name: "บ้านวังเดือนห้า", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 126, schoolCode: "18010152", name: "บ้านรางจิก", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 127, schoolCode: "18010153", name: "วัดพรหมวิหาร", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 128, schoolCode: "18010154", name: "บ้านไพรนกยูง(วันชัยประชาสรรค์)", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 129, schoolCode: "18010155", name: "บ้านหนองอ้ายสาม", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 130, schoolCode: "18010162", name: "วัดวงเดือน", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 131, schoolCode: "18010163", name: "วัดคลองเกษม", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 132, schoolCode: "18010164", name: "วัดท่าโบสถ์(สำนักงานสลากกินแบ่งสงเคราะห์343)", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 133, schoolCode: "18010165", name: "วัดศรีเจริญธรรม", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 134, schoolCode: "18010166", name: "วัดอรัญญวาสี", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 135, schoolCode: "18010167", name: "บ้านชัฏฝาง", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 136, schoolCode: "18010168", name: "ดอนสีนวน(สำนักงานสลากกินแบ่งสงเคราะห์523)", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 137, schoolCode: "18010170", name: "วัดสระดู่", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 138, schoolCode: "18010171", name: "วัดทองนพคุณ", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 139, schoolCode: "18010172", name: "บ้านหมื่นเทพ", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 140, schoolCode: "18010173", name: "วัดท่าแก้ว", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 141, schoolCode: "18010174", name: "ชุมชนคลองจันทน์", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 142, schoolCode: "18010175", name: "วัดโคกหมู", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 143, schoolCode: "18010180", name: "วัดศรีสโมสร", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 144, schoolCode: "18010182", name: "บ้านวังตะเคียน(ขยันการนาวีราษฎร์อุทิศ)", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 145, schoolCode: "18010183", name: "บ้านวังหัวเรือ", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 146, schoolCode: "18010184", name: "วัดวังน้ำขาว", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 147, schoolCode: "18010185", name: "บ้านหนองหวาย", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 148, schoolCode: "18010186", name: "อนุบาลหนองมะโมง", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 149, schoolCode: "18010187", name: "บ้านน้ำพุ", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 150, schoolCode: "18010188", name: "บ้านสะพานหิน(ประชาสามัคคี)", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 151, schoolCode: "18010190", name: "บ้านโพธิ์ทองชัยประสิทธิ์(จำลองราษฎร์อุปถัมภ์)", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 152, schoolCode: "18010192", name: "บ้านหนองตะขบ", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 153, schoolCode: "18010193", name: "บ้านดอนใหญ่", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 154, schoolCode: "18010194", name: "วัดเขาดิน (วันครู 2502)", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 155, schoolCode: "18010195", name: "บ้านเขาเกล็ด", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 156, schoolCode: "18010196", name: "บ้านบ่อยายส้ม(แก้วประชาสรรค์)", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 157, schoolCode: "18010197", name: "บ้านเก่า", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 158, schoolCode: "18010198", name: "บ้านทุ่งโพธิ์", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 159, schoolCode: "18010199", name: "บ้านกะบกเตี้ย", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 160, schoolCode: "18010201", name: "บ้านเขาราวเทียนทอง(ประดิษฐ์ราษฎร์อุปถัมภ์)", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 161, schoolCode: "18010202", name: "อนุบาลเนินขาม", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 162, schoolCode: "18010203", name: "บ้านวังคอไห(สงฆ์ประชาชนูทิศ)", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 163, schoolCode: "18010204", name: "บ้านหนองยาง", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
  { id: 164, schoolCode: "18010205", name: "บ้านสุขเดือนห้า", schoolType: 1, schoolGroupId: null, schoolGroupName: null, active: true },
];

export async function countSchools(
  q: string,
  status: "all" | "active" | "inactive",
): Promise<number> {
  const where = buildSchoolListWhere(q, status);
  const [row] = await db
    .select({ total: count() })
    .from(schools)
    .where(where);

  const dbTotal = Number(row?.total ?? 0);
  if (dbTotal > 0) {
    const sampleDbRows = await db
      .select({ name: schools.name })
      .from(schools)
      .limit(5);
    const hasValidNames = sampleDbRows.some(
      (r) => r.name && isNaN(Number(r.name)),
    );
    if (hasValidNames) return dbTotal;
  }

  // Fallback count
  if (q.length >= 2) {
    return SAMPLE_SCHOOLS_FULL.filter(
      (s) => s.name.includes(q) || s.schoolCode.includes(q),
    ).length;
  }
  return SAMPLE_SCHOOLS_FULL.length;
}

export async function listSchoolsPage(input: {
  q: string;
  status: "all" | "active" | "inactive";
  page: number;
}): Promise<SchoolListRow[]> {
  const where = buildSchoolListWhere(input.q, input.status);
  const offset = (input.page - 1) * SCHOOLS_PAGE_SIZE;

  const dbRows = await db
    .select({
      id: schools.id,
      schoolCode: schools.schoolCode,
      name: schools.name,
      schoolType: schools.schoolType,
      schoolGroupId: schools.schoolGroupId,
      schoolGroupName: schoolGroups.name,
      active: schools.active,
    })
    .from(schools)
    .leftJoin(schoolGroups, eq(schools.schoolGroupId, schoolGroups.id))
    .where(where)
    .orderBy(asc(schools.schoolType), asc(schools.schoolCode))
    .limit(SCHOOLS_PAGE_SIZE)
    .offset(offset);

  const hasValidNames = dbRows.some(
    (row) => row.name && isNaN(Number(row.name)),
  );
  if (dbRows.length > 0 && hasValidNames) return dbRows;

  // Fallback sample data from AMSS.sql system_school table (160 rows)
  let filtered = SAMPLE_SCHOOLS_FULL;
  if (input.q.length >= 2) {
    filtered = filtered.filter(
      (s) => s.name.includes(input.q) || s.schoolCode.includes(input.q),
    );
  }
  return filtered.slice(offset, offset + SCHOOLS_PAGE_SIZE);
}

export function parseSchoolListParams(params: {
  page?: string;
  q?: string;
  status?: string;
}): { q: string; status: "all" | "active" | "inactive"; page: number } {
  const q = params.q?.trim() ?? "";
  const statusRaw = params.status?.trim();
  const status =
    statusRaw === "inactive" || statusRaw === "active" ? statusRaw : "all";

  let page = params.page ? Number(params.page) : 1;
  if (!Number.isFinite(page) || page < 1) page = 1;

  return { q, status, page };
}

export async function resolveSchoolListPage(
  parsed: ReturnType<typeof parseSchoolListParams>,
): Promise<number> {
  const total = await countSchools(parsed.q, parsed.status);
  const totalPages = Math.max(1, Math.ceil(total / SCHOOLS_PAGE_SIZE));
  if (parsed.page > totalPages) return totalPages;
  return parsed.page;
}
