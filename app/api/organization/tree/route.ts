/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-06-22 17:30:59
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-06-25 06:36:06
 * @FilePath: /lulab_dashboard/app/api/organization/tree/route.ts
 * @Description: 组织架构树 API 路由
 * 用于获取完整的组织架构树形结构
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
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
      organizationTree = await organizationService.getOrganizationTree()
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