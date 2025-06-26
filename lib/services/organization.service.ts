import { prisma } from '@/lib/prisma'
import type { Organization, Department, UserOrganization, UserDepartment, User, UserProfile } from '@prisma/client'

// 定义包含关联关系的组织类型
type OrganizationWithRelations = Organization & {
  users?: (UserOrganization & {
    user: User & {
      profile?: UserProfile | null
    }
  })[]
  departments?: DepartmentWithRelations[]
}

// 定义包含关联关系的部门类型
type DepartmentWithRelations = Department & {
  users?: (UserDepartment & {
    user: User & {
      profile?: UserProfile | null
    }
  })[]
  children?: DepartmentWithRelations[]
}

// 组织架构节点类型
export interface OrganizationNode {
  id: string
  name: string
  memberCount: number
  type: 'company' | 'department' | 'team'
  children?: OrganizationNode[]
  isExpanded?: boolean
  code?: string
  description?: string
  level?: number
  parentId?: string
}

/**
 * 组织架构服务
 * 
 * 提供以下功能：
 * - getOrganizationTree() - 获取完整的组织架构树
 * - getOrganizationById() - 根据组织ID获取组织架构
 * - buildOrganizationNode() - 构建组织节点
 * - calculateDepartmentUserCount() - 计算部门用户数量
 * - getOrganizationMembers() - 获取组织成员列表
 * - getOrganizations() - 获取组织列表
 * - createOrganization() - 创建组织
 * - updateOrganization() - 更新组织信息
 * - deleteOrganization() - 软删除组织
 */
