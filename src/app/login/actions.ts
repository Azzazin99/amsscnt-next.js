"use server";

import { verifyLogin, type LoginVerifyResult } from "@/lib/auth/verify-login";

export async function checkLogin(input: {
  username: string;
  password: string;
  schoolCode?: string;
}): Promise<LoginVerifyResult> {
  return verifyLogin(input);
}
