import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { JOE_ADMIN_EMAIL } from "@/lib/superadmin";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // Allow linking a Google account to an existing credentials account with
      // the same email. Required for the GA4/GSC "connect" flow where the user
      // is already signed in via email/password.
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/analytics.readonly",
            "https://www.googleapis.com/auth/webmasters.readonly",
          ].join(" "),
        },
      },
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });
        if (!user || !user.password) return null;
        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );
        if (!isValid) return null;
        return { id: user.id, email: user.email, name: user.name, image: user.image };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
      }
      // Re-fetch plan on first sign-in OR when session.update() is called
      // (trigger === "update") — this picks up Stripe-activated plan changes.
      if (user || trigger === "update") {
        const id = (user?.id ?? token.id) as string | undefined;
        if (id) {
          if ((user?.email ?? token.email ?? "").toLowerCase() === JOE_ADMIN_EMAIL) {
            token.plan = "agency";
          } else {
            const dbUser = await prisma.user.findUnique({
              where: { id },
              select: { plan: true },
            });
            token.plan = dbUser?.plan ?? "free";
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
        (session.user as { plan?: string }).plan = (token.plan as string) ?? "free";
      }
      return session;
    },
  },
  pages: { signIn: "/login", error: "/login" },
});
