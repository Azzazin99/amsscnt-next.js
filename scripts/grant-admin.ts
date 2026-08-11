import "dotenv/config";
import { and, eq, like, or } from "drizzle-orm";
import { db } from "../src/lib/db";
import { people, users } from "../src/lib/db/schema";

async function main() {
  const targetNames = [
    { firstName: "เอกวัชร", lastName: "จันทร" },
    { firstName: "หยก", lastName: "มีผิว" }
  ];

  console.log("Searching for target users...");

  for (const target of targetNames) {
    const foundPeople = await db
      .select({ personId: people.personId, firstName: people.firstName, lastName: people.lastName })
      .from(people)
      .where(
        and(
          like(people.firstName, `%${target.firstName}%`),
          like(people.lastName, `%${target.lastName}%`)
        )
      );

    if (foundPeople.length === 0) {
      console.log(`❌ Not found in people table: ${target.firstName} ${target.lastName}`);
      continue;
    }

    const person = foundPeople[0];
    console.log(`✅ Found person: ${person.personId} - ${person.firstName} ${person.lastName}`);

    const foundUsers = await db
      .select({ id: users.id, personId: users.personId, isAdmin: users.isAdmin })
      .from(users)
      .where(eq(users.personId, person.personId));

    if (foundUsers.length === 0) {
      console.log(`❌ No user account found for personId: ${person.personId}`);
      continue;
    }

    const user = foundUsers[0];
    
    // Update user to admin
    await db
      .update(users)
      .set({ isAdmin: true, isSuperAdmin: true, updatedAt: new Date() })
      .where(eq(users.id, user.id));

    console.log(`🎉 Granted admin rights to ${person.firstName} ${person.lastName} (UserID: ${user.id})`);
  }

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
