/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-06-23 02:34:33
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-06-24 15:44:12
 * @FilePath: /lulab_dashboard/components/dashboard/contacts/deptuser/department-part/department-panel.tsx
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */

import React from 'react'
import { Search } from 'lucide-react'
import {
    Card,
    CardContent,
    CardHeader,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { DepartmentNodeComponent } from './department-node'
import { AddChildDepartmentDialog } from '../dialog/add-department'
import { DepartmentDetailSidebar } from '@/components/dashboard/contacts/deptuser/sidebar/department-detail'
import { useOrganizationStore } from '@/stores/organization-store'
import { Plus } from 'lucide-react'

export function DepartmentPanel() {
    // 直接从store获取所有状态和方法
    const {
        orgData,
        loading,
        selectedNodeId,
        isOrgPanelCollapsed,
        isDepartmentSidebarOpen,
        selectedDepartmentDetail,
        isAddChildDepartmentOpen,
        addChildParentNodeId,
        addChildParentNodeName,
        toggleNode,
        selectNode,
        handleMoreAction,
        closeDepartmentSidebar,
        openAddChildDepartment,
        closeAddChildDepartment,
    } = useOrganizationStore()
    if (isOrgPanelCollapsed) {
        return null
    }

    return (
        <>
            <div className="w-80 flex-shrink-0 transition-all duration-300">
                <Card className="h-fit">
                    {/*TODO: '待开发 - 部门/用户搜索,可以搜索员工或者部门，当点击员工可以显示侧边栏，当点击部门可以跳转到该部门用户列表'*/}
                    <CardHeader>
                        <div className="flex items-center justify-between mb-1">
                            <div className="relative flex-1 mr-2">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input
                                    placeholder="请输入姓名、部门..."
                                    className="pl-10 text-sm"
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="space-y-2">
                            {/* 动态渲染组织架构 */}
                            {loading ? (
                                <div className="flex items-center justify-center p-4">
                                    <div className="text-sm text-muted-foreground">加载中...</div>
                                </div>
                            ) : (
                                <DepartmentNodeComponent
                                    key={orgData.id}
                                    node={orgData}
                                    onToggle={toggleNode}
                                    onSelect={selectNode}
                                    selectedNodeId={selectedNodeId}
                                    onMoreClick={handleMoreAction}
                                />
                            )}

                            {/* 新建部门按钮 */}
                            <Button onClick={() => openAddChildDepartment(orgData.id, orgData.name)}
                                variant="outline" size="sm" className="w-full justify-center text-sm text-gray-600 hover:text-gray-900">
                                <Plus className="h-4 w-4 mr-2" />
                                新建部门
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 部门编辑侧边栏 */}
            <DepartmentDetailSidebar
                isOpen={isDepartmentSidebarOpen}
                department={selectedDepartmentDetail}
                onClose={closeDepartmentSidebar}
            />

            {/* 添加子部门对话框 */}
            <AddChildDepartmentDialog
                isOpen={isAddChildDepartmentOpen}
                onClose={closeAddChildDepartment}
                parentNodeId={addChildParentNodeId}
                parentNodeName={addChildParentNodeName}
            />
        </>
    )
}