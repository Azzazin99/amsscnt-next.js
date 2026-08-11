import { db } from "../src/lib/db";
import { sql } from "drizzle-orm";
import fs from "fs";
import readline from "readline";

async function main() {
  console.log("Seeding budget_project & budget_key_activity from AMSS.sql...");

  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS \`budget_project\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`budget_year\` int(11) NOT NULL,
      \`code\` varchar(20) NOT NULL DEFAULT '',
      \`name\` varchar(80) NOT NULL,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
  `));

  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS \`budget_key_activity\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`budget_year\` int(11) NOT NULL,
      \`code\` varchar(20) NOT NULL DEFAULT '',
      \`name\` varchar(100) NOT NULL DEFAULT '',
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
  `));

  const fileStream = fs.createReadStream("/Users/akkawatjunthon/Website/amsscnt-next.js/AMSS.sql");
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let currentStmt = "";
  let targetTable = "";

  for await (const line of rl) {
    const trimmed = line.trim();

    if (trimmed.startsWith("INSERT INTO `budget_project`") || trimmed.startsWith("INSERT INTO `budget_key_activity`")) {
      targetTable = trimmed.includes("budget_project") ? "budget_project" : "budget_key_activity";
      currentStmt = trimmed;
      if (trimmed.endsWith(";")) {
        try {
          await db.execute(sql.raw(currentStmt));
        } catch {}
        currentStmt = "";
      }
      continue;
    }

    if (currentStmt) {
      currentStmt += "\n" + trimmed;
      if (trimmed.endsWith(";")) {
        try {
          await db.execute(sql.raw(currentStmt));
        } catch {}
        currentStmt = "";
      }
    }
  }

  console.log("Finished seeding budget_project and budget_key_activity!");
}

main().catch(console.error).finally(() => process.exit());
