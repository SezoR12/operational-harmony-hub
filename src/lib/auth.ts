import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        password: { label: "كلمة المرور", type: "password" },
        role: { label: "الدور", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.password) return null

        const password = credentials.password as string
        const role = (credentials.role as string) || "admin"

        const config = await prisma.appConfig.findFirst()
        if (!config) return null

        if (role === "admin") {
          const valid = await bcrypt.compare(password, config.adminPasswordHash)
          if (!valid) return null
          return { id: "admin", name: "مدير النظام", role: "admin" }
        }

        if (role === "data-entry" && config.dataEntryPasswordHash) {
          const valid = await bcrypt.compare(password, config.dataEntryPasswordHash)
          if (!valid) return null
          return { id: "data-entry", name: "مدخل بيانات", role: "data-entry" }
        }

        return null
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role as string
        session.user.id = token.id as string
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  secret: process.env.NEXTAUTH_SECRET,
})

// Extend session types
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      role: string
    }
  }
}
