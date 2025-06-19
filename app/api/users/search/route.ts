/*
 * 用户搜索 API 路由
 * 提供高级用户搜索功能
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { userService } from '@/lib/services/user.service'
import { PermissionService } from '@/lib/services/permission.service'
import { z } from 'zod'

// 类型定义
interface UserRole {
  role: {
    id: string
    name: string
  }
}

interface UserOrganization {
  organization: {
    id: string
    name: string
  }
}

interface UserDepartment {
  department: {
    id: string
    name: string
  }
}



// 搜索请求参数验证模式
const searchSchema = z.object({
  query: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  active: z.boolean().optional(),
  roleId: z.string().optional(),
  organizationId: z.string().optional(),
  departmentId: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z.enum(['name', 'email', 'createdAt', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
})

/**
 * POST /api/users/search
 * 高级用户搜索
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
      'users.view'
    )
    if (!hasPermission.hasPermission) {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      )
    }

    // 解析请求体
    const body = await request.json()
    const validatedData = searchSchema.parse(body)

    // 获取所有用户
    const allUsers = await userService.getAll()

    // 应用搜索过滤器
    let filteredUsers = allUsers

    // 通用查询过滤
    if (validatedData.query) {
      const query = validatedData.query.toLowerCase()
      filteredUsers = filteredUsers.filter(user =>
        user.name?.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.phone?.includes(query)
      )
    }

    // 邮箱过滤
    if (validatedData.email) {
      filteredUsers = filteredUsers.filter(user =>
        user.email.toLowerCase().includes(validatedData.email!.toLowerCase())
      )
    }

    // 手机号过滤
    if (validatedData.phone) {
      filteredUsers = filteredUsers.filter(user =>
        user.phone?.includes(validatedData.phone!)
      )
    }

    // 状态过滤
    if (validatedData.active !== undefined) {
      filteredUsers = filteredUsers.filter(user =>
        user.active === validatedData.active
      )
    }

    // 角色过滤
    if (validatedData.roleId) {
      filteredUsers = filteredUsers.filter(user =>
        user.roles?.some((userRole: UserRole) => userRole.role.id === validatedData.roleId)
      )
    }

    // 组织过滤
    if (validatedData.organizationId) {
      filteredUsers = filteredUsers.filter(user =>
        user.organizations?.some((userOrg: UserOrganization) => userOrg.organization.id === validatedData.organizationId)
      )
    }

    // 部门过滤
    if (validatedData.departmentId) {
      filteredUsers = filteredUsers.filter(user =>
        user.departments?.some((userDept: UserDepartment) => userDept.department.id === validatedData.departmentId)
      )
    }

    // 排序
    filteredUsers.sort((a, b) => {
      let aValue: string | Date
      let bValue: string | Date

      switch (validatedData.sortBy) {
        case 'name':
          aValue = a.name || ''
          bValue = b.name || ''
          break
        case 'email':
          aValue = a.email
          bValue = b.email
          break
        case 'createdAt':
          aValue = new Date(a.createdAt)
          bValue = new Date(b.createdAt)
          break
        case 'updatedAt':
          aValue = new Date(a.updatedAt)
          bValue = new Date(b.updatedAt)
          break
        default:
          aValue = a.createdAt
          bValue = b.createdAt
      }

      if (validatedData.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    // 分页
    const startIndex = (validatedData.page - 1) * validatedData.limit
    const endIndex = startIndex + validatedData.limit
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex)

    // 移除密码字段
    const usersWithoutPassword = paginatedUsers.map(user => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...userWithoutPassword } = user
      return userWithoutPassword
    })

    return NextResponse.json({
      users: usersWithoutPassword,
      pagination: {
        page: validatedData.page,
        limit: validatedData.limit,
        total: filteredUsers.length,
        totalPages: Math.ceil(filteredUsers.length / validatedData.limit)
      },
      filters: {
        query: validatedData.query,
        email: validatedData.email,
        phone: validatedData.phone,
        active: validatedData.active,
        roleId: validatedData.roleId,
        organizationId: validatedData.organizationId,
        departmentId: validatedData.departmentId
      },
      sorting: {
        sortBy: validatedData.sortBy,
        sortOrder: validatedData.sortOrder
      }
    })
  } catch (error) {
    console.error('用户搜索失败:', error)

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
      { error: '用户搜索失败' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/users/search?query=xxx&active=true&page=1&limit=20
 * 简单用户搜索（通过查询参数）
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

    // 检查权限
    const hasPermission = await PermissionService.checkPermission(
      session.user.id,
      'users.view'
    )
    if (!hasPermission.hasPermission) {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      )
    }

    // 获取查询参数
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query') || undefined
    const email = searchParams.get('email') || undefined
    const phone = searchParams.get('phone') || undefined
    const active = searchParams.get('active') ? searchParams.get('active') === 'true' : undefined
    const roleId = searchParams.get('roleId') || undefined
    const organizationId = searchParams.get('organizationId') || undefined
    const departmentId = searchParams.get('departmentId') || undefined
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const sortBy = (searchParams.get('sortBy') as 'name' | 'email' | 'createdAt' | 'updatedAt') || 'createdAt'
    const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc'

    // 验证参数
    const validatedData = searchSchema.parse({
      query,
      email,
      phone,
      active,
      roleId,
      organizationId,
      departmentId,
      page,
      limit,
      sortBy,
      sortOrder
    })

    // 重用POST方法的逻辑
    const mockRequest = new NextRequest(request.url, {
      method: 'POST',
      body: JSON.stringify(validatedData)
    })

    return await POST(mockRequest)
  } catch (error) {
    console.error('用户搜索失败:', error)

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
      { error: '用户搜索失败' },
      { status: 500 }
    )
  }
}