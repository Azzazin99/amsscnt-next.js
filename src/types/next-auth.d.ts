import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & AmssSessionUser;
  }

  interface User extends AmssSessionUser {
    id: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends AmssSessionUser {
    sub?: string;
  }
}

export type AmssSessionUser = {
  id: string;
  username: string;
  personId: string;
  loginStatus: number;
  officeCode: string;
  officeName: string;
  loginWorkgroup: number | null;
  userSchoolCode: string | null;
  userSchoolName: string | null;
  userSchoolType: number | null;
  organizationType: "district" | "school";
  isSuperAdmin: boolean;
  isAdmin: boolean;
  moduleAdmins: string[];
  firstTimeLogin: boolean;
  prefix: string | null;
  firstName: string | null;
  lastName: string | null;
};

export type SchoolChoice = {
  schoolCode: string;
  schoolName: string;
};