export const organizationService = {
  /**
   * 获取完整的组织架构树
   * 
   * @description 获取所有激活状态的组织，并构建完整的组织架构树结构
   * @returns {Promise<OrganizationNode[]>} 组织架构树数组
   * @example
   * const orgTree = await organizationService.getOrganizationTree()
   * console.log(orgTree) // [{ id: '1', name: '总公司', type: 'company', ... }]
   */
  async getOrganizationTree(): Promise<OrganizationNode[]> {
    // 获取所有组织
    const organizations = await prisma.organization.findMany({
      where: {
        active: true
      },
      include: {
        departments: {
          where: {
            active: true
          },
          include: {
            users: {
              include: {
                user: true
              }
            },
            children: {
              where: {
                active: true
              },
              include: {
                users: {
                  include: {
                    user: true
                  }
                },
                children: {
                  where: {
                    active: true
                  },
                  include: {
                    users: {
                      include: {
                        user: true
                      }
                    },
                    children: {
                      where: {
                        active: true
                      },
                      include: {
                        users: {
                          include: {
                            user: true
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        users: {
          include: {
            user: true
          }
        }
      },
      orderBy: {
        sortOrder: 'asc'
      }
    })

    // 构建组织架构树
    return organizations.map(org => this.buildOrganizationNode(org))
  },

  /**
   * 根据组织ID获取组织架构
   * 
   * @description 根据指定的组织ID获取单个组织的详细信息和架构
   * @param {string} organizationId - 组织ID
   * @returns {Promise<OrganizationNode | null>} 组织节点对象，如果不存在则返回null
   * @example
   * const org = await organizationService.getOrganizationById('org-123')
   * if (org) {
   *   console.log(org.name) // '技术部'
   * }
   */
  async getOrganizationById(organizationId: string): Promise<OrganizationNode | null> {
    const organization = await prisma.organization.findUnique({
      where: {
        id: organizationId,
        active: true
      },
      include: {
        departments: {
          where: {
            active: true
          },
          include: {
            users: {
              include: {
                user: true
              }
            },
            children: {
              where: {
                active: true
              },
              include: {
                users: {
                  include: {
                    user: true
                  }
                }
              }
            }
          }
        },
        users: {
          include: {
            user: true
          }
        }
      }
    })

    if (!organization) return null

    return this.buildOrganizationNode(organization)
  },

  /**
   * 构建组织节点
   * 
   * @description 将数据库查询结果转换为前端需要的组织节点格式
   * @param {any} organization - 数据库查询的组织对象（包含用户和部门信息）
   * @returns {OrganizationNode} 格式化的组织节点对象
   * @example
   * const orgNode = organizationService.buildOrganizationNode(dbOrganization)
   * console.log(orgNode.memberCount) // 25
   */
  buildOrganizationNode(organization: OrganizationWithRelations): OrganizationNode {
    // 计算组织下的总人数（包括直接用户和部门用户）
    const directUserCount = organization.users?.length || 0
    const departmentUserCount = organization.departments?.reduce((total: number, dept: DepartmentWithRelations) => {
      return total + this.calculateDepartmentUserCount(dept)
    }, 0) || 0

    const totalMemberCount = directUserCount + departmentUserCount

    // 构建部门子节点
    const departmentChildren = organization.departments
      ?.filter((dept: DepartmentWithRelations) => !dept.parentId) // 只获取顶级部门
      ?.map((dept: DepartmentWithRelations) => this.buildDepartmentNode(dept)) || []

    return {
      id: organization.id,
      name: organization.name,
      memberCount: totalMemberCount,
      type: 'company',
      code: organization.code,
      description: organization.description || undefined,
      level: organization.level,
      children: departmentChildren,
      isExpanded: true
    }
  },

  /**
   * 构建部门节点
   * 
   * @description 将数据库查询的部门对象转换为前端需要的部门节点格式
   * @param {any} department - 数据库查询的部门对象（包含用户和子部门信息）
   * @returns {OrganizationNode} 格式化的部门节点对象
   */
  buildDepartmentNode(department: DepartmentWithRelations): OrganizationNode {
    const memberCount = this.calculateDepartmentUserCount(department)

    // 构建子部门节点
    const childDepartments = department.children
      ?.map((child: DepartmentWithRelations) => this.buildDepartmentNode(child)) || []

    // 判断节点类型：如果有子部门则为department，否则为team
    const nodeType = childDepartments.length > 0 ? 'department' : 'team'

    return {
      id: department.id,
      name: department.name,
      memberCount,
      type: nodeType,
      code: department.code,
      description: department.description || undefined,
      level: department.level,
      parentId: department.parentId || undefined,
      children: childDepartments.length > 0 ? childDepartments : undefined,
      isExpanded: false
    }
  },

  /**
   * 计算部门用户数量（包括子部门）
   * 
   * @description 递归计算部门及其所有子部门的用户总数，仅用于组织节点构建
   * @param {any} department - 部门对象（包含用户和子部门信息）
   * @returns {number} 部门及子部门的用户总数
   * @example
   * const userCount = organizationService.calculateDepartmentUserCount(department)
   * console.log(userCount) // 15
   */
  calculateDepartmentUserCount(department: DepartmentWithRelations): number {
    const directUsers = department.users?.length || 0
    const childUsers = department.children?.reduce((total: number, child: DepartmentWithRelations) => {
      return total + this.calculateDepartmentUserCount(child)
    }, 0) || 0

    return directUsers + childUsers
  },

  /**
   * 获取组织成员列表
   *
   * @description 获取指定组织下的所有成员，支持分页、搜索和部门筛选
   * @param {string} organizationId - 组织ID
   * @param {Object} options - 查询选项
   * @param {string} [options.departmentId] - 部门ID，用于筛选特定部门的成员
   * @param {number} [options.page=1] - 页码
   * @param {number} [options.limit=50] - 每页数量
   * @param {string} [options.search] - 搜索关键词（姓名、邮箱、手机号）
   * @returns {Promise<{users: Array, pagination: Object}>} 成员列表和分页信息
   * @example
   * const result = await organizationService.getOrganizationMembers('org-123', {
   *   page: 1,
   *   limit: 20,
   *   search: '张三'
   * })
   * console.log(result.users.length) // 成员数量
   * console.log(result.pagination.total) // 总数
   */
  async getOrganizationMembers(organizationId: string, options: {
    departmentId?: string
    page?: number
    limit?: number
    search?: string
  } = {}) {
    const { departmentId, page = 1, limit = 50, search } = options

    // 构建查询条件
    const whereConditions: Record<string, unknown> = {
      OR: [
        // 直接属于组织的用户
        {
          organizations: {
            some: {
              organizationId: organizationId
            }
          }
        },
        // 属于组织下部门的用户
        {
          departments: {
            some: {
              department: {
                organizationId: organizationId,
                active: true
              }
            }
          }
        }
      ],
      deletedAt: null
    }

    // 如果指定了部门，则只获取该部门的用户
    if (departmentId) {
      whereConditions.departments = {
        some: {
          departmentId: departmentId
        }
      }
      delete whereConditions.OR
    }

    // 搜索条件
    if (search) {
      whereConditions.OR = [
        {
          email: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          phone: {
            contains: search
          }
        },
        {
          profile: {
            name: {
              contains: search,
              mode: 'insensitive'
            }
          }
        }
      ]
    }

    // 获取用户总数
    const totalUsers = await prisma.user.count({
      where: whereConditions
    })

    // 获取用户列表
    const users = await prisma.user.findMany({
      where: whereConditions,
      include: {
        profile: true,
        roles: {
          include: {
            role: true
          }
        },
        departments: {
          include: {
            department: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit
    })

    return {
      users: users.map(user => ({
        id: user.id,
        name: user.profile?.name || user.email,
        email: user.email,
        phone: user.phone || '',
        avatar: user.profile?.avatar || '',
        department: user.departments?.[0]?.department?.name || '未分配部门',
        departmentId: user.departments?.[0]?.department?.id || null,
        roles: user.roles?.map(userRole => userRole.role.name) || [],
        status: user.active ? 'active' : 'inactive'
      })),
      pagination: {
        page,
        limit,
        total: totalUsers,
        totalPages: Math.ceil(totalUsers / limit)
      }
    }
  },

  /**
   * 获取组织列表
   * 
   * @description 获取所有激活状态的组织列表，包含用户和部门信息
   * @returns {Promise<Array>} 组织列表数组
   * @example
   * const organizations = await organizationService.getOrganizations()
   * organizations.forEach(org => {
   *   console.log(`${org.name}: ${org.users.length}人`)
   * })
   */
  async getOrganizations() {
    return await prisma.organization.findMany({
      where: {
        active: true
      },
      include: {
        users: {
          include: {
            user: true
          }
        },
        departments: {
          where: {
            active: true
          },
          include: {
            users: {
              include: {
                user: true
              }
            }
          }
        }
      },
      orderBy: {
        sortOrder: 'asc'
      }
    })
  },

  /**
   * 创建组织
   * 
   * @description 创建新的组织，自动生成编码和计算层级
   * @param {Object} organizationData - 组织数据
   * @param {string} organizationData.name - 组织名称（必填）
   * @param {string} [organizationData.code] - 组织编码，不提供则自动生成
   * @param {string} [organizationData.description] - 组织描述
   * @param {string|null} [organizationData.parentId] - 父组织ID，null表示顶级组织
   * @returns {Promise<OrganizationNode>} 创建的组织节点对象
   * @throws {Error} 当组织编码已存在或父组织不存在时抛出错误
   * @example
   * const newOrg = await organizationService.createOrganization({
   *   name: '研发中心',
   *   description: '负责产品研发',
   *   parentId: 'parent-org-id'
   * })
   * console.log(newOrg.id) // 新组织ID
   */
  async createOrganization(organizationData: {
    name: string
    code?: string
    description?: string
    parentId?: string | null
  }) {
    // 生成组织编码（如果没有提供）
    let code = organizationData.code
    if (!code) {
      const timestamp = Date.now().toString().slice(-6)
      code = `ORG_${timestamp}`
    }

    // 检查组织编码是否已存在
    const existingOrg = await prisma.organization.findUnique({
      where: { code }
    })

    if (existingOrg) {
      throw new Error('组织编码已存在')
    }

    // 计算层级
    let level = 1
    if (organizationData.parentId) {
      const parentOrg = await prisma.organization.findUnique({
        where: { id: organizationData.parentId },
        select: { level: true }
      })

      if (!parentOrg) {
        throw new Error('父组织不存在')
      }

      level = parentOrg.level + 1
    }

    // 创建组织
    const newOrganization = await prisma.organization.create({
      data: {
        name: organizationData.name,
        code,
        description: organizationData.description || '',
        parentId: organizationData.parentId || null,
        level,
        sortOrder: 0,
        active: true
      },
      include: {
        parent: true,
        users: {
          include: {
            user: true
          }
        }
      }
    })

    return {
      id: newOrganization.id,
      name: newOrganization.name,
      memberCount: newOrganization.users?.length || 0,
      type: 'company' as const,
      code: newOrganization.code,
      description: newOrganization.description,
      level: newOrganization.level,
      parentId: newOrganization.parentId
    }
  },

  /**
   * 更新组织信息
   * 
   * @description 更新指定组织的信息，支持修改父组织（会自动重新计算层级）
   * @param {string} organizationId - 要更新的组织ID
   * @param {Object} organizationData - 更新的组织数据
   * @param {string} [organizationData.name] - 组织名称
   * @param {string} [organizationData.description] - 组织描述
   * @param {string} [organizationData.parentId] - 父组织ID
   * @param {string} [organizationData.code] - 组织编码
   * @returns {Promise<OrganizationNode>} 更新后的组织节点对象
   * @throws {Error} 当组织不存在或父组织不存在时抛出错误
   * @example
   * const updatedOrg = await organizationService.updateOrganization('org-123', {
   *   name: '新名称',
   *   description: '新描述'
   * })
   * console.log(updatedOrg.name) // '新名称'
   */
  async updateOrganization(organizationId: string, organizationData: {
    name?: string
    description?: string
    parentId?: string
    code?: string
  }) {
    // 检查组织是否存在
    const existingOrganization = await prisma.organization.findUnique({
      where: { id: organizationId, active: true }
    })

    if (!existingOrganization) {
      throw new Error('组织不存在')
    }

    // 如果更新了父组织，需要重新计算层级
    let level = existingOrganization.level

    if (organizationData.parentId !== undefined && organizationData.parentId !== existingOrganization.parentId) {
      if (organizationData.parentId) {
        const parentOrganization = await prisma.organization.findUnique({
          where: { id: organizationData.parentId },
          select: { level: true }
        })

        if (!parentOrganization) {
          throw new Error('父组织不存在')
        }

        level = parentOrganization.level + 1
      } else {
        level = 1
      }
    }

    // 更新组织
    const updatedOrganization = await prisma.organization.update({
      where: { id: organizationId },
      data: {
        ...(organizationData.name && { name: organizationData.name }),
        ...(organizationData.description !== undefined && { description: organizationData.description }),
        ...(organizationData.parentId !== undefined && { parentId: organizationData.parentId }),
        ...(organizationData.code && { code: organizationData.code }),
        level
      },
      include: {
        parent: true,
        users: {
          include: {
            user: {
              include: {
                profile: true
              }
            }
          }
        }
      }
    })

    return {
      id: updatedOrganization.id,
      name: updatedOrganization.name,
      description: updatedOrganization.description,
      type: 'company' as const,
      code: updatedOrganization.code,
      level: updatedOrganization.level,
      parentId: updatedOrganization.parentId,
      memberCount: updatedOrganization.users?.length || 0
    }
  },

  /**
   * 软删除组织
   * 
   * @description 软删除指定组织（设置active为false），删除前会检查是否有子组织、部门或用户
   * @param {string} organizationId - 要删除的组织ID
   * @returns {Promise<{success: boolean, message: string}>} 删除结果
   * @throws {Error} 当组织不存在、有子组织、有部门或有用户时抛出错误
   * @example
   * try {
   *   const result = await organizationService.deleteOrganization('org-123')
   *   console.log(result.message) // '组织删除成功'
   * } catch (error) {
   *   console.error(error.message) // '该组织下还有部门，无法删除'
   * }
   */
  async deleteOrganization(organizationId: string) {
    // 检查组织是否存在
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId, active: true },
      include: {
        children: {
          where: { active: true }
        },
        departments: {
          where: { active: true }
        },
        users: true
      }
    })

    if (!organization) {
      throw new Error('组织不存在')
    }

    // 检查是否有子组织
    if (organization.children && organization.children.length > 0) {
      throw new Error('该组织下还有子组织，无法删除')
    }

    // 检查是否有部门
    if (organization.departments && organization.departments.length > 0) {
      throw new Error('该组织下还有部门，无法删除')
    }

    // 检查是否有用户
    if (organization.users && organization.users.length > 0) {
      throw new Error('该组织下还有用户，无法删除')
    }

    // 软删除组织
    await prisma.organization.update({
      where: { id: organizationId },
      data: { active: false }
    })

    return { success: true, message: '组织删除成功' }
  }
}