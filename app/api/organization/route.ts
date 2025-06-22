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

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }

    // 获取用户所属的组织信息
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