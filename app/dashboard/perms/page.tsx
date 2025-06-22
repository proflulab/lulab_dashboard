
'use client'

/*
 * 权限管理页面
 * 用于管理用户权限、角色和组织结构
 */

import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PermissionGuard } from '@/components/auth/permission-guard'
import { usePermission, useUserPermissions } from '@/hooks/use-permission'
import { UserManagement } from '@/components/dashboard/perms/user-management'
import { RoleManagement } from '@/components/dashboard/perms/role-management'
import { PermissionManagement } from '@/components/dashboard/perms/permission-management'
import { OrganizationManagement } from '@/components/dashboard/perms/organization-management'
import { Shield } from 'lucide-react'

/**
 * 权限管理主页面
 */

export default function PermissionsPage() {
  const { loading } = useUserPermissions()
  const { hasPermission: canManagePermissions } = usePermission('permissions.manage')
  const { hasPermission: canManageUsers } = usePermission('users.manage')
  const { hasPermission: canManageRoles } = usePermission('roles.manage')

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTab, setSelectedTab] = useState('users')

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <PermissionGuard
      permission="permissions.view"
      fallback={
        <Alert variant="destructive" className="m-6">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            您没有权限访问权限管理页面
          </AlertDescription>
        </Alert>
      }
    >
      <div className="container mx-auto p-6 space-y-6">
        {/* 主要内容区域 */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">用户管理</TabsTrigger>
            <TabsTrigger value="roles">角色管理</TabsTrigger>
            <TabsTrigger value="permissions">权限管理</TabsTrigger>
            <TabsTrigger value="organizations">组织管理</TabsTrigger>
          </TabsList>

          {/* 用户管理 */}
          <TabsContent value="users" className="space-y-4">
            <UserManagement
              canManage={canManageUsers}
              searchTerm={searchTerm}
            />
          </TabsContent>

          {/* 角色管理 */}
          <TabsContent value="roles" className="space-y-4">
            <RoleManagement
              canManage={canManageRoles}
              searchTerm={searchTerm}
            />
          </TabsContent>

          {/* 权限管理 */}
          <TabsContent value="permissions" className="space-y-4">
            <PermissionManagement
              canManage={canManagePermissions}
              searchTerm={searchTerm}
            />
          </TabsContent>

          {/* 组织管理 */}
          <TabsContent value="organizations" className="space-y-4">
            <OrganizationManagement
              canManage={canManagePermissions}
              searchTerm={searchTerm}
            />
          </TabsContent>
        </Tabs>
      </div>
    </PermissionGuard>
  )
}