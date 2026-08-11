/**
 * Sanitize legacy SQL dump lines for PostgreSQL import.
 * Mirrors sed rules in scripts/load-legacy-dump.sh (import + export symmetric).
 */
export function sanitizeLegacyDumpSql(input: string): string {
  return input
    .split("\n")
    .filter((line) => !line.includes("session_replication_role"))
    .map((line) =>
      line
        .replace(
          /'0000-\d{2}-\d{2}( \d{2}:\d{2}:\d{2})?'/g,
          "'1970-01-01'",
        )
        .replace(/ ON UPDATE CURRENT_TIMESTAMP/g, "")
        .replace(/ USING BTREE/g, "")
        .replace(/ USING HASH/g, "")
        .replace(/\\'/g, "''")
        .replace(/\\r/g, "")
        .replace(/\\n/g, ""),
    )
    .join("\n");
}
