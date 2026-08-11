import "server-only";

import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export type ObecOfficeLookup = {
  senderName: string;
  officeCode: string;
};

const FALLBACK_SENDER = "สพฐ./อื่นๆ";

export async function resolveObecSenderOffice(
  officeCode: string,
): Promise<ObecOfficeLookup> {
  const code = officeCode.trim();
  if (!code) {
    return { senderName: FALLBACK_SENDER, officeCode: code };
  }

  try {
    const [rows] = (await db.execute(sql`
      SELECT code, code2, precis, name
      FROM system_khet
      WHERE code = ${code}
      LIMIT 1
    `)) as unknown as [{ code: string; code2: string; precis: string | null; name: string }[], unknown];

    const list = Array.isArray(rows) ? rows : [];
    const row = list[0];
    if (row) {
      return {
        senderName: row.precis?.trim() || row.name?.trim() || FALLBACK_SENDER,
        officeCode: row.code2?.trim() || code,
      };
    }
  } catch {
    // ponytail: legacy system_khet may be absent — fallback like PHP
  }

  return { senderName: FALLBACK_SENDER, officeCode: code };
}
