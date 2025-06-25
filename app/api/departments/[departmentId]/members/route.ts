/*
 * 部门成员 API 路由
 * 用于获取指定部门的成员列表
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { PermissionService } from '@/lib/services/permission.service'
import { departmentService } from '@/lib/services/department.service'

/**
 * GET /api/departments/[departmentId]/members
 * 获取部门成员列表
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ departmentId: string }> }
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

    const { departmentId } = await params

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
    const includeSubDepartments = searchParams.get('includeSubDepartments') === 'true'

    // 调用部门服务获取成员数据
    const { departmentUsers, department, departmentIds } = await departmentService.getDepartmentMembers(
      departmentId,
      includeSubDepartments
    )

    // 转换为前端需要的格式
    const members = departmentUsers.map(userDept => {
      const user = userDept.user
      const profile = user.profile

      return {
        id: user.id,
        name: profile?.name || user.email,
        email: user.email,
        phone: user.phone || '',
        countryCode: user.countryCode || '',
        avatar: profile?.avatar || '',
        department: userDept.department.name,
        departmentId: userDept.department.id,
        organization: userDept.department.organization.name,
        organizationId: userDept.department.organizationId,
        roles: user.roles?.map(userRole => ({
          id: userRole.role.id,
          name: userRole.role.name,
          code: userRole.role.code
        })) || [],
        status: user.active ? 'active' : 'inactive',
        accountStatus: user.emailVerifiedAt ? '正常' : '未设置',
        position: user.roles?.[0]?.role.name || '成员',
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    })



    return NextResponse.json({
      success: true,
      data: {
        department: department ? {
          id: department.id,
          name: department.name,
          code: department.code,
          description: department.description,
          organizationId: department.organizationId,
          organizationName: department.organization.name,
          parentId: department.parentId,
          parentName: department.parent?.name || null,
          level: department.level
        } : null,
        members,
        includeSubDepartments,
        totalMembers: members.length
      },
      metadata: {
        departmentIds,
        generatedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('获取部门成员失败:', error)
    return NextResponse.json(
      { error: '获取部门成员失败' },
      { status: 500 }
    )
  }
}