import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

export type ChainatMasterGroup = {
  name: string;
  sortOrder: number;
};

export type ChainatMasterAssignment = {
  schoolCode: string;
  groupName: string;
};

export type ChainatMasterData = {
  groups: ChainatMasterGroup[];
  assignments: ChainatMasterAssignment[];
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

group_names = {}
assignments = []
with zipfile.ZipFile(path) as z:
    sheet = ET.fromstring(z.read('xl/worksheets/sheet1.xml'))
    for row in sheet.findall('.//m:sheetData/m:row', ns)[1:]:
        cells = {}
        for c in row.findall('m:c', ns):
            ref = c.get('r', '')
            col = ''.join(ch for ch in ref if ch.isalpha())
            cells[col] = cell_value(c)
        code = (cells.get('C') or '').strip()
        grp = (cells.get('H') or '').strip()
        if not code or not grp:
            continue
        group_names[grp] = group_names.get(grp, 0) + 1
        assignments.append({'schoolCode': code, 'groupName': grp})

sorted_names = sorted(group_names.keys(), key=lambda s: s.casefold())
groups = [{'name': name, 'sortOrder': (i + 1) * 10} for i, name in enumerate(sorted_names)]
print(json.dumps({'groups': groups, 'assignments': assignments}, ensure_ascii=False))
`;

export function defaultChainatMasterXlsxPath(): string {
  return resolve(
    process.cwd(),
    process.env.CHAINAT_MASTER_XLSX ?? "_สพป.ชัยนาท.xlsx",
  );
}

export function parseChainatMasterXlsx(
  xlsxPath = defaultChainatMasterXlsxPath(),
): ChainatMasterData {
  if (!existsSync(xlsxPath)) {
    throw new Error(`ไม่พบไฟล์ Excel: ${xlsxPath}`);
  }

  const stdout = execFileSync("python3", ["-c", PYTHON_PARSER, xlsxPath], {
    encoding: "utf-8",
    maxBuffer: 10 * 1024 * 1024,
  });

  const parsed = JSON.parse(stdout) as ChainatMasterData;
  if (parsed.groups.length === 0) {
    throw new Error("ไม่พบกลุ่มสถานศึกษาใน Excel");
  }

  return parsed;
}
