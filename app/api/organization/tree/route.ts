/*
 * 组织架构树 API 路由
 * 用于获取完整的组织架构树形结构
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { organizationService } from '@/lib/services/organization.service'
import { PermissionService } from '@/lib/services/permission.service'

/**
 * GET /api/organization/tree
 * 获取组织架构树
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
      'organization.view'
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
    const type = searchParams.get('type') // 'full' | 'departments'

    let organizationTree

    if (type === 'departments') {
      // 只获取部门架构
      organizationTree = await organizationService.getDepartmentTree(organizationId || undefined)
    } else if (organizationId) {
      // 获取指定组织的架构
      const singleOrg = await organizationService.getOrganizationById(organizationId)
      organizationTree = singleOrg ? [singleOrg] : []
    } else {
      // 获取完整组织架构树
      organizationTree = await organizationService.getOrganizationTree()
    }

    return NextResponse.json({
      success: true,
      data: organizationTree,
      metadata: {
        type: type || 'full',
        organizationId: organizationId || null,
        generatedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('获取组织架构树失败:', error)
    return NextResponse.json(
      { error: '获取组织架构树失败' },
      { status: 500 }
    )
  }
}