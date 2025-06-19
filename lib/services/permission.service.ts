/*
 * 权限服务类
 * 提供完整的权限验证和管理功能
 */

import { prisma } from '@/lib/prisma'
import { User } from '@prisma/client'

// 本地类型定义，避免直接导入Prisma生成的类型
interface Role {
  id: string
  code: string
  name: string
  description?: string | null
  level: number
  active: boolean
  createdAt: Date
  updatedAt: Date
}

interface Permission {
  id: string
  code: string
  name: string
  description?: string | null
  resource?: string | null
  action?: string | null
  level?: number | null
  parentId?: string | null
  active: boolean
  createdAt: Date
  updatedAt: Date
}

interface Organization {
  id: string
  code: string
  name: string
  description?: string | null
  parentId?: string | null
  level: number
  active: boolean
  createdAt: Date
  updatedAt: Date
}

interface Department {
  id: string
  code: string
  name: string
  description?: string | null
  organizationId: string
  active: boolean
  createdAt: Date
  updatedAt: Date
}

// 权限验证结果接口
interface PermissionCheckResult {
  hasPermission: boolean
  reason?: string
  level?: number
}

// 用户权限信息接口
interface UserPermissionInfo {
  user: User
  organizations: Organization[]
  departments: Department[]
  roles: Role[]
  permissions: Permission[]
  dataPermissions: string[]
}

