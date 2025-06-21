/*
 * 角色级别检查 API 路由
 * 用于检查用户角色级别是否满足要求
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { PermissionService } from '@/lib/services/permission.service'
import { z } from 'zod'

// 请求参数验证模式
const checkLevelSchema = z.object({
  level: z.number().min(0, '级别必须大于等于0')
})

/**
 * POST /api/permissions/check-level
 * 检查用户角色级别
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
    const result = checkLevelSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: '请求参数无效', details: result.error.errors },
        { status: 400 }
      )
    }

    const { level } = result.data

    // 检查角色级别权限
    const hasLevel = await PermissionService.checkRoleLevel(
      session.user.id,
      level
    )

    return NextResponse.json({
      hasPermission: hasLevel.hasPermission,
      userId: session.user.id,
      requiredLevel: level,
      level: hasLevel.level
    })
  } catch (error) {
    console.error('角色级别检查失败:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '请求参数无效', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: '角色级别检查失败' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/permissions/check-level?level=2
 * 通过查询参数检查用户角色级别
 */
export async function GET(request: NextRequest) {
  try {
    // 验证用户身份
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }

    // 从URL参数获取数据
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const requiredLevel = searchParams.get('level')

    if (!requiredLevel) {
      return NextResponse.json(
        { error: '缺少必需的level参数' },
        { status: 400 }
      )
    }

    const level = parseInt(requiredLevel)
    if (isNaN(level)) {
      return NextResponse.json(
        { error: 'level参数必须是数字' },
        { status: 400 }
      )
    }

    const targetUserId = userId || session.user.id

    // 检查角色级别权限
    const hasLevel = await PermissionService.checkRoleLevel(
      targetUserId,
      level
    )

    return NextResponse.json({
      hasPermission: hasLevel.hasPermission,
      userId: session.user.id,
      requiredLevel: level,
      level: hasLevel.level
    })
  } catch (error) {
    console.error('角色级别检查失败:', error)
    return NextResponse.json(
      { error: '角色级别检查失败' },
      { status: 500 }
    )
  }
}