/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-06-20 18:42:52
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-06-20 19:29:04
 * @FilePath: /lulab_dashboard/app/api/dashboard/stats/route.ts
 * @Description: 仪表板统计数据 API 路由
 * 用于获取仪表板的核心统计指标
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { permissionService, dashboardService } from '@/lib/db'

/**
 * GET /api/dashboard/stats
 * 获取仪表板统计数据
 */
export async function GET() {
  try {
    // 验证用户身份
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }

    // 检查用户权限
    const hasPermission = await permissionService.checkPermission(
      session.user.id,
      'dashboard:view'
    )

    if (!hasPermission) {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      )
    }

    // 获取统计数据
    const stats = await dashboardService.getStats()

    return NextResponse.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('Dashboard stats API error:', error)
    return NextResponse.json(
      { error: '获取统计数据失败' },
      { status: 500 }
    )
  }
}