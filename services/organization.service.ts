/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-06-23 00:21:43
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-06-25 06:30:31
 * @FilePath: /lulab_dashboard/services/organization.service.ts
 * @Description: 组织架构相关的API服务
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */

import { DepartmentNode } from '@/types/member'

export class OrganizationService {
  /**
   * 获取组织架构树
   */
  static async fetchOrganizationTree(): Promise<DepartmentNode[]> {
    try {
      const response = await fetch('/api/organization/tree')
      if (!response.ok) {
        throw new Error('Failed to fetch organization tree')
      }
      const data = await response.json()
      return data.data || []
    } catch (error) {
      console.error('Error fetching organization tree:', error)
      return []
    }
  }

  /**
   * 创建新部门
   */
  static async createDepartment(departmentData: {
    name: string
    description?: string
    parentId?: string
    type?: string
    code?: string
    responsiblePerson?: string
    contactInfo?: string
  }): Promise<DepartmentNode> {
    try {
      const response = await fetch('/api/departments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(departmentData),
      })
      if (!response.ok) {
        throw new Error('Failed to create department')
      }
      const data = await response.json()
      return data.data
    } catch (error) {
      console.error('Error creating department:', error)
      throw error
    }
  }
}