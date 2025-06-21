/*
 * 角色检查 API 路由
 * 用于检查用户是否具有特定角色
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { PermissionService } from '@/lib/services/permission.service'
import { z } from 'zod'

// 请求参数验证模式
const checkRoleSchema = z.object({
  roles: z.array(z.string().min(1, '角色名称不能为空')).min(1, '至少需要提供一个角色').max(10, '角色数量不能超过10个'),
  mode: z.enum(['AND', 'OR']).default('OR')
}).refine(data => {
  // 验证角色名称格式
  const validRolePattern = /^[A-Z_][A-Z0-9_]*$/
  return data.roles.every(role => validRolePattern.test(role))
}, {
  message: '角色名称必须为大写字母、数字和下划线组合，且以字母或下划线开头'
})

// GET请求查询参数验证模式
const checkRoleQuerySchema = z.object({
  roles: z.string().min(1, '角色列表不能为空').transform(val => {
    const roleList = val.split(',').map(role => role.trim()).filter(Boolean)
    if (roleList.length === 0) {
      throw new Error('角色列表不能为空')
    }
    return roleList
  }),
  mode: z.enum(['AND', 'OR']).default('OR')
}).refine(data => {
  const validRolePattern = /^[A-Z_][A-Z0-9_]*$/
  return data.roles.every(role => validRolePattern.test(role))
}, {
  message: '角色名称必须为大写字母、数字和下划线组合，且以字母或下划线开头'
})

/**
 * 创建统一的错误响应
 */
function createErrorResponse(error: string, details?: unknown, status: number = 500) {
  return NextResponse.json(
    {
      success: false,
      error,
      details,
      timestamp: new Date().toISOString()
    },
    { status }
  )
}

/**
 * 创建统一的成功响应
 */
function createSuccessResponse(data: Record<string, unknown>) {
  return NextResponse.json({
    success: true,
    data,
    timestamp: new Date().toISOString()
  })
}

/**
 * 检查用户角色的核心逻辑
 */
async function checkUserRoles(
  userId: string,
  roles: string[],
  mode: 'AND' | 'OR'
): Promise<boolean> {
  const startTime = Date.now()

  try {
    // 检查角色数组是否为空
    if (roles.length === 0) {
      console.log(`角色检查失败: 用户 ${userId} 未提供角色列表`, {
        duration: Date.now() - startTime
      })
      return false
    }

    // 将角色转换为权限代码格式
    const rolePermissionCodes = roles.map(role => `role:${role}`)

    // 使用批量检查优化 - 减少数据库查询次数
    const results = await PermissionService.checkMultiplePermissions(userId, rolePermissionCodes)

    if (mode === 'AND') {
      // 所有角色都必须满足
      const hasAllRoles = Object.entries(results).every(([code, result]) => {
        const hasRole = result.hasPermission
        const role = code.replace('role:', '')

        if (!hasRole) {
          console.log(`角色检查失败: 用户 ${userId} 缺少角色 ${role}`, {
            duration: Date.now() - startTime
          })
        }

        return hasRole
      })

      return hasAllRoles
    } else {
      // 任一角色满足即可
      const hasAnyRole = Object.entries(results).some(([code, result]) => {
        const hasRole = result.hasPermission
        const role = code.replace('role:', '')

        if (hasRole) {
          console.log(`角色检查成功: 用户 ${userId} 具有角色 ${role}`, {
            duration: Date.now() - startTime
          })
        }

        return hasRole
      })

      if (!hasAnyRole) {
        console.log(`角色检查失败: 用户 ${userId} 不具备任何所需角色`, {
          duration: Date.now() - startTime
        })
      }

      return hasAnyRole
    }
  } catch (error) {
    console.error(`角色检查异常: 用户 ${userId}`, {
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime
    })
    throw error
  }
}

/**
 * POST /api/permissions/check-role
 * 检查用户角色
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  let body: unknown = null

  try {
    // 验证用户身份
    const session = await auth()
    if (!session?.user?.id) {
      return createErrorResponse('未授权访问', null, 401)
    }

    // 记录请求日志
    console.log('权限检查请求:', {
      method: 'POST',
      url: request.url,
      userId: session.user.id,
      timestamp: new Date().toISOString()
    })

    // 解析请求体
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
    const validatedData = checkRoleSchema.parse(body)

    // 检查角色
    const hasRole = await checkUserRoles(
      session.user.id,
      validatedData.roles,
      validatedData.mode
    )

    // 记录成功结果
    console.log('权限检查结果:', {
      userId: session.user.id,
      roles: validatedData.roles,
      mode: validatedData.mode,
      hasPermission: hasRole,
      duration: Date.now() - startTime
    })

    return createSuccessResponse({
      hasPermission: hasRole,
      userId: session.user.id,
      roles: validatedData.roles,
      mode: validatedData.mode
    })
  } catch (error) {
    console.error('角色检查失败:', {
      url: request.url,
      body: body,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime
    })

    if (error instanceof z.ZodError) {
      return createErrorResponse(
        '请求参数无效',
        error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
          ...(err.code === 'invalid_type' && 'received' in err ? { received: err.received, expected: err.expected } : {})
        })),
        400
      )
    }

    return createErrorResponse('角色检查失败', null, 500)
  }
}

/**
 * GET /api/permissions/check-role?roles=ADMIN,MANAGER&mode=OR
 * 通过查询参数检查用户角色
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  let queryParams: Record<string, string | null> = {}

  try {
    // 验证用户身份
    const session = await auth()
    if (!session?.user?.id) {
      return createErrorResponse('未授权访问', null, 401)
    }

    // 记录请求日志
    console.log('权限检查请求:', {
      method: 'GET',
      url: request.url,
      userId: session.user.id,
      timestamp: new Date().toISOString()
    })

    // 获取并验证查询参数
    const { searchParams } = new URL(request.url)
    const rolesParam = searchParams.get('roles')
    const modeParam = searchParams.get('mode')

    queryParams = { roles: rolesParam, mode: modeParam }
    const validatedData = checkRoleQuerySchema.parse(queryParams)

    // 检查角色
    const hasRole = await checkUserRoles(
      session.user.id,
      validatedData.roles,
      validatedData.mode
    )

    // 记录成功结果
    console.log('权限检查结果:', {
      userId: session.user.id,
      roles: validatedData.roles,
      mode: validatedData.mode,
      hasPermission: hasRole,
      duration: Date.now() - startTime
    })

    return createSuccessResponse({
      hasPermission: hasRole,
      userId: session.user.id,
      roles: validatedData.roles,
      mode: validatedData.mode
    })
  } catch (error) {
    console.error('角色检查失败:', {
      url: request.url,
      queryParams: queryParams,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime
    })

    if (error instanceof z.ZodError) {
      return createErrorResponse(
        '请求参数无效',
        error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
          ...(err.code === 'invalid_type' && 'received' in err ? { received: err.received, expected: err.expected } : {})
        })),
        400
      )
    }

    return createErrorResponse('角色检查失败', null, 500)
  }
}