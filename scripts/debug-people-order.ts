import "dotenv/config";
import { listPeoplePage } from "../src/lib/person/queries";

async function main() {
  const rows = await listPeoplePage({
    scope: { kind: "district", orgId: 1, workgroupId: null, schoolId: null },
    q: "",
    status: "active",
    org: "district",
    schoolId: null,
    workgroupId: null,
    page: 1,
  });

  console.log("Top 10 legacy sorted rows:");
  rows.slice(0, 10).forEach((r, i) => {
    console.log(`${i + 1}. [${r.personId}] ${r.displayName} - ${r.positionLabel} (${r.workgroupName ?? 'ไม่มีกลุ่ม'})`);
  });
  process.exit(0);
}

main().catch(console.error);
