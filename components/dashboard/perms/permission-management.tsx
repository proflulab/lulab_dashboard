'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { ButtonGuard } from '@/components/auth/permission-guard'

interface PermissionManagementProps {
  canManage: boolean
  searchTerm: string
}

/**
 * 权限管理组件
 */
export function PermissionManagement({ canManage: _canManage, searchTerm: _searchTerm }: PermissionManagementProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>权限管理</CardTitle>
            <CardDescription>管理系统权限和访问控制</CardDescription>
          </div>
          <ButtonGuard permission="permissions.create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              添加权限
            </Button>
          </ButtonGuard>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          权限管理功能开发中...
        </div>
      </CardContent>
    </Card>
  )
}