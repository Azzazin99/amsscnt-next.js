import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { verifyLogin } from "@/lib/auth/verify-login";
import { formatPersonName } from "@/lib/auth/format-name";
import type { AmssSessionUser } from "@/types/next-auth";

const DEFAULT_SESSION_MAX_AGE = 4 * 60 * 60;
const DEFAULT_SESSION_UPDATE_AGE = 30 * 60;

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

const SESSION_MAX_AGE = parsePositiveInt(
  process.env.SESSION_MAX_AGE_SECONDS,
  DEFAULT_SESSION_MAX_AGE,
);
const SESSION_UPDATE_AGE = parsePositiveInt(
  process.env.SESSION_UPDATE_AGE_SECONDS,
  DEFAULT_SESSION_UPDATE_AGE,
);

function profileToUser(profile: AmssSessionUser) {
  return {
    ...profile,
    name: formatPersonName({
      prefix: profile.prefix,
      firstName: profile.firstName,
      lastName: profile.lastName,
      fallback: profile.username,
    }),
    email: `${profile.username}@session.local`,
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
        schoolCode: { label: "School code", type: "text" },
      },
      authorize: async (credentials) => {
        const username = String(credentials?.username ?? "").trim();
        const password = String(credentials?.password ?? "");
        const schoolCode = credentials?.schoolCode
          ? String(credentials.schoolCode).trim()
          : undefined;

        const result = await verifyLogin({ username, password, schoolCode });
        if (!result.ok) return null;
        return profileToUser(result.profile);
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE,
    updateAge: SESSION_UPDATE_AGE,
  },
  jwt: {
    maxAge: SESSION_MAX_AGE,
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        const u = user as AmssSessionUser & { name?: string; email?: string };
        token.id = u.id;
        token.username = u.username;
        token.personId = u.personId;
        token.loginStatus = u.loginStatus;
        token.officeCode = u.officeCode;
        token.officeName = u.officeName;
        token.loginWorkgroup = u.loginWorkgroup;
        token.userSchoolCode = u.userSchoolCode;
        token.userSchoolName = u.userSchoolName;
        token.userSchoolType = u.userSchoolType;
        token.organizationType = u.organizationType;
        token.isSuperAdmin = u.isSuperAdmin;
        token.isAdmin = u.isAdmin;
        token.moduleAdmins = u.moduleAdmins;
        token.firstTimeLogin = u.firstTimeLogin;
        token.prefix = u.prefix;
        token.firstName = u.firstName;
        token.lastName = u.lastName;
      }
      return token;
    },
    session({ session, token }) {
      session.user = {
        ...session.user,
        id: String(token.id ?? token.sub),
        username: String(token.username ?? ""),
        personId: String(token.personId ?? ""),
        loginStatus: Number(token.loginStatus ?? 0),
        officeCode: String(token.officeCode ?? ""),
        officeName: String(token.officeName ?? ""),
        loginWorkgroup:
          token.loginWorkgroup === null || token.loginWorkgroup === undefined
            ? null
            : Number(token.loginWorkgroup),
        userSchoolCode: token.userSchoolCode
          ? String(token.userSchoolCode)
          : null,
        userSchoolName: token.userSchoolName
          ? String(token.userSchoolName)
          : null,
        userSchoolType:
          token.userSchoolType === null || token.userSchoolType === undefined
            ? null
            : Number(token.userSchoolType),
        organizationType:
          token.organizationType === "school" ? "school" : "district",
        isSuperAdmin: Boolean(token.isSuperAdmin),
        isAdmin: Boolean(token.isAdmin),
        moduleAdmins: (token.moduleAdmins as string[]) ?? [],
        firstTimeLogin: Boolean(token.firstTimeLogin),
        prefix: token.prefix ? String(token.prefix) : null,
        firstName: token.firstName ? String(token.firstName) : null,
        lastName: token.lastName ? String(token.lastName) : null,
      };
      return session;
    },
  },
  trustHost: true,
});
