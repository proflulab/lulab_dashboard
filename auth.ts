/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-06-15 20:02:25
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-06-16 05:54:41
 * @FilePath: /lulab_dashboard/auth.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */
import NextAuth from "next-auth"
import authConfig from "./auth.config"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  trustHost: true,
})

export { auth as middleware } from "./auth"