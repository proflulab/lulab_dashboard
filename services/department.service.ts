/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-06-24 15:52:27
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-06-24 17:01:31
 * @FilePath: /lulab_dashboard/services/department.service.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */

import { DepartmentNode } from '@/types/member'

export class DepartmentService {

    /**
       * 更新部门信息
       */
    static async updateDepartment(
        departmentId: string,
        departmentData: Partial<{
            name: string
            description: string
            parentId: string
        }>
    ): Promise<DepartmentNode> {
        try {
            const response = await fetch(`/api/departments/${departmentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(departmentData),
            })
            if (!response.ok) {
                throw new Error('Failed to update department')
            }
            const data = await response.json()
            return data.data
        } catch (error) {
            console.error('Error updating department:', error)
            throw error
        }
    }

    /**
     * 删除部门
     */
    static async deleteDepartment(departmentId: string): Promise<void> {
        try {
            const response = await fetch(`/api/departments/${departmentId}`, {
                method: 'DELETE',
            })
            if (!response.ok) {
                throw new Error('Failed to delete department')
            }
        } catch (error) {
            console.error('Error deleting department:', error)
            throw error
        }
    }

    /**
     * 移动部门到新的父级
     */
    static async moveDepartment(
        departmentId: string,
        newParentId: string
    ): Promise<void> {
        try {
            const response = await fetch(`/api/departments/${departmentId}/move`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ parentId: newParentId }),
            })
            if (!response.ok) {
                throw new Error('Failed to move department')
            }
        } catch (error) {
            console.error('Error moving department:', error)
            throw error
        }
    }

    /**
     * 获取部门详情
     */
    static async getDepartmentDetail(departmentId: string): Promise<DepartmentNode> {
        try {
            const response = await fetch(`/api/departments/${departmentId}`)
            if (!response.ok) {
                throw new Error('Failed to fetch department detail')
            }
            const data = await response.json()
            return data.data
        } catch (error) {
            console.error('Error fetching department detail:', error)
            throw error
        }
    }
}