/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-06-23 00:04:35
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-06-23 00:05:10
 * @FilePath: /lulab_dashboard/types/member.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */
export type MemberStatus = "active" | "inactive" | "pending"
export type AccountStatus = "正常" | "未设置"

export interface Member {
  id: number
  name: string
  phone: string
  countryCode: string
  department: string
  position: string
  status: MemberStatus
  accountStatus: AccountStatus
  email: string
  avatar: string
}

export interface OrganizationNode {
  id: string
  name: string
  memberCount: number
  type: 'company' | 'department' | 'team'
  children?: OrganizationNode[]
  isExpanded?: boolean
}