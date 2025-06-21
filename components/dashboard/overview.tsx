'use client'

import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts'
import { useEffect, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

interface ChartData {
  name: string
  members: number
  newMembers: number
  activeMembers: number
}

interface OverviewData {
  chartData: ChartData[]
  stats: {
    totalMembers: number
    newMembers: number
    activeMembers: number
    memberGrowth: string
    newMemberGrowth: string
    activeMemberGrowth: string
  }
}

/**
 * 从后端API获取仪表板概览数据
 */
async function fetchOverviewData(): Promise<OverviewData> {
  const response = await fetch('/api/dashboard/overview')

  if (!response.ok) {
    throw new Error('获取数据失败')
  }

  const result = await response.json()

  if (!result.success) {
    throw new Error(result.error || '获取数据失败')
  }

  return result.data
}

export function Overview() {
  const [isLoading, setIsLoading] = useState(true)
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [error, setError] = useState<string | null>(null)
  const [visibleLines, setVisibleLines] = useState({
    members: true,
    newMembers: true,
    activeMembers: true
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await fetchOverviewData()
        setChartData(data.chartData)
      } catch (err) {
        console.error('加载仪表板数据失败:', err)
        setError(err instanceof Error ? err.message : '加载数据失败')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  const handleLineToggle = (lineKey: keyof typeof visibleLines) => {
    setVisibleLines(prev => ({
      ...prev,
      [lineKey]: !prev[lineKey]
    }))
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-red-500 text-center">
          <p className="text-lg font-medium">加载数据失败</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          重新加载
        </button>
      </div>
    )
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">暂无数据</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 数据线控制面板 */}
      <div className="flex flex-wrap gap-6 p-3 bg-muted/50 rounded-lg">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="members"
            checked={visibleLines.members}
            onCheckedChange={() => handleLineToggle('members')}
          />
          <Label htmlFor="members" className="text-sm font-medium cursor-pointer">
            <span className="inline-block w-3 h-3 bg-blue-600 rounded-full mr-2"></span>
            总会员
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="newMembers"
            checked={visibleLines.newMembers}
            onCheckedChange={() => handleLineToggle('newMembers')}
          />
          <Label htmlFor="newMembers" className="text-sm font-medium cursor-pointer">
            <span className="inline-block w-3 h-3 bg-green-600 rounded-full mr-2"></span>
            新增会员
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="activeMembers"
            checked={visibleLines.activeMembers}
            onCheckedChange={() => handleLineToggle('activeMembers')}
          />
          <Label htmlFor="activeMembers" className="text-sm font-medium cursor-pointer">
            <span className="inline-block w-3 h-3 bg-orange-600 rounded-full mr-2"></span>
            活跃会员
          </Label>
        </div>
      </div>

      {/* 图表区域 */}
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={chartData}>
          <XAxis
            dataKey="name"
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}`}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-md">
                    <div className="grid grid-cols-1 gap-2">
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          {label}
                        </span>
                        {visibleLines.members && (
                          <span className="font-bold text-blue-600">
                            总会员: {payload.find(p => p.dataKey === 'members')?.value}
                          </span>
                        )}
                        {visibleLines.newMembers && (
                          <span className="font-bold text-green-600">
                            新增会员: {payload.find(p => p.dataKey === 'newMembers')?.value}
                          </span>
                        )}
                        {visibleLines.activeMembers && (
                          <span className="font-bold text-orange-600">
                            活跃会员: {payload.find(p => p.dataKey === 'activeMembers')?.value}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              }
              return null
            }}
          />
          {visibleLines.members && (
            <Line
              type="monotone"
              dataKey="members"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
            />
          )}
          {visibleLines.newMembers && (
            <Line
              type="monotone"
              dataKey="newMembers"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
            />
          )}
          {visibleLines.activeMembers && (
            <Line
              type="monotone"
              dataKey="activeMembers"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#f59e0b', strokeWidth: 2 }}
            />
          )}
          <Legend />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}