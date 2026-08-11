import { db } from "../src/lib/db";
import { users, people } from "../src/lib/db/schema";
import { eq } from "drizzle-orm";

async function checkDb() {
  try {
    const userRows = await db.select().from(users).where(eq(users.username, "1619900107791"));
    const personRows = await db.select().from(people).where(eq(people.personId, "1619900107791"));
    const totalUsers = await db.select().from(users).limit(5);
    const totalPeople = await db.select().from(people).limit(5);

    console.log("User 1619900107791 in users table:", userRows);
    console.log("Person 1619900107791 in people table:", personRows);
    console.log("Total users count sample:", totalUsers.length);
    console.log("Total people count sample:", totalPeople.length);
  } catch (err) {
    console.error("DB Check error:", err);
  }
  process.exit(0);
}

checkDb();
