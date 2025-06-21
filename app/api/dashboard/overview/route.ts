/*
 * 仪表板概览数据 API 路由
 * 用于获取仪表板的统计数据和图表数据
 */

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { PermissionService } from '@/lib/services/permission.service'

interface ChartData {
  name: string
  members: number
  newMembers: number
  activeMembers: number
}

/**
 * 生成模拟数据
 * 在实际项目中，这里应该从数据库获取真实数据
 */
function generateChartData(): ChartData[] {
  const currentYear = new Date().getFullYear()
  const months = [
    `${currentYear}年1月`, `${currentYear}年2月`, `${currentYear}年3月`,
    `${currentYear}年4月`, `${currentYear}年5月`, `${currentYear}年6月`,
    `${currentYear}年7月`, `${currentYear}年8月`, `${currentYear}年9月`,
    `${currentYear}年10月`, `${currentYear}年11月`, `${currentYear}年12月`
  ]
  const currentMonth = new Date().getMonth()

  return months.slice(0, currentMonth + 1).map((month, index) => {
    // 生成会员数量趋势数据
    const baseMembers = 500 + index * 50 // 基础会员数逐月增长
    const seasonalFactor = 1 + Math.sin((index / 12) * 2 * Math.PI) * 0.2
    const randomFactor = 0.9 + Math.random() * 0.2

    const members = Math.floor(baseMembers * seasonalFactor * randomFactor)
    const newMembers = Math.floor(30 + Math.random() * 40) // 每月新增会员30-70人
    const activeMembers = Math.floor(members * (0.6 + Math.random() * 0.3)) // 活跃会员占60%-90%

    return {
      name: month,
      members,
      newMembers,
      activeMembers
    }
  })
}

/**
 * GET /api/dashboard/overview
 * 获取仪表板概览数据
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
    const hasPermission = await PermissionService.checkPermission(
      session.user.id,
      'dashboard:view'
    )

    if (!hasPermission) {
      return NextResponse.json(
        { error: '权限不足' },
        { status: 403 }
      )
    }

    // 获取图表数据
    const chartData = generateChartData()

    // 计算统计数据
    const latestData = chartData[chartData.length - 1]
    const previousData = chartData[chartData.length - 2]

    const stats = {
      totalMembers: latestData?.members || 0,
      newMembers: latestData?.newMembers || 0,
      activeMembers: latestData?.activeMembers || 0,
      memberGrowth: previousData ?
        ((latestData.members - previousData.members) / previousData.members * 100).toFixed(1) : '0',
      newMemberGrowth: previousData ?
        ((latestData.newMembers - previousData.newMembers) / previousData.newMembers * 100).toFixed(1) : '0',
      activeMemberGrowth: previousData ?
        ((latestData.activeMembers - previousData.activeMembers) / previousData.activeMembers * 100).toFixed(1) : '0'
    }

    return NextResponse.json({
      success: true,
      data: {
        chartData,
        stats
      }
    })

  } catch (error) {
    console.error('获取仪表板概览数据失败:', error)
    return NextResponse.json(
      { error: '获取数据失败' },
      { status: 500 }
    )
  }
}