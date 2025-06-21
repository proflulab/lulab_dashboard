/*
 * 用户批量操作 API 路由
 * 支持批量删除、启用、禁用等操作
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { userService } from '@/lib/services/user.service'
import { PermissionService } from '@/lib/services/permission.service'
import { z } from 'zod'

// 批量操作请求参数验证模式
const batchOperationSchema = z.object({
  userIds: z.array(z.string()).min(1, '至少选择一个用户'),
  operation: z.enum(['delete', 'enable', 'disable', 'restore'], {
    errorMap: () => ({ message: '操作类型必须是 delete、enable、disable 或 restore' })
  })
})

/**
 * POST /api/users/batch
 * 批量操作用户
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

    // 检查权限
    const hasPermission = await PermissionService.checkPermission(
      session.user.id,
      'users.manage'
    )
    if (!hasPermission.hasPermission) {
      return NextResponse.json(
        { error: '权限不足，只有管理员可以批量操作用户' },
        { status: 403 }
      )
    }

    // 解析请求体
    const body = await request.json()
    const { userIds, operation } = batchOperationSchema.parse(body)

    // 防止用户对自己进行某些操作
    if ((operation === 'delete' || operation === 'disable') && userIds.includes(session.user.id)) {
      return NextResponse.json(
        { error: `不能对自己执行${operation === 'delete' ? '删除' : '禁用'}操作` },
        { status: 400 }
      )
    }

    const results = {
      success: [] as string[],
      failed: [] as { userId: string; error: string }[]
    }

    // 执行批量操作
    for (const userId of userIds) {
      try {
        switch (operation) {
          case 'delete':
            await userService.softDelete(userId)
            results.success.push(userId)
            break

          case 'enable':
            await userService.update(userId, { active: true })
            results.success.push(userId)
            break

          case 'disable':
            await userService.update(userId, { active: false })
            results.success.push(userId)
            break

          case 'restore':
            await userService.restore(userId)
            results.success.push(userId)
            break

          default:
            results.failed.push({
              userId,
              error: '不支持的操作类型'
            })
        }
      } catch (error) {
        console.error(`批量操作用户 ${userId} 失败:`, error)
        results.failed.push({
          userId,
          error: error instanceof Error ? error.message : '操作失败'
        })
      }
    }

    // 返回操作结果
    const operationNames = {
      delete: '删除',
      enable: '启用',
      disable: '禁用',
      restore: '恢复'
    }

    return NextResponse.json({
      message: `批量${operationNames[operation]}操作完成`,
      operation,
      results: {
        total: userIds.length,
        success: results.success.length,
        failed: results.failed.length,
        successIds: results.success,
        failedDetails: results.failed
      }
    })
  } catch (error) {
    console.error('批量操作失败:', error)

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

    return NextResponse.json(
      { error: '批量操作失败' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/users/batch
 * 批量更新用户信息
 */
export async function PUT(request: NextRequest) {
  try {
    // 验证用户身份
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }

    // 检查权限
    const hasPermission = await PermissionService.checkPermission(
      session.user.id,
      'users.manage'
    )
    if (!hasPermission.hasPermission) {
      return NextResponse.json(
        { error: '权限不足，只有管理员可以批量更新用户' },
        { status: 403 }
      )
    }

    // 批量更新请求参数验证模式
    const batchUpdateSchema = z.object({
      userIds: z.array(z.string()).min(1, '至少选择一个用户'),
      updates: z.object({
        active: z.boolean().optional(),
        // 可以根据需要添加更多可批量更新的字段
      }).refine(data => Object.keys(data).length > 0, {
        message: '至少提供一个要更新的字段'
      })
    })

    // 解析请求体
    const body = await request.json()
    const { userIds, updates } = batchUpdateSchema.parse(body)

    const results = {
      success: [] as string[],
      failed: [] as { userId: string; error: string }[]
    }

    // 执行批量更新
    for (const userId of userIds) {
      try {
        await userService.update(userId, updates)
        results.success.push(userId)
      } catch (error) {
        console.error(`批量更新用户 ${userId} 失败:`, error)
        results.failed.push({
          userId,
          error: error instanceof Error ? error.message : '更新失败'
        })
      }
    }

    return NextResponse.json({
      message: '批量更新操作完成',
      results: {
        total: userIds.length,
        success: results.success.length,
        failed: results.failed.length,
        successIds: results.success,
        failedDetails: results.failed
      },
      updates
    })
  } catch (error) {
    console.error('批量更新失败:', error)

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

    return NextResponse.json(
      { error: '批量更新失败' },
      { status: 500 }
    )
  }
}