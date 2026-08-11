import { z } from "zod";
import {
  PHONE_DIGITS_ONLY_MESSAGE,
  THAI_MOBILE_PHONE_INCOMPLETE_MESSAGE,
} from "@/lib/form/validation-messages";
import { formEntryString } from "@/lib/form/zod-client";

const THAI_MOBILE_PHONE_PATTERN = /^0[689]\d{8}$/;

export function normalizeThaiMobilePhone(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("66") && digits.length === 11) {
    digits = `0${digits.slice(2)}`;
  }
  return digits;
}

export function isValidThaiMobilePhone(digits: string): boolean {
  return THAI_MOBILE_PHONE_PATTERN.test(digits);
}

/** Normalize while typing — rejects letters only; incomplete digits are allowed. */
export function normalizeThaiMobilePhoneInput(
  raw: string,
):
  | { ok: true; normalized: string }
  | { ok: false; message: string; normalized: string } {
  const normalized = normalizeThaiMobilePhone(raw).slice(0, 10);

  if (/[a-zA-Z\u0E00-\u0E7F]/.test(raw)) {
    return {
      ok: false,
      message: PHONE_DIGITS_ONLY_MESSAGE,
      normalized,
    };
  }

  return { ok: true, normalized };
}

/** Full validation — use on submit or when a complete value is required. */
export function validateThaiMobilePhoneInput(
  raw: string,
):
  | { ok: true; normalized: string }
  | { ok: false; message: string; normalized: string } {
  const normalized = normalizeThaiMobilePhone(raw).slice(0, 10);

  if (/[a-zA-Z\u0E00-\u0E7F]/.test(raw)) {
    return {
      ok: false,
      message: PHONE_DIGITS_ONLY_MESSAGE,
      normalized,
    };
  }

  if (normalized.length === 0 || isValidThaiMobilePhone(normalized)) {
    return { ok: true, normalized };
  }

  return {
    ok: false,
    message: THAI_MOBILE_PHONE_INCOMPLETE_MESSAGE,
    normalized,
  };
}

/** Optional Thai mobile phone field — empty becomes null, non-empty must be 10-digit 06/08/09. */
export function optionalThaiMobilePhoneField() {
  return formEntryString(
    z
      .string()
      .trim()
      .max(20)
      .transform((v) => normalizeThaiMobilePhone(v))
      .refine((v) => v.length === 0 || isValidThaiMobilePhone(v), {
        message: THAI_MOBILE_PHONE_INCOMPLETE_MESSAGE,
      })
      .transform((v) => (v.length > 0 ? v : null)),
  );
}
