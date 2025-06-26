/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-01-27 12:00:00
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-01-27 12:00:00
 * @FilePath: /lulab_dashboard/app/api/organization/members/route.ts
 * @Description: 组织成员API路由
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { PermissionService } from '@/lib/services/permission.service'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
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

    // 获取用户所属的组织
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
      return NextResponse.json({
        success: true,
        data: {
          members: []
        }
      })
    }

    const organizationId = user.organizations[0].organization.id

    // 获取组织的所有成员
    const members = await prisma.user.findMany({
      where: {
        organizations: {
          some: {
            organizationId: organizationId
          }
        }
      },
      include: {
        profile: true,
        organizations: {
          include: {
            organization: true
          }
        },
        departments: {
          include: {
            department: true
          }
        }
      }
    })

    // 格式化成员数据
    const formattedMembers = members.map(member => ({
      id: parseInt(member.id),
      name: member.profile?.name || member.email || '未知用户',
      phone: member.phone || '',
      countryCode: member.countryCode || '+86',
      department: member.departments.length > 0
        ? member.departments[0].department.name
        : '未分配部门',
      position: member.profile?.bio || '未设置',
      status: member.active ? 'active' : 'inactive',
      accountStatus: member.emailVerifiedAt ? '正常' : '未设置',
      email: member.email || '',
      avatar: member.profile?.avatar || ''
    }))

    return NextResponse.json({
      success: true,
      data: {
        members: formattedMembers,
        pagination: {
          page: 1,
          limit: formattedMembers.length,
          total: formattedMembers.length,
          totalPages: 1
        }
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