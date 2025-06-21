/*
 * 用户状态管理 API 路由
 * 用于用户状态的启用/禁用操作
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { userService } from '@/lib/services/user.service'
import { PermissionService } from '@/lib/services/permission.service'
import { z } from 'zod'

// 状态更新请求参数验证模式
const updateStatusSchema = z.object({
  active: z.boolean()
})

/**
 * PUT /api/users/[userId]/status
 * 更新用户状态（启用/禁用）
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // 验证用户身份
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }

    const { userId } = await params

    // 检查权限
    const hasPermission = await PermissionService.checkPermission(
      session.user.id,
      'users.edit'
    )
    if (!hasPermission.hasPermission) {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      )
    }

    // 防止用户禁用自己
    if (session.user.id === userId) {
      return NextResponse.json(
        { error: '不能修改自己的状态' },
        { status: 400 }
      )
    }

    // 解析请求体
    const body = await request.json()
    const validatedData = updateStatusSchema.parse(body)

    // 更新用户状态
    const updatedUser = await userService.update(userId, {
      active: validatedData.active
    })

    // 返回更新后的用户信息（不包含密码）
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = updatedUser

    return NextResponse.json({
      message: `用户已${validatedData.active ? '启用' : '禁用'}`,
      user: userWithoutPassword
    })
  } catch (error) {
    console.error('更新用户状态失败:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: '请求参数无效',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      )
    }

    if (error instanceof Error && error.message === 'User not found or has been deleted') {
      return NextResponse.json(
        { error: '用户不存在或已被删除' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: '更新用户状态失败' },
      { status: 500 }
    )
  }
}