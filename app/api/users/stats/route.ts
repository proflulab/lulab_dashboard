/*
 * 用户统计 API 路由
 * 提供用户数据的统计分析功能
 */

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { userService } from '@/lib/services/user.service'
import { PermissionService } from '@/lib/services/permission.service'

/**
 * GET /api/users/stats
 * 获取用户统计信息
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

    // 获取所有用户数据
    const allUsers = await userService.getAll()

    // 基础统计
    const totalUsers = allUsers.length
    const activeUsers = allUsers.filter(user => user.active).length
    const inactiveUsers = totalUsers - activeUsers

    // 按创建时间统计（最近30天）
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const recentUsers = allUsers.filter(user =>
      new Date(user.createdAt) >= thirtyDaysAgo
    ).length

    // 按角色统计
    const roleStats = allUsers.reduce((acc, user) => {
      if (user.roles) {
        user.roles.forEach((userRole: { role: { name: string } }) => {
          const roleName = userRole.role.name
          acc[roleName] = (acc[roleName] || 0) + 1
        })
      }
      return acc
    }, {} as Record<string, number>)

    // 按组织统计
    const organizationStats = allUsers.reduce((acc, user) => {
      if (user.organizations) {
        user.organizations.forEach((userOrg: { organization: { name: string } }) => {
          const orgName = userOrg.organization.name
          acc[orgName] = (acc[orgName] || 0) + 1
        })
      }
      return acc
    }, {} as Record<string, number>)

    // 按部门统计
    const departmentStats = allUsers.reduce((acc, user) => {
      if (user.departments) {
        user.departments.forEach((userDept: { department: { name: string } }) => {
          const deptName = userDept.department.name
          acc[deptName] = (acc[deptName] || 0) + 1
        })
      }
      return acc
    }, {} as Record<string, number>)

    // 按月份统计用户注册趋势（最近12个月）
    const monthlyRegistrations = []
    for (let i = 11; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const year = date.getFullYear()
      const month = date.getMonth() + 1

      const count = allUsers.filter(user => {
        const userDate = new Date(user.createdAt)
        return userDate.getFullYear() === year && userDate.getMonth() + 1 === month
      }).length

      monthlyRegistrations.push({
        year,
        month,
        count,
        label: `${year}-${month.toString().padStart(2, '0')}`
      })
    }

    // 用户活跃度分析（基于最后更新时间）
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgoDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const activeInLast7Days = allUsers.filter(user =>
      new Date(user.updatedAt) >= sevenDaysAgo
    ).length

    const activeInLast30Days = allUsers.filter(user =>
      new Date(user.updatedAt) >= thirtyDaysAgoDate
    ).length

    // 邮箱域名统计
    const emailDomainStats = allUsers.reduce((acc, user) => {
      const domain = user.email.split('@')[1]
      acc[domain] = (acc[domain] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // 用户增长率计算
    const lastMonthUsers = allUsers.filter(user => {
      const userDate = new Date(user.createdAt)
      const lastMonth = new Date()
      lastMonth.setMonth(lastMonth.getMonth() - 1)
      return userDate >= lastMonth
    }).length

    const previousMonthUsers = allUsers.filter(user => {
      const userDate = new Date(user.createdAt)
      const twoMonthsAgo = new Date()
      twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2)
      const lastMonth = new Date()
      lastMonth.setMonth(lastMonth.getMonth() - 1)
      return userDate >= twoMonthsAgo && userDate < lastMonth
    }).length

    const growthRate = previousMonthUsers > 0
      ? ((lastMonthUsers - previousMonthUsers) / previousMonthUsers * 100).toFixed(2)
      : '0'

    return NextResponse.json({
      // 基础统计
      overview: {
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers,
        recentRegistrations: recentUsers,
        activeInLast7Days,
        activeInLast30Days,
        growthRate: `${growthRate}%`
      },

      // 分布统计
      distribution: {
        byRole: roleStats,
        byOrganization: organizationStats,
        byDepartment: departmentStats,
        byEmailDomain: emailDomainStats
      },

      // 趋势分析
      trends: {
        monthlyRegistrations,
        activityTrend: {
          last7Days: activeInLast7Days,
          last30Days: activeInLast30Days,
          total: totalUsers
        }
      },

      // 比率分析
      ratios: {
        activeRatio: totalUsers > 0 ? (activeUsers / totalUsers * 100).toFixed(2) + '%' : '0%',
        inactiveRatio: totalUsers > 0 ? (inactiveUsers / totalUsers * 100).toFixed(2) + '%' : '0%',
        recentRatio: totalUsers > 0 ? (recentUsers / totalUsers * 100).toFixed(2) + '%' : '0%'
      },

      // 元数据
      metadata: {
        generatedAt: new Date().toISOString(),
        dataRange: {
          from: allUsers.length > 0 ? allUsers.reduce((earliest, user) =>
            new Date(user.createdAt) < new Date(earliest.createdAt) ? user : earliest
          ).createdAt : null,
          to: new Date().toISOString()
        }
      }
    })
  } catch (error) {
    console.error('获取用户统计失败:', error)

    return NextResponse.json(
      { error: '获取用户统计失败' },
      { status: 500 }
    )
  }
}