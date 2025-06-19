/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-06-15 20:02:18
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-06-19 13:35:32
 * @FilePath: /lulab_dashboard/auth.config.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */
import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { PrismaAdapter } from "@auth/prisma-adapter"

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const authConfig = {
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = loginSchema.safeParse(credentials)

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data

          // 从数据库查找用户
          const user = await prisma.user.findUnique({
            where: {
              email,
              deletedAt: null, // 排除软删除的用户
              active: true     // 只查询激活的用户
            },
            include: {
              roles: {
                where: {
                  role: {
                    active: true,
                    isDeleted: false
                  }
                },
                include: {
                  role: true
                }
              }
            }
          })

          if (!user) {
            return null // 用户不存在
          }

          // 验证密码
          if (!user.password) {
            return null // 用户没有设置密码
          }

          const passwordsMatch = await bcrypt.compare(password, user.password)
          if (!passwordsMatch) {
            return null // 密码不匹配
          }

          // 获取用户的主要角色（取第一个角色或默认为USER）
          const primaryRole = user.roles?.[0]?.role?.code || 'USER'

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: primaryRole,
          }
        }

        return null
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user && 'role' in user) {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
      }
      return session
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard')

      if (isOnDashboard) {
        if (isLoggedIn) return true
        return false // 重定向到登录页面
      } else if (isLoggedIn) {
        return Response.redirect(new URL('/dashboard', nextUrl))
      }

      return true
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
} satisfies NextAuthConfig

export default authConfig