export class PermissionService {
  /**
   * 获取用户完整权限信息
   */
  static async getUserPermissionInfo(userId: string): Promise<UserPermissionInfo | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        organizations: {
          include: {
            organization: true
          }
        },
        departments: {
          include: {
            department: {
              include: {
                organization: true
              }
            }
          }
        },
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        },
        permissions: {
          include: {
            permission: true
          }
        },
        dataPermissions: {
          include: {
            rule: true
          },
          where: {
            granted: true
          }
        }
      }
    }) as User & {
      organizations?: Array<{ organization: Organization }>
      departments?: Array<{ department: Department }>
      roles?: Array<{ role: Role & { permissions?: Array<{ permission: Permission }> } }>
      permissions?: Array<{ permission: Permission; granted: boolean }>
      dataPermissions?: Array<{ rule: { code: string } }>
    };

    if (!user) return null

    // 提取组织信息
    const userOrganizations = user.organizations?.map((uo) => uo.organization) || []

    // 提取部门信息
    const userDepartments = user.departments?.map((ud) => ud.department) || []

    // 提取角色信息
    const userRoles = user.roles?.map((ur) => ur.role) || []

    // 提取角色权限
    const rolePermissions = user.roles?.flatMap((ur) =>
      ur.role.permissions?.map((rp) => rp.permission) || []
    ) || []

    // 提取直接权限
    const directPermissions = user.permissions
      ?.filter((up) => up.granted)
      ?.map((up) => up.permission) || []

    // 合并所有权限
    const allPermissions = [...rolePermissions, ...directPermissions]

    // 合并去重权限
    const uniquePermissions = allPermissions.filter((permission, index, self) =>
      index === self.findIndex(p => p.id === permission.id)
    )

    // 提取数据权限规则
    const dataPermissions = user.dataPermissions?.map((udp) => udp.rule.code) || []

    return {
      user,
      organizations: userOrganizations,
      departments: userDepartments,
      roles: userRoles,
      permissions: uniquePermissions,
      dataPermissions
    }
  }

  /**
   * 检查用户是否有指定权限
   */
  static async checkPermission(
    userId: string,
    permissionCode: string
  ): Promise<PermissionCheckResult> {
    const userInfo = await this.getUserPermissionInfo(userId)

    if (!userInfo) {
      return { hasPermission: false, reason: '用户不存在' }
    }

    // 检查用户是否激活
    if (!userInfo.user.active) {
      return { hasPermission: false, reason: '用户已被禁用' }
    }

    // 超级管理员拥有所有权限
    const hasAdminRole = userInfo.roles.some(role => role.code === 'ADMIN')
    if (hasAdminRole) {
      return { hasPermission: true, level: 0 }
    }

    // 检查权限
    const hasPermission = userInfo.permissions.some(p => p.code === permissionCode && p.active)

    if (hasPermission) {
      const permission = userInfo.permissions.find(p => p.code === permissionCode)
      return { hasPermission: true, level: permission?.level ?? undefined }
    }

    return { hasPermission: false, reason: '权限不足' }
  }

  /**
   * 检查用户是否有访问指定资源的权限
   */
  static async checkResourceAccess(
    userId: string,
    resource: string,
    action: string = 'read'
  ): Promise<PermissionCheckResult> {
    const userInfo = await this.getUserPermissionInfo(userId)

    if (!userInfo) {
      return { hasPermission: false, reason: '用户不存在' }
    }

    // 超级管理员拥有所有权限
    const hasAdminRole = userInfo.roles.some(role => role.code === 'ADMIN')
    if (hasAdminRole) {
      return { hasPermission: true, level: 0 }
    }

    // 检查资源权限
    const hasAccess = userInfo.permissions.some(p =>
      p.resource === resource &&
      (p.action === action || p.action === '*') &&
      p.active
    )

    return { hasPermission: hasAccess, reason: hasAccess ? undefined : '无访问权限' }
  }

  /**
   * 检查用户角色级别
   */
  static async checkRoleLevel(userId: string, requiredLevel: number): Promise<PermissionCheckResult> {
    const userInfo = await this.getUserPermissionInfo(userId)

    if (!userInfo) {
      return { hasPermission: false, reason: '用户不存在' }
    }

    // 获取用户最高角色级别（数字越小级别越高）
    const userLevel = Math.min(...userInfo.roles.map(r => r.level))

    const hasPermission = userLevel <= requiredLevel

    return {
      hasPermission,
      level: userLevel,
      reason: hasPermission ? undefined : '角色级别不足'
    }
  }

  /**
   * 检查用户是否属于指定组织
   */
  static async checkOrganization(userId: string, organizationCode: string): Promise<boolean> {
    const userInfo = await this.getUserPermissionInfo(userId)

    if (!userInfo) return false

    return userInfo.organizations.some(org => org.code === organizationCode && org.active)
  }

  /**
   * 检查用户是否属于指定部门
   */
  static async checkDepartment(userId: string, departmentCode: string): Promise<boolean> {
    const userInfo = await this.getUserPermissionInfo(userId)

    if (!userInfo) return false

    return userInfo.departments.some(dept => dept.code === departmentCode && dept.active)
  }

  /**
   * 获取用户可访问的菜单权限
   */
  static async getUserMenuPermissions(userId: string): Promise<string[]> {
    const userInfo = await this.getUserPermissionInfo(userId)

    if (!userInfo) return []

    // 过滤菜单类型权限
    return userInfo.permissions
      .filter((p) => p.resource === 'MENU' && p.active)
      .map((p) => p.code)
  }

  /**
   * 获取用户数据权限过滤条件
   */
  static async getDataPermissionFilters(userId: string, resource: string): Promise<unknown[]> {
    const userInfo = await this.getUserPermissionInfo(userId)

    if (!userInfo) return []

    // 超级管理员无数据权限限制
    const hasAdminRole = userInfo.roles.some(role => role.code === 'ADMIN')
    if (hasAdminRole) {
      return []
    }

    // 获取用户的数据权限规则
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        dataPermissions: {
          include: {
            rule: true
          },
          where: {
            granted: true,
            rule: {
              resource: resource,
              active: true
            }
          }
        },
        roles: {
          include: {
            role: {
              include: {
                dataPermissions: {
                  include: {
                    rule: true
                  },
                  where: {
                    rule: {
                      resource: resource,
                      active: true
                    }
                  }
                }
              }
            }
          }
        }
      }
    }) as unknown as User & {
      dataPermissions?: Array<{ rule: { id: string; code: string; name: string; condition: string } }>
      roles?: Array<{ role: { dataPermissions?: Array<{ rule: { id: string; code: string; name: string; condition: string } }> } }>
    }

    if (!user) return []

    // 合并用户和角色的数据权限规则
    const userRules = user.dataPermissions?.map((udp) => udp.rule) || []
    const roleRules = user.roles?.flatMap((ur) =>
      ur.role.dataPermissions?.map((rdp) => rdp.rule) || []
    ) || []

    const allRules = [...userRules, ...roleRules]
    const uniqueRules = allRules.filter((rule, index, self) =>
      index === self.findIndex(r => r.id === rule.id)
    )

    // 解析权限条件
    return uniqueRules.map(rule => {
      try {
        return JSON.parse(rule.condition)
      } catch {
        return {}
      }
    })
  }

  /**
   * 批量检查权限
   */
  static async checkMultiplePermissions(
    userId: string,
    permissionCodes: string[]
  ): Promise<Record<string, PermissionCheckResult>> {
    const results: Record<string, PermissionCheckResult> = {}

    for (const code of permissionCodes) {
      results[code] = await this.checkPermission(userId, code)
    }

    return results
  }

  /**
   * 获取用户权限树（用于前端菜单渲染）
   */
  static async getUserPermissionTree(userId: string): Promise<Permission[]> {
    const permissionCodes = await this.getUserMenuPermissions(userId)

    if (permissionCodes.length === 0) return []

    // 根据权限代码获取完整的权限对象
    const permissions = await prisma.permission.findMany({
      where: {
        code: {
          in: permissionCodes
        },
        active: true
      },
      orderBy: {
        sortOrder: 'asc'
      }
    })

    // 构建权限树结构
    const permissionMap = new Map<string, Permission & { children: Permission[] }>()
    const rootPermissions: (Permission & { children: Permission[] })[] = []

    // 初始化权限映射
    permissions.forEach((permission: Permission) => {
      permissionMap.set(permission.id, { ...permission, children: [] })
    })

    // 构建树结构
    permissions.forEach((permission: Permission) => {
      const permissionWithChildren = permissionMap.get(permission.id)!

      if (permission.parentId && permissionMap.has(permission.parentId)) {
        const parent = permissionMap.get(permission.parentId)!
        parent.children.push(permissionWithChildren)
      } else {
        rootPermissions.push(permissionWithChildren)
      }
    })

    // 排序
    const sortPermissions = (perms: Array<Permission & { children?: Array<Permission & { children?: unknown }> }>) => {
      perms.sort((a, b) => (a.level || 0) - (b.level || 0))
      perms.forEach(perm => {
        if (perm.children && perm.children.length > 0) {
          sortPermissions(perm.children as Array<Permission & { children?: Array<Permission & { children?: unknown }> }>)
        }
      })
    }

    sortPermissions(rootPermissions)

    return rootPermissions as Permission[]
  }
}