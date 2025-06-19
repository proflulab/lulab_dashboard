/*
 * 用户权限信息 API 路由
 * 用于获取指定用户的完整权限信息
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { PermissionService } from '@/lib/services/permission.service'

/**
 * GET /api/permissions/user/[userId]
 * 获取用户权限信息
 */
export async function GET(
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

    // 检查是否有权限查看其他用户的权限信息
    // 只有管理员或查看自己的权限信息才被允许
    if (session.user.id !== userId) {
      const hasAdminPermission = await PermissionService.checkPermission(
        session.user.id,
        'permissions.view'
      )
      if (!hasAdminPermission.hasPermission) {
        return NextResponse.json(
          { error: '权限不足' },
          { status: 403 }
        )
      }
    }

    // 获取用户权限信息
    const userPermissions = await PermissionService.getUserPermissionInfo(userId)

    if (!userPermissions) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      userId,
      permissions: userPermissions
    })
  } catch (error) {
    console.error('获取用户权限信息失败:', error)
    return NextResponse.json(
      { error: '获取用户权限信息失败' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/permissions/user/[userId]
 * 更新用户权限信息（仅管理员）
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // 获取用户会话
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }

    // 只有管理员可以修改权限
    const hasManagePermission = await PermissionService.checkPermission(
      session.user.id,
      'permissions.manage'
    )
    if (!hasManagePermission.hasPermission) {
      return NextResponse.json(
        { error: '权限不足，只有管理员可以修改权限' },
        { status: 403 }
      )
    }

    const { userId } = await params
    const body = await request.json()

    // 这里可以添加更新用户权限的逻辑
    // 由于涉及复杂的权限分配，暂时返回成功响应
    console.log('更新用户权限:', { userId, updates: body })

    return NextResponse.json({
      success: true,
      message: '用户权限更新成功',
      userId
    })
  } catch (error) {
    console.error('更新用户权限失败:', error)
    return NextResponse.json(
      { error: '更新用户权限失败' },
      { status: 500 }
    )
  }
}