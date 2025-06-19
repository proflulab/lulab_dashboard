/*
 * 权限检查 API 路由
 * 用于检查用户是否具有特定权限
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { PermissionService } from '@/lib/services/permission.service'
import { z } from 'zod'

// 请求参数验证模式
const checkPermissionSchema = z.object({
  permission: z.string().min(1, '权限名称不能为空'),
  resource: z.string().optional(),
  action: z.string().optional(),
  resourceId: z.string().optional()
})

/**
 * POST /api/permissions/check
 * 检查用户权限
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
    
    const validatedData = checkPermissionSchema.parse(body)

    // 检查权限
    const result = await PermissionService.checkPermission(
      session.user.id,
      validatedData.permission
    )

    return NextResponse.json({
      hasPermission: result.hasPermission,
      reason: result.reason,
      level: result.level,
      userId: session.user.id,
      permission: validatedData.permission
    })
  } catch (error) {
    console.error('权限检查失败:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '请求参数无效', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: '权限检查失败' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/permissions/check?permission=xxx&resource=xxx&action=xxx
 * 通过查询参数检查用户权限
 */
export async function GET(request: NextRequest) {
  try {
    // 获取用户会话
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }

    // 获取查询参数
    const { searchParams } = new URL(request.url)
    const permission = searchParams.get('permission')

    if (!permission) {
      return NextResponse.json(
        { error: '权限名称不能为空' },
        { status: 400 }
      )
    }

    // 检查权限
    const hasPermission = await PermissionService.checkPermission(
      session.user.id,
      permission
    )

    return NextResponse.json({
      hasPermission,
      userId: session.user.id,
      permission
    })
  } catch (error) {
    console.error('权限检查失败:', error)
    return NextResponse.json(
      { error: '权限检查失败' },
      { status: 500 }
    )
  }
}