import "dotenv/config";

import { fetchObecPendingFeed } from "../src/lib/bookobec/obec-url";
import { parseObecPendingXml } from "../src/lib/bookobec/obec-xml-parse";
import { db } from "../src/lib/db";
import { systemSyncCode } from "../src/lib/db/schema";
import { asc } from "drizzle-orm";

async function getSyncRow() {
  const [row] = await db
    .select()
    .from(systemSyncCode)
    .orderBy(asc(systemSyncCode.id))
    .limit(1);
  return row ?? null;
}

async function main() {
  const sample = [
    "<root>",
    `<book_active>${Buffer.from("1").toString("base64")}</book_active>`,
    "<item>",
    `<ms_id>${Buffer.from("test").toString("base64")}</ms_id>`,
    "</item>",
    "</root>",
  ].join("");

  const parsed = parseObecPendingXml(sample);
  if (!parsed.bookActive || parsed.items.length !== 1) {
    throw new Error("XML parse self-check failed");
  }
  console.log("OK: XML parse self-check");

  const syncRow = await getSyncRow();
  if (!syncRow?.officeCode?.trim() || !syncRow?.syncCode?.trim()) {
    console.log(
      "SKIP: sync_code not configured — set via /modules/bookobec/settings or import legacy",
    );
    return;
  }

  const result = await fetchObecPendingFeed({
    officeCode: syncRow.officeCode,
    syncCode: syncRow.syncCode,
    personId: "0000000000000",
  });

  if (!result.ok) {
    console.error("FAIL: OBEC fetch —", result.message);
    process.exit(1);
  }

  console.log(
    `OK: OBEC fetch — book_active=${result.feed.bookActive} items=${result.feed.items.length}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
