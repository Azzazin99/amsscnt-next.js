import "dotenv/config";
import fs from "fs";
import readline from "readline";
import path from "path";
import { db } from "../src/lib/db";
import { schools } from "../src/lib/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  const sqlPath = path.join(process.cwd(), "AMSS.sql");
  console.log(`Reading legacy school names from: ${sqlPath}`);

  const fileStream = fs.createReadStream(sqlPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  const codeToNameMap = new Map<string, string>();
  let inSystemSchool = false;

  for await (const line of rl) {
    if (line.includes("INSERT INTO `system_school`")) {
      inSystemSchool = true;
    }

    if (inSystemSchool) {
      // (1, '18010006', 1, 'วัดไผ่โพธิ์ทอง', 1)
      const matches = line.matchAll(/\(\d+,\s*'([^']+)',\s*\d+,\s*'([^']+)'/g);
      for (const match of matches) {
        const schoolCode = match[1].trim();
        const schoolName = match[2].trim();
        codeToNameMap.set(schoolCode, schoolName);
      }

      if (line.endsWith(";")) {
        inSystemSchool = false;
        break;
      }
    }
  }

  console.log(`Extracted ${codeToNameMap.size} school names from AMSS.sql!`);

  const currentSchools = await db.select().from(schools);
  let updatedCount = 0;

  for (const school of currentSchools) {
    const realName = codeToNameMap.get(school.schoolCode);
    if (realName) {
      await db
        .update(schools)
        .set({ name: realName })
        .where(eq(schools.id, school.id));
      updatedCount++;
    }
  }

  console.log(`Updated ${updatedCount} school names in database!`);

  const sample = await db.select().from(schools).limit(10);
  console.log("Updated schools sample:", sample);

  process.exit(0);
}

main().catch(console.error);
