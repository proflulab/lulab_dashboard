/*
 * 组织成员 API 路由
 * 用于获取指定组织的成员列表
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { PermissionService } from '@/lib/services/permission.service'

/**
 * GET /api/organization/[organizationId]/members
 * 获取组织成员列表
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> }
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

    const { organizationId } = await params

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
    const departmentId = searchParams.get('departmentId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''

    // 获取组织信息
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        departments: {
          where: { active: true }
        }
      }
    })

    if (!organization) {
      return NextResponse.json(
        { error: '组织不存在' },
        { status: 404 }
      )
    }

    // 构建查询条件
    const whereConditions: Record<string, unknown> = {
      OR: [
        // 直接属于组织的用户
        {
          organizations: {
            some: {
              organizationId: organizationId
            }
          }
        },
        // 属于组织下部门的用户
        {
          departments: {
            some: {
              department: {
                organizationId: organizationId,
                active: true
              }
            }
          }
        }
      ],
      deletedAt: null
    }

    // 如果指定了部门，则只获取该部门的用户
    if (departmentId) {
      whereConditions.departments = {
        some: {
          departmentId: departmentId
        }
      }
      delete whereConditions.OR
    }

    // 搜索条件
    if (search) {
      whereConditions.OR = [
        {
          email: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          phone: {
            contains: search
          }
        },
        {
          profile: {
            name: {
              contains: search,
              mode: 'insensitive'
            }
          }
        }
      ]
    }

    // 获取用户总数
    const totalUsers = await prisma.user.count({
      where: whereConditions
    })

    // 获取用户列表
    const users = await prisma.user.findMany({
      where: whereConditions,
      include: {
        profile: true,
        roles: {
          include: {
            role: true
          }
        },
        organizations: {
          include: {
            organization: true
          }
        },
        departments: {
          include: {
            department: {
              include: {
                organization: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit
    })

    // 转换为前端需要的格式
    const members = users.map(user => {
      const profile = user.profile
      const primaryDepartment = user.departments?.[0]?.department
      const primaryRole = user.roles?.[0]?.role

      return {
        id: user.id,
        name: profile?.name || user.email,
        email: user.email,
        phone: user.phone || '',
        countryCode: user.countryCode || '',
        avatar: profile?.avatar || '',
        department: primaryDepartment?.name || '未分配部门',
        departmentId: primaryDepartment?.id || null,
        organization: organization.name,
        organizationId: organization.id,
        roles: user.roles?.map(userRole => ({
          id: userRole.role.id,
          name: userRole.role.name,
          code: userRole.role.code
        })) || [],
        status: user.active ? 'active' : 'inactive',
        accountStatus: user.emailVerifiedAt ? '正常' : '未设置',
        position: primaryRole?.name || '成员',
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        // 额外信息
        allDepartments: user.departments?.map(userDept => ({
          id: userDept.department.id,
          name: userDept.department.name,
          code: userDept.department.code
        })) || []
      }
    })

    // 获取部门统计
    const departmentStats = await Promise.all(
      organization.departments.map(async (dept) => {
        const memberCount = await prisma.userDepartment.count({
          where: {
            departmentId: dept.id
          }
        })

        return {
          id: dept.id,
          name: dept.name,
          memberCount
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: {
        organization: {
          id: organization.id,
          name: organization.name,
          code: organization.code,
          description: organization.description
        },
        members,
        departmentStats,
        pagination: {
          page,
          limit,
          total: totalUsers,
          totalPages: Math.ceil(totalUsers / limit)
        },
        filters: {
          departmentId,
          search
        }
      },
      metadata: {
        generatedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('获取组织成员失败:', error)
    return NextResponse.json(
      { error: '获取组织成员失败' },
      { status: 500 }
    )
  }
}