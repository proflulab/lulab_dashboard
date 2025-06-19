/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-06-15 20:39:25
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-06-15 20:39:27
 * @FilePath: /lulab_dashboard/types/next-auth.d.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */
import { DefaultSession, DefaultUser } from "next-auth"
import { JWT, DefaultJWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    role: string
    roles?: Array<{
      role: {
        code: string
        name: string
      }
    }>
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    role: string
  }
}

export {}