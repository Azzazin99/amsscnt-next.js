import { formatPersonName } from "@/lib/auth/format-name";

/** Matches legacy leave import stub in `scripts/import/backfill-leave-people.ts`. */
export const LEGACY_LEAVE_STUB_FIRST_NAME = "ประวัติลา";

export function isLegacyLeaveStubPerson(firstName?: string | null): boolean {
  return String(firstName ?? "").trim() === LEGACY_LEAVE_STUB_FIRST_NAME;
}

export function resolveLeavePersonDisplayName(parts: {
  prefix?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  userName?: string | null;
  personId: string;
}): string {
  const fromPeople = formatPersonName({
    prefix: parts.prefix,
    firstName: parts.firstName,
    lastName: parts.lastName,
  });
  const userName = String(parts.userName ?? "").trim();

  if (fromPeople && !isLegacyLeaveStubPerson(parts.firstName)) {
    return fromPeople;
  }
  if (userName) return userName;
  if (fromPeople) return fromPeople;
  return parts.personId;
}
