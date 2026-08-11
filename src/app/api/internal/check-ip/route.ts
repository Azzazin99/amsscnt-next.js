import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { allowedIps } from "@/lib/db/schema";
import { eq, and, count } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const clientIp = searchParams.get("ip")?.trim();

  // If no IP supplied, deny access
  if (!clientIp) {
    return NextResponse.json({ allowed: false, reason: "No IP provided" }, { status: 400 });
  }

  // Allow localhost / loopback during local development
  if (clientIp === "127.0.0.1" || clientIp === "::1" || clientIp.includes("127.0.0.1") || clientIp === "localhost") {
    return NextResponse.json({ allowed: true, reason: "Localhost bypass" });
  }

  try {
    // Check total enabled IPs in DB
    const [totalCountResult] = await db
      .select({ count: count() })
      .from(allowedIps)
      .where(eq(allowedIps.isEnabled, true));

    const totalEnabled = totalCountResult?.count ?? 0;

    // If no enabled IPs are configured in database, allow all (fail-safe to prevent lockouts)
    if (totalEnabled === 0) {
      return NextResponse.json({ allowed: true, reason: "No restriction configured" });
    }

    // Check if clientIp exists in enabled IPs
    const existing = await db
      .select()
      .from(allowedIps)
      .where(and(eq(allowedIps.ipAddress, clientIp), eq(allowedIps.isEnabled, true)))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ allowed: true });
    }

    return NextResponse.json({ allowed: false, reason: "IP not whitelisted" });
  } catch (error) {
    console.error("Error checking IP restriction:", error);
    // On DB error, allow access so site isn't broken completely
    return NextResponse.json({ allowed: true, error: "DB query failed" });
  }
}
