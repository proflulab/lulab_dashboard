/**
 * 仪表板统计数据服务
 * 提供仪表板相关的数据统计功能
 */

import { prisma } from '@/lib/prisma'

export interface DashboardStats {
    totalUsers: number
    totalOrders: number
    totalRevenue: number
    activeUsers: number
    recentOrdersCount: number
    averageOrderValue: number
}

export interface DashboardTrends {
    userGrowthRate: number // 用户增长率（相比上月）
    orderGrowthRate: number // 订单增长率（相比上月）
    revenueGrowthRate: number // 收入增长率（相比上月）
}

export interface DashboardChartData {
    dailyOrders: Array<{ date: string; count: number; revenue: number }>
    monthlyRevenue: Array<{ month: string; revenue: number }>
    userRegistrations: Array<{ date: string; count: number }>
}

export interface UserActivityStats {
    activeUsers: number // 活跃用户数（最近30天有订单）
    newUsers: number // 新用户数（最近7天注册）
    returningCustomers: number // 回头客数量（有多个订单的用户）
    retentionRate: number // 用户留存率
}

export class DashboardService {
    /**
     * 获取仪表板核心统计数据
     */
    static async getStats(): Promise<DashboardStats> {
        try {
            // 计算时间范围
            const thirtyDaysAgo = new Date()
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
            const sevenDaysAgo = new Date()
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

            // 并行查询所有需要的数据
            const [totalUsers, totalOrders, totalRevenue, activeUsers, recentOrdersCount, paidOrdersData] = await Promise.all([
                // 总用户数（排除软删除）
                prisma.user.count({
                    where: {
                        deletedAt: null
                    }
                }),

                // 总订单数
                prisma.order.count(),

                // 总收入（人民币）
                prisma.order.aggregate({
                    _sum: {
                        amountPaidCny: true
                    },
                    where: {
                        amountPaidCny: {
                            not: null
                        }
                    }
                }),

                // 活跃用户数（最近30天有活动的用户）
                prisma.user.count({
                    where: {
                        deletedAt: null,
                        OR: [
                            {
                                createdAt: {
                                    gt: thirtyDaysAgo
                                }
                            },
                            {
                                orders: {
                                    some: {
                                        paidAt: {
                                            gt: thirtyDaysAgo
                                        }
                                    }
                                }
                            }
                        ]
                    }
                }),

                // 最近7天的订单数量
                prisma.order.count({
                    where: {
                        paidAt: {
                            gt: sevenDaysAgo
                        }
                    }
                }),

                // 有效付费订单数据（用于计算平均订单价值）
                prisma.order.count({
                    where: {
                        amountPaidCny: {
                            gt: 0
                        }
                    }
                })
            ])

            // 计算平均订单价值
            const revenue = Number(totalRevenue._sum.amountPaidCny) || 0
            const averageOrderValue = paidOrdersData > 0 ? revenue / paidOrdersData : 0

            return {
                totalUsers,
                totalOrders,
                totalRevenue: revenue,
                activeUsers,
                recentOrdersCount,
                averageOrderValue: Math.round(averageOrderValue * 100) / 100
            }
        } catch (error) {
            console.error('Failed to calculate dashboard stats:', error)
            // 返回默认值以防错误
            return {
                totalUsers: 0,
                totalOrders: 0,
                totalRevenue: 0,
                activeUsers: 0,
                recentOrdersCount: 0,
                averageOrderValue: 0
            }
        }
    }

    /**
     * 获取仪表板趋势数据
     */
    static async getTrends(): Promise<DashboardTrends> {
        try {
            const now = new Date()
            const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

            // 并行查询所有需要的数据
            const [
                currentMonthUsers,
                lastMonthUsers,
                currentMonthOrders,
                lastMonthOrders,
                currentMonthRevenue,
                lastMonthRevenue
            ] = await Promise.all([
                // 本月新增用户数
                prisma.user.count({
                    where: {
                        deletedAt: null,
                        createdAt: {
                            gte: currentMonth
                        }
                    }
                }),

                // 上月新增用户数
                prisma.user.count({
                    where: {
                        deletedAt: null,
                        createdAt: {
                            gte: lastMonth,
                            lt: currentMonth
                        }
                    }
                }),

                // 本月订单数
                prisma.order.count({
                    where: {
                        paidAt: {
                            gte: currentMonth
                        }
                    }
                }),

                // 上月订单数
                prisma.order.count({
                    where: {
                        paidAt: {
                            gte: lastMonth,
                            lt: currentMonth
                        }
                    }
                }),

                // 本月收入
                prisma.order.aggregate({
                    _sum: {
                        amountPaidCny: true
                    },
                    where: {
                        paidAt: {
                            gte: currentMonth
                        },
                        amountPaidCny: {
                            not: null
                        }
                    }
                }),

                // 上月收入
                prisma.order.aggregate({
                    _sum: {
                        amountPaidCny: true
                    },
                    where: {
                        paidAt: {
                            gte: lastMonth,
                            lt: currentMonth
                        },
                        amountPaidCny: {
                            not: null
                        }
                    }
                })
            ])

            // 计算收入数值
            const currentRevenue = Number(currentMonthRevenue._sum.amountPaidCny) || 0
            const lastRevenue = Number(lastMonthRevenue._sum.amountPaidCny) || 0

            // 计算增长率
            const userGrowthRate = lastMonthUsers > 0
                ? ((currentMonthUsers - lastMonthUsers) / lastMonthUsers) * 100
                : 0

            const orderGrowthRate = lastMonthOrders > 0
                ? ((currentMonthOrders - lastMonthOrders) / lastMonthOrders) * 100
                : 0

            const revenueGrowthRate = lastRevenue > 0
                ? ((currentRevenue - lastRevenue) / lastRevenue) * 100
                : 0

            return {
                userGrowthRate: Math.round(userGrowthRate * 100) / 100,
                orderGrowthRate: Math.round(orderGrowthRate * 100) / 100,
                revenueGrowthRate: Math.round(revenueGrowthRate * 100) / 100
            }
        } catch (error) {
            console.error('Failed to calculate dashboard trends:', error)
            return {
                userGrowthRate: 0,
                orderGrowthRate: 0,
                revenueGrowthRate: 0
            }
        }
    }

