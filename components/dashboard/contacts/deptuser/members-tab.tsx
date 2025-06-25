/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-06-23 00:55:42
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-06-24 02:50:40
 * @FilePath: /lulab_dashboard/components/dashboard/contacts/departmentanduser/members-tab.tsx
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */
import React, { useEffect } from 'react'
import { MembersPage } from './members-table/page'
import { DepartmentPanel } from './department-part/department-panel'
import { MemberDetailSidebar } from '@/components/dashboard/contacts/deptuser/sidebar/member-detail'
import { useOrganizationStore } from '@/stores/organization-store'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ChevronLeft, ChevronRight } from "lucide-react"

export function MembersTab() {
  const {
    // 状态
    loading,
    isSidebarOpen,
    selectedMemberDetail,
    isOrgPanelCollapsed,
    members,
    // 操作
    loadInitialData,
    setOrgPanelCollapsed,
    getSelectedNodeName,
    closeSidebar
  } = useOrganizationStore()

  // 数据加载
  useEffect(() => {
    loadInitialData()
  }, [])

  return (
    <div className="space-y-1">
      <div className="flex gap-2">
        {/* 左侧组织架构 */}
        <DepartmentPanel />

        {/* 右侧成员列表 */}
        <div className="flex-1">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setOrgPanelCollapsed(!isOrgPanelCollapsed)}
                          className="p-0.5 h-6 w-6 flex-shrink-0"
                        >
                          {isOrgPanelCollapsed ? (
                            <ChevronRight className="h-3 w-3" />
                          ) : (
                            <ChevronLeft className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p>{isOrgPanelCollapsed ? "展开组织架构" : "收起组织架构"}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <div>
                    <CardTitle className="flex items-center justify-between">
                      {getSelectedNodeName()}
                      <span className="text-sm font-normal text-muted-foreground">
                        &nbsp;{loading ? '加载中...' : `总人数 ${members.length}`}
                      </span>
                    </CardTitle>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <MembersPage />
            </CardContent>
          </Card>

        </div>
      </div>

      {/* 用户详情侧边栏 */}
      <MemberDetailSidebar
        isOpen={isSidebarOpen}
        member={selectedMemberDetail}
        onClose={closeSidebar}
      />
    </div>
  )
}