import { db } from "../src/lib/db";
import { sql } from "drizzle-orm";
import fs from "fs";
import readline from "readline";

async function main() {
  console.log("Seeding budget_withdraw from AMSS.sql...");

  // 1. Create table if not exists
  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS \`budget_withdraw\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`budget_year\` int(11) DEFAULT NULL,
      \`document\` varchar(30) NOT NULL DEFAULT '',
      \`item\` varchar(100) NOT NULL DEFAULT '',
      \`pj_activity\` varchar(20) NOT NULL DEFAULT '',
      \`money\` double NOT NULL DEFAULT 0,
      \`pay_type\` varchar(10) NOT NULL,
      \`p_request\` varchar(50) NOT NULL,
      \`borrow_status\` tinyint(4) DEFAULT 0,
      \`withdraw_status\` tinyint(4) NOT NULL DEFAULT 0,
      \`deega\` float DEFAULT NULL,
      \`officer\` varchar(13) NOT NULL DEFAULT '',
      \`rec_date\` date NOT NULL,
      \`borrowed_rec_date\` date NOT NULL,
      \`withdraw_rec_date\` date NOT NULL,
      \`status\` tinyint(4) NOT NULL DEFAULT 0,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
  `));

  const fileStream = fs.createReadStream("/Users/akkawatjunthon/Website/amsscnt-next.js/AMSS.sql");
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let currentStmt = "";
  let insideStmt = false;
  let count = 0;

  for await (const line of rl) {
    const trimmed = line.trim();

    if (trimmed.startsWith("INSERT INTO `budget_withdraw`")) {
      insideStmt = true;
      currentStmt = trimmed;
      if (trimmed.endsWith(";")) {
        try {
          await db.execute(sql.raw(currentStmt));
          count++;
        } catch (err: any) {
          // ignore duplicate
        }
        insideStmt = false;
        currentStmt = "";
      }
      continue;
    }

    if (insideStmt) {
      currentStmt += "\n" + trimmed;
      if (trimmed.endsWith(";")) {
        try {
          await db.execute(sql.raw(currentStmt));
          count++;
          if (count % 5 === 0) {
            console.log(`Executed ${count} insert blocks for budget_withdraw...`);
          }
        } catch (err: any) {
          // ignore
        }
        insideStmt = false;
        currentStmt = "";
      }
    }
  }

  console.log(`Finished seeding budget_withdraw! Total insert blocks: ${count}`);
}

main().catch(console.error).finally(() => process.exit());
