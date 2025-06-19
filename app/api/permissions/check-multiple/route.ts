/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-06-18 05:49:59
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-06-19 17:07:39
 * @FilePath: /lulab_dashboard/app/api/permissions/check-multiple/route.ts
 * @Description: 
 * 多权限检查 API 路由
 * 用于同时检查用户的多个权限
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { PermissionService } from '@/lib/services/permission.service'
import { z } from 'zod'

// 请求参数验证模式
const checkMultiplePermissionsSchema = z.object({
  permissions: z.array(z.string()).min(1, '权限列表不能为空'),
  mode: z.enum(['AND', 'OR']).default('AND')
})

/**
 * POST /api/permissions/check-multiple
 * 检查用户多个权限
 */
export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }

    // 解析请求体
    let body
    try {
      const text = await request.text()
      if (!text || text.trim() === '') {
        return NextResponse.json(
          { error: '请求体不能为空' },
          { status: 400 }
        )
      }
      body = JSON.parse(text)
    } catch (error) {
      return NextResponse.json(
        { error: '请求体格式错误，必须是有效的JSON' },
        { status: 400 }
      )
    }
    const validatedData = checkMultiplePermissionsSchema.parse(body)

    // 检查权限
    const result = await PermissionService.checkMultiplePermissions(
      session.user.id,
      validatedData.permissions
    )

    return NextResponse.json({
      hasPermission: result.hasPermission,
      results: result.results,
      userId: session.user.id,
      permissions: validatedData.permissions,
      mode: validatedData.mode
    })
  } catch (error) {
    console.error('多权限检查失败:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '请求参数无效', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: '多权限检查失败' },
      { status: 500 }
    )
  }
}