'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { ButtonGuard } from '@/components/auth/permission-guard'

interface OrganizationManagementProps {
  canManage: boolean
  searchTerm: string
}

/**
 * 组织管理组件
 */
export function OrganizationManagement({ canManage: _canManage, searchTerm: _searchTerm }: OrganizationManagementProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>组织管理</CardTitle>
            <CardDescription>管理组织结构和部门设置</CardDescription>
          </div>
          <ButtonGuard permission="organizations.create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              添加组织
            </Button>
          </ButtonGuard>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          组织管理功能开发中...
        </div>
      </CardContent>
    </Card>
  )
}