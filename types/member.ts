/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-06-23 00:04:35
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-06-26 14:41:47
 * @FilePath: /lulab_dashboard/types/member.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */
export type MemberStatus = "active" | "inactive" | "pending"
export type AccountStatus = "正常" | "未设置"

export interface Member {
  id: number
  avatar: string
  name: string
  phone: string
  countryCode: string
  department: string
  position: string
  status: MemberStatus
  accountStatus: AccountStatus
  email: string
}

export interface DepartmentNode {
  id: string
  name: string
  memberCount: number
  type: 'company' | 'department' | 'team'
  children?: DepartmentNode[]
  isExpanded?: boolean
  code?: string
  description?: string
  level?: number
  parentId?: string
  logo?: string
}