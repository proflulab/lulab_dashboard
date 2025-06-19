/*
 * 用户菜单权限 API 路由
 * 用于获取指定用户的菜单访问权限
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { PermissionService } from '@/lib/services/permission.service'

/**
 * GET /api/permissions/menu/[userId]
 * 获取用户菜单权限
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

    // 检查是否有权限查看其他用户的菜单权限
    // 只有管理员或查看自己的菜单权限才被允许
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

    // 获取用户菜单权限
    const menuPermissions = await PermissionService.getUserMenuPermissions(userId)

    if (!menuPermissions) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      userId,
      menuPermissions
    })
  } catch (error) {
    console.error('获取用户菜单权限失败:', error)
    return NextResponse.json(
      { error: '获取用户菜单权限失败' },
      { status: 500 }
    )
  }
}