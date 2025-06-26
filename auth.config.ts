/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-06-15 20:02:18
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-06-27 03:18:56
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
import { userService } from '@/lib/services/user.service'

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
          const user = await userService.getForAuthentication(email)

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
            name: user.profile?.name,
            email: user.email,
            role: primaryRole,
          }
        }

        return null
      },
    }),
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const { pathname } = nextUrl
      // 定义公开路径
      const publicPaths = [
        '/auth/signin',
        '/auth/signup',
        '/auth/error',
        '/'
      ]

      // 检查是否为公开路径
      const isPublicPath = publicPaths.includes(pathname)

      // 如果是公开路径
      if (isPublicPath) {
        // 如果已登录用户访问登录页面，重定向到仪表盘
        if (isLoggedIn && pathname === '/auth/signin') {
          return Response.redirect(new URL('/dashboard', nextUrl))
        }
        return true
      }

      // 非公开路径需要登录
      return isLoggedIn
    },
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
  },
  pages: {
    signIn: '/auth/signin',
  },
} satisfies NextAuthConfig

export default authConfig