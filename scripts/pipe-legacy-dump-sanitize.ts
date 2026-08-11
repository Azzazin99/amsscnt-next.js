#!/usr/bin/env npx tsx
/**
 * Stdin → sanitize → stdout. Used by load-legacy-dump.sh.
 */
import { sanitizeLegacyDumpSql } from "../src/lib/dev/legacy-dump-sanitize";

const chunks: Buffer[] = [];
process.stdin.on("data", (chunk: Buffer) => chunks.push(chunk));
process.stdin.on("end", () => {
  const raw = Buffer.concat(chunks).toString("utf8");
  process.stdout.write(sanitizeLegacyDumpSql(raw));
});
