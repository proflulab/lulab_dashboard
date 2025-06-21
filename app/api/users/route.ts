/*
 * 用户管理 API 路由
 * 用于用户的增删改查操作
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { userService } from '@/lib/services/user.service'
import { PermissionService } from '@/lib/services/permission.service'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

// 创建用户请求参数验证模式
const createUserSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(6, '密码至少6位').optional(),
  countryCode: z.string().optional(),
  phone: z.string().optional(),
  active: z.boolean().default(true),
  // Profile fields
  name: z.string().optional(),
  avatar: z.string().optional(),
  bio: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  dateOfBirth: z.string().transform(val => val ? new Date(val) : undefined).optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  zipCode: z.string().optional(),
  website: z.string().optional()
})

/**
 * GET /api/users
 * 获取用户列表
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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''

    // 获取用户列表
    const users = await userService.getAll()

    // 过滤搜索结果
    let filteredUsers = users
    if (search) {
      filteredUsers = users.filter(user =>
        user.profile?.name?.toLowerCase().includes(search.toLowerCase()) ||
        user.profile?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
        user.profile?.lastName?.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase()) ||
        user.phone?.includes(search)
      )
    }

    // 分页
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex)

    return NextResponse.json({
      users: paginatedUsers,
      pagination: {
        page,
        limit,
        total: filteredUsers.length,
        totalPages: Math.ceil(filteredUsers.length / limit)
      }
    })
  } catch (error) {
    console.error('获取用户列表失败:', error)
    return NextResponse.json(
      { error: '获取用户列表失败' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/users
 * 创建新用户
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
      'users.create'
    )
    if (!hasPermission.hasPermission) {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      )
    }

    // 解析请求体
    const body = await request.json()
    const validatedData = createUserSchema.parse(body)

    // 检查邮箱是否已存在
    const existingUser = await userService.getByEmail(validatedData.email)
    if (existingUser) {
      return NextResponse.json(
        { error: '邮箱已存在' },
        { status: 400 }
      )
    }

    // 检查手机号是否已存在（如果提供了手机号）
    if (validatedData.phone && validatedData.countryCode) {
      const existingPhoneUser = await userService.getByPhone(
        validatedData.countryCode,
        validatedData.phone
      )
      if (existingPhoneUser) {
        return NextResponse.json(
          { error: '手机号已存在' },
          { status: 400 }
        )
      }
    }

    // 加密密码（如果提供了密码）
    let hashedPassword: string | undefined
    if (validatedData.password) {
      hashedPassword = await bcrypt.hash(validatedData.password, 12)
    }

    // 创建用户
    const newUser = await userService.create({
      name: validatedData.name,
      email: validatedData.email,
      password: hashedPassword,
      countryCode: validatedData.countryCode,
      phone: validatedData.phone,
      avatar: validatedData.avatar,
      active: validatedData.active
    })

    // 返回创建的用户（不包含密码）
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = newUser

    return NextResponse.json({
      message: '用户创建成功',
      user: userWithoutPassword
    }, { status: 201 })
  } catch (error) {
    console.error('创建用户失败:', error)

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
      { error: '创建用户失败' },
      { status: 500 }
    )
  }
}