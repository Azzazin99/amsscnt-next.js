import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { formatPersonName } from "../src/lib/auth/format-name";
import {
  CHAINAT_DISTRICT_UNIT,
  PERSONNEL_GROUP_ABBREV,
} from "./data/personnel-group-abbrev";
import type { ChainatPersonnelRow } from "./parse-chainat-personnel-xlsx";
import { defaultChainatMasterXlsxPath } from "./parse-chainat-master-xlsx";

export function normalizeUnitName(name: string): string {
  return name.replace(/\s+/g, " ").trim();
}

export function splitThaiFullName(fullName: string): {
  firstName: string;
  lastName: string;
} {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) {
    return { firstName: parts[0] ?? fullName, lastName: "" };
  }
  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  };
}

/** legacy position_code — login_chk.php */
export function positionCodeFromTitle(position: string): number {
  const p = position.trim();
  if (
    p === "ผู้อำนวยการสถานศึกษา" ||
    p === "ผู้อำนวยการสำนักงานเขตพื้นที่การศึกษา"
  ) {
    return 1;
  }
  if (
    p === "รองผู้อำนวยการสถานศึกษา" ||
    p === "รองผู้อำนวยการสำนักงานเขตพื้นที่การศึกษา"
  ) {
    return 2;
  }
  return 0;
}

type MasterSchoolName = { unitName: string; schoolCode: string };

const MASTER_NAMES_PYTHON = `
import json, sys, zipfile, xml.etree.ElementTree as ET
path = sys.argv[1]
ns = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}

def cell_value(c):
    t = c.get('t')
    if t == 'inlineStr':
        is_el = c.find('m:is', ns)
        if is_el is not None:
            return ''.join((t_el.text or '') for t_el in is_el.findall('.//m:t', ns))
    v = c.find('m:v', ns)
    return v.text if v is not None else ''

rows = []
with zipfile.ZipFile(path) as z:
    sheet = ET.fromstring(z.read('xl/worksheets/sheet1.xml'))
    for row in sheet.findall('.//m:sheetData/m:row', ns)[1:]:
        cells = {}
        for c in row.findall('m:c', ns):
            col = ''.join(ch for ch in c.get('r', '') if ch.isalpha())
            cells[col] = cell_value(c)
        code = (cells.get('C') or '').strip()
        name = (cells.get('D') or '').strip()
        if code and name:
            rows.append({'unitName': name, 'schoolCode': code})
print(json.dumps(rows, ensure_ascii=False))
`;

export function buildSchoolCodeByUnitName(): Map<string, string> {
  const xlsxPath = defaultChainatMasterXlsxPath();
  if (!existsSync(xlsxPath)) {
    throw new Error(`ไม่พบไฟล์ Excel โรงเรียน: ${xlsxPath}`);
  }

  const stdout = execFileSync(
    "python3",
    ["-c", MASTER_NAMES_PYTHON, xlsxPath],
    { encoding: "utf-8", maxBuffer: 10 * 1024 * 1024 },
  );

  const masterRows = JSON.parse(stdout) as MasterSchoolName[];
  const map = new Map<string, string>();
  for (const row of masterRows) {
    map.set(normalizeUnitName(row.unitName), row.schoolCode);
  }
  return map;
}

export function resolveSchoolCode(
  unitName: string,
  masterByName: Map<string, string>,
): string | null {
  const normalized = normalizeUnitName(unitName);
  const exact = masterByName.get(normalized);
  if (exact) return exact;

  let best: { code: string; len: number } | null = null;
  for (const [masterName, code] of masterByName) {
    if (masterName.includes(normalized) || normalized.includes(masterName)) {
      const len = masterName.length;
      if (!best || len < best.len) {
        best = { code, len };
      }
    }
  }
  return best?.code ?? null;
}

export function resolveGroupName(abbrev: string): string | null {
  const key = abbrev.trim();
  if (key === "สพป.ชัยนาท") return null;
  return PERSONNEL_GROUP_ABBREV[key] ?? null;
}

export function isDistrictUnit(unitName: string): boolean {
  return normalizeUnitName(unitName) === CHAINAT_DISTRICT_UNIT;
}

export function formatDisplayName(row: ChainatPersonnelRow): string {
  const { firstName, lastName } = splitThaiFullName(row.fullName);
  return formatPersonName({ firstName, lastName, fallback: row.fullName });
}

export function makeSyntheticPersonId(officeCode: string, seq: number): string {
  const prefix = officeCode.padStart(4, "0").slice(0, 4);
  const suffix = String(seq).padStart(9, "0");
  return `${prefix}${suffix}`;
}

export function cleanPhone(phone: string): string {
  return phone.replace(/\D/g, "");
}