    /**
     * 获取仪表板图表数据
     */
    static async getChartData(days: number = 30): Promise<DashboardChartData> {
        try {
            const now = new Date()
            const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

            // 生成日期数组
            const dateArray = []
            for (let i = 0; i < days; i++) {
                const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
                dateArray.push(date.toISOString().split('T')[0])
            }

            // 并行查询每日订单数据
            const dailyOrdersPromises = dateArray.map(async (date) => {
                const dayStart = new Date(date + 'T00:00:00')
                const dayEnd = new Date(date + 'T23:59:59')

                const [orderCount, orderRevenue] = await Promise.all([
                    prisma.order.count({
                        where: {
                            paidAt: {
                                gte: dayStart,
                                lte: dayEnd
                            }
                        }
                    }),
                    prisma.order.aggregate({
                        _sum: {
                            amountPaidCny: true
                        },
                        where: {
                            paidAt: {
                                gte: dayStart,
                                lte: dayEnd
                            },
                            amountPaidCny: {
                                not: null
                            }
                        }
                    })
                ])

                return {
                    date,
                    count: orderCount,
                    revenue: Number(orderRevenue._sum.amountPaidCny) || 0
                }
            })

            // 并行查询每日用户注册数据
            const userRegistrationsPromises = dateArray.map(async (date) => {
                const dayStart = new Date(date + 'T00:00:00')
                const dayEnd = new Date(date + 'T23:59:59')

                const count = await prisma.user.count({
                    where: {
                        deletedAt: null,
                        createdAt: {
                            gte: dayStart,
                            lte: dayEnd
                        }
                    }
                })

                return {
                    date,
                    count
                }
            })

            // 并行查询最近12个月的收入数据
            const monthlyRevenuePromises = []
            for (let i = 11; i >= 0; i--) {
                const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
                const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)

                monthlyRevenuePromises.push(
                    prisma.order.aggregate({
                        _sum: {
                            amountPaidCny: true
                        },
                        where: {
                            paidAt: {
                                gte: monthStart,
                                lte: monthEnd
                            },
                            amountPaidCny: {
                                not: null
                            }
                        }
                    }).then(result => ({
                        month: monthStart.toISOString().slice(0, 7), // YYYY-MM format
                        revenue: Number(result._sum.amountPaidCny) || 0
                    }))
                )
            }

            // 等待所有查询完成
            const [dailyOrders, userRegistrations, monthlyRevenue] = await Promise.all([
                Promise.all(dailyOrdersPromises),
                Promise.all(userRegistrationsPromises),
                Promise.all(monthlyRevenuePromises)
            ])

            return {
                dailyOrders,
                monthlyRevenue,
                userRegistrations
            }
        } catch (error) {
            console.error('Failed to get dashboard chart data:', error)
            return {
                dailyOrders: [],
                monthlyRevenue: [],
                userRegistrations: []
            }
        }
    }

    /**
     * 获取用户活跃度统计
     */
    static async getUserActivityStats(): Promise<UserActivityStats> {
        try {
            const now = new Date()
            const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

            // 并行查询所有需要的数据
            const [
                totalUsers,
                newUsers,
                activeUserIds,
                userOrderCounts
            ] = await Promise.all([
                // 总用户数
                prisma.user.count({
                    where: {
                        deletedAt: null
                    }
                }),

                // 新用户（最近7天注册）
                prisma.user.count({
                    where: {
                        deletedAt: null,
                        createdAt: {
                            gte: last7Days
                        }
                    }
                }),

                // 活跃用户（最近30天有订单的用户ID）
                prisma.order.findMany({
                    select: {
                        userId: true
                    },
                    where: {
                        paidAt: {
                            gte: last30Days
                        }
                    },
                    distinct: ['userId']
                }),

                // 用户订单统计（用于计算回头客）
                prisma.order.groupBy({
                    by: ['userId'],
                    _count: {
                        id: true
                    },
                    where: {
                        paidAt: {
                            not: null
                        }
                    }
                })
            ])

            // 计算活跃用户数
            const activeUsers = activeUserIds.length

            // 计算回头客（有多个订单的用户）
            const returningCustomers = userOrderCounts
                .filter(userOrder => userOrder._count.id > 1).length

            // 用户留存率（最近30天内有订单的用户占总用户的比例）
            const retentionRate = totalUsers > 0
                ? (activeUsers / totalUsers) * 100
                : 0

            return {
                activeUsers,
                newUsers,
                returningCustomers,
                retentionRate: Math.round(retentionRate * 100) / 100
            }
        } catch (error) {
            console.error('Failed to get user activity stats:', error)
            return {
                activeUsers: 0,
                newUsers: 0,
                returningCustomers: 0,
                retentionRate: 0
            }
        }
    }
}

// 导出服务实例，包装静态方法
export const dashboardService = {
    getStats: DashboardService.getStats,
    getTrends: DashboardService.getTrends,
    getChartData: DashboardService.getChartData,
    getUserActivityStats: DashboardService.getUserActivityStats
}

// 为了保持向后兼容，也导出静态方法
export const calculateDashboardStats = DashboardService.getStats
export const getDashboardTrends = DashboardService.getTrends
export const getDashboardChartData = DashboardService.getChartData
export const getUserActivityStats = DashboardService.getUserActivityStats