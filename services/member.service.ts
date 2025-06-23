/**
 * 成员相关的API服务
 */
import { Member } from '@/types/member'

export class MemberService {
  /**
   * 获取组织成员列表
   */
  static async fetchOrganizationMembers(organizationId?: string): Promise<Member[]> {
    try {
      const url = organizationId
        ? `/api/organization/${organizationId}/members`
        : '/api/organization/members'
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch organization members')
      }
      const data = await response.json()
      return data.data?.members || []
    } catch (error) {
      console.error('Error fetching organization members:', error)
      return []
    }
  }

  /**
   * 获取部门成员列表
   */
  static async fetchDepartmentMembers(departmentId: string): Promise<Member[]> {
    try {
      const response = await fetch(`/api/departments/${departmentId}/members`)
      if (!response.ok) {
        throw new Error('Failed to fetch department members')
      }
      const data = await response.json()
      return data.data?.members || []
    } catch (error) {
      console.error('Error fetching department members:', error)
      return []
    }
  }

  /**
   * 更新成员信息
   */
  static async updateMember(memberId: number, memberData: Partial<Member>): Promise<Member> {
    try {
      const response = await fetch(`/api/users/${memberId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(memberData),
      })
      if (!response.ok) {
        throw new Error('Failed to update member')
      }
      const data = await response.json()
      return data.data
    } catch (error) {
      console.error('Error updating member:', error)
      throw error
    }
  }

  /**
   * 删除成员
   */
  static async deleteMember(memberId: number): Promise<void> {
    try {
      const response = await fetch(`/api/users/${memberId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error('Failed to delete member')
      }
    } catch (error) {
      console.error('Error deleting member:', error)
      throw error
    }
  }

  /**
   * 批量删除成员
   */
  static async batchDeleteMembers(memberIds: number[]): Promise<void> {
    try {
      const response = await fetch('/api/users/batch-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userIds: memberIds }),
      })
      if (!response.ok) {
        throw new Error('Failed to batch delete members')
      }
    } catch (error) {
      console.error('Error batch deleting members:', error)
      throw error
    }
  }

  /**
   * 导出成员数据
   */
  static async exportMembers(memberIds?: number[]): Promise<Blob> {
    try {
      const response = await fetch('/api/users/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userIds: memberIds }),
      })
      if (!response.ok) {
        throw new Error('Failed to export members')
      }
      return await response.blob()
    } catch (error) {
      console.error('Error exporting members:', error)
      throw error
    }
  }

  /**
   * 导入成员数据
   */
  static async importMembers(file: File): Promise<void> {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/users/import', {
        method: 'POST',
        body: formData,
      })
      if (!response.ok) {
        throw new Error('Failed to import members')
      }
    } catch (error) {
      console.error('Error importing members:', error)
      throw error
    }
  }
}