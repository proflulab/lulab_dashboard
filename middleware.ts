/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-06-15 20:02:32
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-06-19 16:30:22
 * @FilePath: /lulab_dashboard/middleware.ts
 * @Description:
 * Next.js 中间件
 * 集成认证和权限检查
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { permissionMiddleware } from '@/lib/middleware/permission.middleware'

// 配置常量
const PUBLIC_PATHS = {
  AUTH: ['/auth/signin', '/auth/signup', '/auth/error'] as string[],
  PUBLIC: ['/'] as string[] // 如果首页是公开的
}

// 静态文件跳过模式（用于正则匹配）
const SKIP_PATTERNS = [
  /^\/_next/, // Next.js 内部路由
  /^\/api\/auth/, // NextAuth API
  /\.[^/]+$/, // 静态文件（更精确的正则）
  /^\/favicon\.ico$/
]

/**
 * 检查是否应该跳过中间件处理
 */
function shouldSkipMiddleware(pathname: string): boolean {
  return SKIP_PATTERNS.some(pattern => pattern.test(pathname))
}

/**
 * 检查是否为公共路径
 */
function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.AUTH.includes(pathname)
}

/**
 * 中间件主函数
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 跳过静态资源和 API 路由的权限检查
  if (shouldSkipMiddleware(pathname)) {
    return NextResponse.next()
  }

  if (!process.env.NEXTAUTH_SECRET) {
    console.error('NEXTAUTH_SECRET 环境变量未设置')
    return NextResponse.json({ error: '服务器配置错误' }, { status: 500 })
  }

  // 获取用户 token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  })

  // 公开页面，无需认证
  if (isPublicPath(pathname)) {
    // 如果已登录用户访问登录页面，重定向到首页
    if (token && pathname === '/auth/signin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return NextResponse.next()
  }

  // 检查用户是否已认证
  if (!token) {
    const signInUrl = new URL('/auth/signin', request.url)
    signInUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(signInUrl)
  }

  // 执行权限检查
  try {
    const permissionResult = await permissionMiddleware(request)
    // 只有在需要重定向或返回错误时才返回结果
    // NextResponse.next() 表示继续处理，不应该直接返回
    if (permissionResult && permissionResult.status !== 200) {
      return permissionResult
    }
  } catch (error) {
    console.error('权限检查失败:', error)
    // 对于页面路由，权限检查失败时允许继续访问，避免系统完全不可用
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: '权限检查失败' },
        { status: 500 }
      )
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}