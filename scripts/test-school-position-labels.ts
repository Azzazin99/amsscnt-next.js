import "dotenv/config";
import { listPeoplePage } from "../src/lib/person/queries";

async function main() {
  const districtRows = await listPeoplePage({
    scope: { kind: "district", orgId: 1, workgroupId: null, schoolId: null },
    q: "",
    status: "active",
    org: "district",
    schoolId: null,
    workgroupId: null,
    page: 1,
  });

  const schoolRows = await listPeoplePage({
    scope: { kind: "district", orgId: 1, workgroupId: null, schoolId: null },
    q: "",
    status: "active",
    org: "school",
    schoolId: null,
    workgroupId: null,
    page: 1,
  });

  console.log("--- District Personnel Sample ---");
  districtRows.slice(0, 5).forEach((r, i) => {
    console.log(`${i + 1}. [${r.personId}] ${r.displayName} -> ${r.positionLabel}`);
  });

  console.log("\n--- School Personnel Sample ---");
  schoolRows.slice(0, 10).forEach((r, i) => {
    console.log(`${i + 1}. [${r.personId}] ${r.displayName} (${r.schoolName}) -> ${r.positionLabel}`);
  });

  process.exit(0);
}

main().catch(console.error);
