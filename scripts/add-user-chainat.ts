import "dotenv/config";
import bcrypt from "bcryptjs";
import { db } from "../src/lib/db";
import { people, users } from "../src/lib/db/schema";
import { eq } from "drizzle-orm";

async function addEkkawat() {
  const personId = "1619900107791";
  const passwordHash = await bcrypt.hash("7791", 10); // หรือ "Imported123"

  // Check if exists in people
  const existingPerson = await db.select().from(people).where(eq(people.personId, personId));
  if (existingPerson.length === 0) {
    await db.insert(people).values({
      personId,
      prefix: "นาย",
      firstName: "เอกวัชร",
      lastName: "จันทร",
      organizationType: "district",
      positionCode: 15,
      status: 0,
    });
    console.log("Added to people table.");
  }

  // Check if exists in users
  const existingUser = await db.select().from(users).where(eq(users.username, personId));
  if (existingUser.length === 0) {
    await db.insert(users).values({
      username: personId,
      personId,
      email: `${personId}@chainat.go.th`,
      passwordHash,
      name: "นายเอกวัชร จันทร",
      organizationType: "district",
      isSuperAdmin: true,
      isAdmin: true,
      status: 1,
    });
    console.log("Added to users table with password 7791.");
  } else {
    // Update password hash to 7791
    await db.update(users).set({ passwordHash }).where(eq(users.username, personId));
    console.log("Updated password to 7791 in users table.");
  }

  process.exit(0);
}

addEkkawat().catch(console.error);
