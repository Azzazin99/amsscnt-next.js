import "dotenv/config";
import { db } from "../src/lib/db";
import { countPeople, listPeoplePage, parsePersonListParams } from "../src/lib/person/queries";

async function main() {
  const scope = { kind: "district" as const };

  // Test 1: filter = multi-school
  const params1 = parsePersonListParams({ filter: "multi-school" });
  console.log("params1:", params1);
  const total1 = await countPeople(scope, params1.q, params1.status, params1.org, params1.schoolId, params1.workgroupId, params1.filter);
  const rows1 = await listPeoplePage({ ...params1, scope, page: 1 });
  console.log(`multi-school total: ${total1}, page 1 rows: ${rows1.length}`);

  // Test 2: status = pending
  const params2 = parsePersonListParams({ status: "pending" });
  console.log("params2:", params2);
  const total2 = await countPeople(scope, params2.q, params2.status, params2.org, params2.schoolId, params2.workgroupId, params2.filter);
  const rows2 = await listPeoplePage({ ...params2, scope, page: 1 });
  console.log(`pending total: ${total2}, page 1 rows: ${rows2.length}`);

  // Test 3: default staff page
  const params3 = parsePersonListParams({});
  console.log("params3:", params3);
  const total3 = await countPeople(scope, params3.q, params3.status, params3.org, params3.schoolId, params3.workgroupId, params3.filter);
  const rows3 = await listPeoplePage({ ...params3, scope, page: 1 });
  console.log(`default total: ${total3}, page 1 rows: ${rows3.length}`);

  process.exit(0);
}

main().catch(console.error);
