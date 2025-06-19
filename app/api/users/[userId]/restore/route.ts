/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-06-18 22:30:46
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-06-18 23:12:52
 * @FilePath: /lulab_dashboard/app/api/users/[userId]/restore/route.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */
/*
 * 用户恢复 API 路由
 * 用于恢复被软删除的用户
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { userService } from '@/lib/services/user.service'
import { PermissionService } from '@/lib/services/permission.service'

/**
 * POST /api/users/[userId]/restore
 * 恢复被软删除的用户
 */
export async function POST(
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
      'users.manage'
    )
    if (!hasPermission.hasPermission) {
      return NextResponse.json(
        { error: '权限不足，只有管理员可以恢复用户' },
        { status: 403 }
      )
    }

    // 恢复用户
    const restoredUser = await userService.restore(userId)

    // 返回恢复后的用户信息（不包含密码）
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = restoredUser

    return NextResponse.json({
      message: '用户恢复成功',
      user: userWithoutPassword
    })
  } catch (error) {
    console.error('恢复用户失败:', error)

    return NextResponse.json(
      { error: '恢复用户失败' },
      { status: 500 }
    )
  }
}