import { db } from "../src/lib/db";
import { users, people } from "../src/lib/db/schema";

async function checkTotal() {
  const allUsers = await db.select().from(users);
  const allPeople = await db.select().from(people);
  console.log("Total users in DB:", allUsers.length);
  console.log("Usernames:", allUsers.map(u => u.username));
  console.log("Total people in DB:", allPeople.length);
  process.exit(0);
}

checkTotal();
