/*
 * 部门管理 API 路由
 * 用于部门的增删改查操作
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { organizationService } from '@/lib/services/organization.service'
import { PermissionService } from '@/lib/services/permission.service'

/**
 * GET /api/departments
 * 获取部门列表
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
      'departments.view'
    )
    if (!hasPermission.hasPermission) {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      )
    }

    // 获取查询参数
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    const includeTree = searchParams.get('tree') === 'true'

    if (includeTree) {
      // 返回树形结构
      const departmentTree = await organizationService.getDepartmentTree(organizationId || undefined)
      return NextResponse.json({
        success: true,
        data: departmentTree,
        type: 'tree'
      })
    } else {
      // 返回平铺列表
      const departments = await organizationService.getDepartments(organizationId || undefined)

      // 转换为简化格式
      const departmentList = departments.map(dept => ({
        id: dept.id,
        name: dept.name,
        code: dept.code,
        description: dept.description,
        organizationId: dept.organizationId,
        organizationName: dept.organization.name,
        parentId: dept.parentId,
        parentName: dept.parent?.name || null,
        level: dept.level,
        memberCount: dept.users?.length || 0,
        active: dept.active,
        createdAt: dept.createdAt,
        updatedAt: dept.updatedAt
      }))

      return NextResponse.json({
        success: true,
        data: departmentList,
        type: 'list',
        total: departmentList.length
      })
    }

  } catch (error) {
    console.error('获取部门列表失败:', error)
    return NextResponse.json(
      { error: '获取部门列表失败' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/departments
 * 创建新部门
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
      'departments.create'
    )
    if (!hasPermission.hasPermission) {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      )
    }

    // 解析请求体
    const body = await request.json()
    const { name, description, parentId, type, code, responsiblePerson, contactInfo } = body

    // 验证必填字段
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: '部门名称不能为空' },
        { status: 400 }
      )
    }

    // 创建部门
    const newDepartment = await organizationService.createDepartment({
      name: name.trim(),
      description: description?.trim(),
      parentId: parentId || null,
      type: type?.trim(),
      code: code?.trim(),
      responsiblePerson: responsiblePerson?.trim(),
      contactInfo: contactInfo?.trim()
    })

    return NextResponse.json({
      success: true,
      data: newDepartment,
      message: '部门创建成功'
    })

  } catch (error) {
    console.error('创建部门失败:', error)
    return NextResponse.json(
      { error: '创建部门失败' },
      { status: 500 }
    )
  }
}