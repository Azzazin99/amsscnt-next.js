import "dotenv/config";
import { db } from "../src/lib/db";
import { personDelegate, people, schools } from "../src/lib/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  const rows = await db
    .select({
      id: personDelegate.id,
      schoolCode: personDelegate.schoolCode,
      schoolName: schools.name,
      personId: personDelegate.personId,
      firstName: people.firstName,
      lastName: people.lastName,
      start: personDelegate.start,
      finish: personDelegate.finish,
      remark: personDelegate.remark,
    })
    .from(personDelegate)
    .leftJoin(schools, eq(personDelegate.schoolCode, schools.schoolCode))
    .leftJoin(people, eq(personDelegate.personId, people.personId));

  console.log(`Found ${rows.length} acting director records in person_delegate:`);
  console.log(rows);
  process.exit(0);
}

main().catch(console.error);
