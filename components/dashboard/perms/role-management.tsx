/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-06-22 04:23:59
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-06-22 04:24:01
 * @FilePath: /lulab_dashboard/components/dashboard/permissions/role-management.tsx
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { ButtonGuard } from '@/components/auth/permission-guard'

interface RoleManagementProps {
    canManage: boolean
    searchTerm: string
}

/**
 * 角色管理组件
 */
export function RoleManagement({ canManage: _canManage, searchTerm: _searchTerm }: RoleManagementProps) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>角色管理</CardTitle>
                        <CardDescription>管理系统角色和权限分配</CardDescription>
                    </div>
                    <ButtonGuard permission="roles.create">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            添加角色
                        </Button>
                    </ButtonGuard>
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                    角色管理功能开发中...
                </div>
            </CardContent>
        </Card>
    )
}