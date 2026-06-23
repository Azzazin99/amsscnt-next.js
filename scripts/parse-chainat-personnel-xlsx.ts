import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

export type ChainatPersonnelRow = {
  unitName: string;
  fullName: string;
  position: string;
  groupAbbrev: string;
  folderNo: string;
  phone: string;
};

const PYTHON_PARSER = `
import json, sys, zipfile, xml.etree.ElementTree as ET
path = sys.argv[1]
ns = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}

def cell_value(c, shared):
    t = c.get('t')
    if t == 'inlineStr':
        is_el = c.find('m:is', ns)
        if is_el is not None:
            return ''.join((t_el.text or '') for t_el in is_el.findall('.//m:t', ns))
    if t == 's':
        v = c.find('m:v', ns)
        return shared[int(v.text)] if v is not None and v.text else ''
    v = c.find('m:v', ns)
    return v.text if v is not None else ''

rows = []
with zipfile.ZipFile(path) as z:
    shared = []
    if 'xl/sharedStrings.xml' in z.namelist():
        root = ET.fromstring(z.read('xl/sharedStrings.xml'))
        shared = [''.join(t.text or '' for t in si.findall('.//m:t', ns)) for si in root.findall('m:si', ns)]
    sheet = ET.fromstring(z.read('xl/worksheets/sheet1.xml'))
    for row in sheet.findall('.//m:sheetData/m:row', ns)[1:]:
        cells = {}
        for c in row.findall('m:c', ns):
            ref = c.get('r', '')
            col = ''.join(ch for ch in ref if ch.isalpha())
            cells[col] = cell_value(c, shared)
        unit = (cells.get('A') or '').strip()
        name = (cells.get('B') or '').strip()
        if not unit or not name:
            continue
        rows.append({
            'unitName': unit,
            'fullName': name,
            'position': (cells.get('C') or '').strip(),
            'groupAbbrev': (cells.get('D') or '').strip(),
            'folderNo': (cells.get('E') or '').strip(),
            'phone': (cells.get('F') or '').strip(),
        })
print(json.dumps(rows, ensure_ascii=False))
`;

export function defaultChainatPersonnelXlsxPath(): string {
  return resolve(
    process.cwd(),
    process.env.CHAINAT_PERSONNEL_XLSX ??
      "ข้อมูลครูและบุคลากรทางการศึกษาใน สพป.ชัยนาท.xlsx",
  );
}

export function parseChainatPersonnelXlsx(
  xlsxPath = defaultChainatPersonnelXlsxPath(),
): ChainatPersonnelRow[] {
  if (!existsSync(xlsxPath)) {
    throw new Error(`ไม่พบไฟล์ Excel: ${xlsxPath}`);
  }

  const stdout = execFileSync("python3", ["-c", PYTHON_PARSER, xlsxPath], {
    encoding: "utf-8",
    maxBuffer: 20 * 1024 * 1024,
  });

  const parsed = JSON.parse(stdout) as ChainatPersonnelRow[];
  if (parsed.length === 0) {
    throw new Error("ไม่พบข้อมูลบุคลากรใน Excel");
  }

  return parsed;
}
