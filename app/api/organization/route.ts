/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-06-22 03:15:04
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-06-22 03:17:09
 * @FilePath: /lulab_dashboard/app/api/organization/route.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { organizationService } from '@/lib/services/organization.service'
import { PermissionService } from '@/lib/services/permission.service'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }

    // 获取查询参数
    const { searchParams } = new URL(request.url)
    const listAll = searchParams.get('list') === 'true'

    if (listAll) {
      // 检查权限 - 获取所有组织列表需要特殊权限
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

      // 获取所有组织列表
      const organizations = await organizationService.getOrganizations()
      
      const organizationList = organizations.map(org => ({
        id: org.id,
        name: org.name,
        code: org.code,
        description: org.description,
        level: org.level,
        memberCount: (org.users?.length || 0) + 
                    (org.departments?.reduce((total, dept) => 
                      total + (dept.users?.length || 0), 0) || 0),
        departmentCount: org.departments?.length || 0,
        active: org.active,
        createdAt: org.createdAt,
        updatedAt: org.updatedAt
      }))

      return NextResponse.json({
        success: true,
        data: organizationList,
        total: organizationList.length
      })
    }

    // 获取用户所属的组织信息（原有逻辑）
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        organizations: {
          include: {
            organization: true
          }
        }
      }
    })

    if (!user || !user.organizations.length) {
      // 如果用户没有关联组织，返回默认组织
      const defaultOrg = await prisma.organization.findFirst({
        where: { code: 'LULAB' }
      })

      return NextResponse.json({
        id: defaultOrg?.id || '',
        name: defaultOrg?.name || '',
        code: defaultOrg?.code || ''
      })
    }

    // 返回用户的第一个组织（通常用户只属于一个组织）
    const organization = user.organizations[0].organization

    return NextResponse.json({
      id: organization.id,
      name: organization.name,
      code: organization.code
    })

  } catch (error) {
    console.error('获取组织信息失败:', error)
    return NextResponse.json(
      { error: '获取组织信息失败' },
      { status: 500 }
    )
  }
}