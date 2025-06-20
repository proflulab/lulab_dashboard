/*
 * 用户详情 API 路由
 * 用于单个用户的查看、更新和删除操作
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { userService } from '@/lib/services/user.service'
import { PermissionService } from '@/lib/services/permission.service'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

// 更新用户请求参数验证模式
const updateUserSchema = z.object({
  email: z.string().email('邮箱格式不正确').optional(),
  password: z.string().min(6, '密码至少6位').optional(),
  countryCode: z.string().optional(),
  phone: z.string().optional(),
  active: z.boolean().optional(),
  emailVerifiedAt: z.string().transform(val => val ? new Date(val) : undefined).optional(),
  phoneVerifiedAt: z.string().transform(val => val ? new Date(val) : undefined).optional(),
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
 * GET /api/users/[userId]
 * 获取用户详情
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

    // 检查是否有权限查看其他用户信息
    // 只有管理员或查看自己的信息才被允许
    if (session.user.id !== userId) {
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
    }

    // 获取用户信息
    const user = await userService.getById(userId)

    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      )
    }

    // 返回用户信息（不包含密码）
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user

    return NextResponse.json({
      user: userWithoutPassword
    })
  } catch (error) {
    console.error('获取用户详情失败:', error)
    return NextResponse.json(
      { error: '获取用户详情失败' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/users/[userId]
 * 更新用户信息
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

    // 检查是否有权限修改其他用户信息
    // 只有管理员或修改自己的信息才被允许
    if (session.user.id !== userId) {
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
    }

    // 解析请求体
    const body = await request.json()
    const validatedData = updateUserSchema.parse(body)

    // 检查邮箱是否已被其他用户使用
    if (validatedData.email) {
      const existingUser = await userService.getByEmail(validatedData.email)
      if (existingUser && existingUser.id !== userId) {
        return NextResponse.json(
          { error: '邮箱已被其他用户使用' },
          { status: 400 }
        )
      }
    }

    // 检查手机号是否已被其他用户使用
    if (validatedData.phone && validatedData.countryCode) {
      const existingPhoneUser = await userService.getByPhone(
        validatedData.countryCode,
        validatedData.phone
      )
      if (existingPhoneUser && existingPhoneUser.id !== userId) {
        return NextResponse.json(
          { error: '手机号已被其他用户使用' },
          { status: 400 }
        )
      }
    }

    // 加密密码（如果提供了新密码）
    let hashedPassword: string | undefined
    if (validatedData.password) {
      hashedPassword = await bcrypt.hash(validatedData.password, 12)
    }

    // 更新用户信息
    const updatedUser = await userService.update(userId, {
      name: validatedData.name,
      email: validatedData.email,
      password: hashedPassword,
      countryCode: validatedData.countryCode,
      phone: validatedData.phone,
      avatar: validatedData.avatar,
      active: validatedData.active,
      emailVerifiedAt: validatedData.emailVerifiedAt,
      phoneVerifiedAt: validatedData.phoneVerifiedAt
    })

    // 返回更新后的用户信息（不包含密码）
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = updatedUser

    return NextResponse.json({
      message: '用户更新成功',
      user: userWithoutPassword
    })
  } catch (error) {
    console.error('更新用户失败:', error)

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
      { error: '更新用户失败' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/users/[userId]
 * 删除用户（软删除）
 */
export async function DELETE(
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
      'users.delete'
    )
    if (!hasPermission.hasPermission) {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      )
    }

    // 防止用户删除自己
    if (session.user.id === userId) {
      return NextResponse.json(
        { error: '不能删除自己的账户' },
        { status: 400 }
      )
    }

    // 软删除用户
    await userService.softDelete(userId)

    return NextResponse.json({
      message: '用户删除成功'
    })
  } catch (error) {
    console.error('删除用户失败:', error)

    if (error instanceof Error && error.message === 'User not found or has been deleted') {
      return NextResponse.json(
        { error: '用户不存在或已被删除' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: '删除用户失败' },
      { status: 500 }
    )
  }
}