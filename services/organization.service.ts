/**
 * 组织架构相关的API服务
 */
import { OrganizationNode } from '@/types/member'

export class OrganizationService {
  /**
   * 获取组织架构树
   */
  static async fetchOrganizationTree(): Promise<OrganizationNode[]> {
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
  }): Promise<OrganizationNode> {
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
  ): Promise<OrganizationNode> {
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
  static async getDepartmentDetail(departmentId: string): Promise<OrganizationNode> {
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