import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

export type ChainatSchoolRow = {
  schoolCode: string;
  name: string;
  district: string;
  province: string;
};

const PYTHON_PARSER = `
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
            ref = c.get('r', '')
            col = ''.join(ch for ch in ref if ch.isalpha())
            cells[col] = cell_value(c)
        code = (cells.get('A') or '').strip()
        name = (cells.get('B') or '').strip()
        if not code or not name:
            continue
        rows.append({
            'schoolCode': code,
            'name': name,
            'district': (cells.get('D') or '').strip(),
            'province': (cells.get('E') or '').strip(),
        })
print(json.dumps(rows, ensure_ascii=False))
`;

export function defaultChainatSchoolsXlsxPath(): string {
  return resolve(
    process.cwd(),
    process.env.CHAINAT_SCHOOLS_XLSX ?? "โรงเรียนในสังกัด สพป.ชัยนาท.xlsx",
  );
}

export function parseChainatSchoolsXlsx(
  xlsxPath = defaultChainatSchoolsXlsxPath(),
): ChainatSchoolRow[] {
  if (!existsSync(xlsxPath)) {
    throw new Error(`ไม่พบไฟล์ Excel: ${xlsxPath}`);
  }

  const stdout = execFileSync("python3", ["-c", PYTHON_PARSER, xlsxPath], {
    encoding: "utf-8",
    maxBuffer: 10 * 1024 * 1024,
  });

  const parsed = JSON.parse(stdout) as ChainatSchoolRow[];
  if (parsed.length === 0) {
    throw new Error("ไม่พบข้อมูลโรงเรียนใน Excel");
  }

  return parsed;
}
