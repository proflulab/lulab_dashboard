/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-06-24 14:13:26
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-06-24 14:14:03
 * @FilePath: /lulab_dashboard/app/dashboard/contacts/role/page.tsx
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */
"use client"

import React, { useState } from "react"
import { Shield } from "lucide-react"
import { Input } from "@/components/ui/input"
import { RoleManagement } from "@/components/dashboard/contacts/roles/role-management"
import { usePermission } from "@/hooks/use-permission"

export default function RolePage() {
  const [searchTerm, setSearchTerm] = useState("")
  const { hasPermission: canManage } = usePermission("roles.manage")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Shield className="h-6 w-6" />
          <h1 className="text-2xl font-bold">角色管理</h1>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <Input
          placeholder="搜索角色..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <RoleManagement canManage={canManage} searchTerm={searchTerm} />
    </div>
  )
}