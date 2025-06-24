import { prisma } from '@/lib/prisma'

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

// 组织架构服务
export const organizationService = {
  /**
   * 获取完整的组织架构树
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
   * 获取部门架构树
   */
  async getDepartmentTree(organizationId?: string): Promise<OrganizationNode[]> {
    const whereClause = organizationId ? {
      organizationId,
      active: true,
      parentId: null // 只获取顶级部门
    } : {
      active: true,
      parentId: null
    }

    const departments = await prisma.department.findMany({
      where: whereClause,
      include: {
        organization: true,
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
      },
      orderBy: {
        sortOrder: 'asc'
      }
    })

    return departments.map(dept => this.buildDepartmentNode(dept))
  },

  /**
   * 构建组织节点
   */
  buildOrganizationNode(organization: any): OrganizationNode {
    // 计算组织下的总人数（包括直接用户和部门用户）
    const directUserCount = organization.users?.length || 0
    const departmentUserCount = organization.departments?.reduce((total: number, dept: any) => {
      return total + this.calculateDepartmentUserCount(dept)
    }, 0) || 0

    const totalMemberCount = directUserCount + departmentUserCount

    // 构建部门子节点
    const departmentChildren = organization.departments
      ?.filter((dept: any) => !dept.parentId) // 只获取顶级部门
      ?.map((dept: any) => this.buildDepartmentNode(dept)) || []

    return {
      id: organization.id,
      name: organization.name,
      memberCount: totalMemberCount,
      type: 'company',
      code: organization.code,
      description: organization.description,
      level: organization.level,
      children: departmentChildren,
      isExpanded: true
    }
  },

  /**
   * 构建部门节点
   */
  buildDepartmentNode(department: any): OrganizationNode {
    const memberCount = this.calculateDepartmentUserCount(department)

    // 构建子部门节点
    const childDepartments = department.children
      ?.map((child: any) => this.buildDepartmentNode(child)) || []

    // 判断节点类型：如果有子部门则为department，否则为team
    const nodeType = childDepartments.length > 0 ? 'department' : 'team'

    return {
      id: department.id,
      name: department.name,
      memberCount,
      type: nodeType,
      code: department.code,
      description: department.description,
      level: department.level,
      parentId: department.parentId,
      children: childDepartments.length > 0 ? childDepartments : undefined,
      isExpanded: false
    }
  },

  /**
   * 计算部门用户数量（包括子部门）
   */
  calculateDepartmentUserCount(department: any): number {
    const directUsers = department.users?.length || 0
    const childUsers = department.children?.reduce((total: number, child: any) => {
      return total + this.calculateDepartmentUserCount(child)
    }, 0) || 0

    return directUsers + childUsers
  },

  /**
   * 计算部门用户数量（包括子部门）- 异步版本
   */
  async calculateDepartmentUserCountAsync(departmentId: string): Promise<number> {
    // 获取所有子部门ID
    const getAllSubDepartmentIds = async (parentId: string): Promise<string[]> => {
      const subDepartments = await prisma.department.findMany({
        where: {
          parentId,
          active: true
        },
        select: { id: true }
      })

      let allIds = subDepartments.map(dept => dept.id)

      for (const subDept of subDepartments) {
        const subSubIds = await getAllSubDepartmentIds(subDept.id)
        allIds = allIds.concat(subSubIds)
      }

      return allIds
    }

    const allDepartmentIds = [departmentId, ...(await getAllSubDepartmentIds(departmentId))]

    // 计算所有相关部门的用户数量
    const userCount = await prisma.userDepartment.count({
      where: {
        departmentId: {
          in: allDepartmentIds
        }
      }
    })

    return userCount
  },

  /**
   * 获取部门成员列表
   */
  async getDepartmentMembers(departmentId: string, includeSubDepartments: boolean = false) {
    let departmentIds = [departmentId]

    if (includeSubDepartments) {
      // 递归获取所有子部门ID
      const getAllSubDepartmentIds = async (parentId: string): Promise<string[]> => {
        const subDepartments = await prisma.department.findMany({
          where: {
            parentId,
            active: true
          },
          select: { id: true }
        })

        let allIds = subDepartments.map(dept => dept.id)

        for (const subDept of subDepartments) {
          const subSubIds = await getAllSubDepartmentIds(subDept.id)
          allIds = allIds.concat(subSubIds)
        }

        return allIds
      }

      const subDepartmentIds = await getAllSubDepartmentIds(departmentId)
      departmentIds = departmentIds.concat(subDepartmentIds)
    }

    // 获取部门成员
    const departmentUsers = await prisma.userDepartment.findMany({
      where: {
        departmentId: {
          in: departmentIds
        }
      },
      include: {
        user: {
          include: {
            profile: true,
            roles: {
              include: {
                role: true
              }
            }
          }
        },
        department: true
      }
    })

    return departmentUsers.map(userDept => ({
      id: userDept.user.id,
      name: userDept.user.profile?.name || userDept.user.email,
      email: userDept.user.email,
      phone: userDept.user.phone || '',
      avatar: userDept.user.profile?.avatar || '',
      department: userDept.department.name,
      departmentId: userDept.department.id,
      roles: userDept.user.roles?.map(userRole => userRole.role.name) || [],
      status: userDept.user.active ? 'active' : 'inactive'
    }))
  },

  /**
   * 获取组织成员列表
   */
  async getOrganizationMembers(organizationId: string, options: {
    departmentId?: string
    page?: number
    limit?: number
    search?: string
  } = {}) {
    const { departmentId, page = 1, limit = 50, search } = options

    // 构建查询条件
    const whereConditions: any = {
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
   * 根据ID获取部门详情
   */
  async getDepartmentById(departmentId: string) {
    const department = await prisma.department.findUnique({
      where: {
        id: departmentId,
        active: true
      },
      include: {
        organization: true,
        users: {
          include: {
            user: {
              include: {
                profile: true
              }
            }
          }
        },
        parent: true,
        children: {
          where: {
            active: true
          },
          include: {
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
        }
      }
    })

    if (!department) return null

    // 转换为前端需要的格式
    return {
      id: department.id,
      name: department.name,
      description: department.description,
      type: 'department', // 固定类型
      code: department.code,
      level: department.level,
      parentId: department.parentId,
      organizationId: department.organizationId,
      memberCount: this.calculateDepartmentUserCount(department),
      children: department.children.map(child => ({
        id: child.id,
        name: child.name,
        type: 'department', // 固定类型
        memberCount: this.calculateDepartmentUserCount(child),
        children: []
      }))
    }
  },

  /**
   * 获取部门列表
   */
  async getDepartments(organizationId?: string) {
    const whereClause = organizationId ? {
      organizationId,
      active: true
    } : {
      active: true
    }

    return await prisma.department.findMany({
      where: whereClause,
      include: {
        organization: true,
        users: {
          include: {
            user: true
          }
        },
        parent: true,
        children: {
          where: {
            active: true
          }
        }
      },
      orderBy: {
        sortOrder: 'asc'
      }
    })
  },

  /**
   * 创建新部门
   */
  async createDepartment(departmentData: {
    name: string
    description?: string
    parentId?: string | null
    type?: string
    code?: string
    responsiblePerson?: string
    contactInfo?: string
  }) {
    // 获取默认组织ID（如果没有指定父部门）
    let organizationId: string
    let level = 1

    if (departmentData.parentId) {
      // 如果有父部门，获取父部门信息
      const parentDepartment = await prisma.department.findUnique({
        where: { id: departmentData.parentId },
        select: { organizationId: true, level: true }
      })

      if (!parentDepartment) {
        throw new Error('父部门不存在')
      }

      organizationId = parentDepartment.organizationId
      level = parentDepartment.level + 1
    } else {
      // 如果没有父部门，获取第一个组织作为默认组织
      const defaultOrg = await prisma.organization.findFirst({
        where: { active: true },
        select: { id: true }
      })

      if (!defaultOrg) {
        throw new Error('没有可用的组织')
      }

      organizationId = defaultOrg.id
    }

    // 生成部门编码（如果没有提供）
    let code = departmentData.code
    if (!code) {
      const timestamp = Date.now().toString().slice(-6)
      code = `DEPT_${timestamp}`
    }

    // 检查部门编码是否已存在
    const existingDept = await prisma.department.findUnique({
      where: { code }
    })

    if (existingDept) {
      throw new Error('部门编码已存在')
    }

    // 创建部门
    const newDepartment = await prisma.department.create({
      data: {
        name: departmentData.name,
        code,
        description: departmentData.description || '',
        organizationId,
        parentId: departmentData.parentId || null,
        level,
        sortOrder: 0,
        active: true
      },
      include: {
        organization: true,
        parent: true,
        users: {
          include: {
            user: true
          }
        }
      }
    })

    // 转换为OrganizationNode格式
    return {
      id: newDepartment.id,
      name: newDepartment.name,
      memberCount: newDepartment.users?.length || 0,
      type: 'department' as const,
      code: newDepartment.code,
      description: newDepartment.description,
      level: newDepartment.level,
      parentId: newDepartment.parentId
    }
  },

  /**
   * 更新部门信息
   */
  async updateDepartment(departmentId: string, departmentData: {
    name?: string
    description?: string
    parentId?: string
    code?: string
  }) {
    // 检查部门是否存在
    const existingDepartment = await prisma.department.findUnique({
      where: { id: departmentId, active: true }
    })

    if (!existingDepartment) {
      throw new Error('部门不存在')
    }

    // 如果更新了父部门，需要重新计算层级
    let level = existingDepartment.level
    let organizationId = existingDepartment.organizationId

    if (departmentData.parentId !== undefined && departmentData.parentId !== existingDepartment.parentId) {
      if (departmentData.parentId) {
        const parentDepartment = await prisma.department.findUnique({
          where: { id: departmentData.parentId },
          select: { organizationId: true, level: true }
        })

        if (!parentDepartment) {
          throw new Error('父部门不存在')
        }

        organizationId = parentDepartment.organizationId
        level = parentDepartment.level + 1
      } else {
        // 如果设置为顶级部门，获取默认组织
        const defaultOrg = await prisma.organization.findFirst({
          where: { active: true },
          orderBy: { sortOrder: 'asc' }
        })

        if (!defaultOrg) {
          throw new Error('未找到默认组织')
        }

        organizationId = defaultOrg.id
        level = 1
      }
    }

    // 更新部门
    const updatedDepartment = await prisma.department.update({
      where: { id: departmentId },
      data: {
        ...(departmentData.name && { name: departmentData.name }),
        ...(departmentData.description !== undefined && { description: departmentData.description }),
        ...(departmentData.parentId !== undefined && { parentId: departmentData.parentId }),
        ...(departmentData.code && { code: departmentData.code }),
        organizationId,
        level
      },
      include: {
        organization: true,
        parent: true,
        users: {
          include: {
            user: {
              include: {
                profile: true
              }
            }
          }
        },
        children: {
          where: { active: true }
        }
      }
    })

    // 转换为前端需要的格式
     return {
       id: updatedDepartment.id,
       name: updatedDepartment.name,
       description: updatedDepartment.description,
       type: 'department', // 固定类型
       code: updatedDepartment.code,
       level: updatedDepartment.level,
       parentId: updatedDepartment.parentId,
       organizationId: updatedDepartment.organizationId,
       memberCount: this.calculateDepartmentUserCount(updatedDepartment)
    }
  },

  /**
   * 删除部门
   */
  async deleteDepartment(departmentId: string) {
    // 检查部门是否存在
    const department = await prisma.department.findUnique({
      where: { id: departmentId, active: true },
      include: {
        children: {
          where: { active: true }
        },
        users: true
      }
    })

    if (!department) {
      throw new Error('部门不存在')
    }

    // 检查是否有子部门
    if (department.children && department.children.length > 0) {
      throw new Error('该部门下还有子部门，无法删除')
    }

    // 检查是否有用户
    if (department.users && department.users.length > 0) {
      throw new Error('该部门下还有用户，无法删除')
    }

    // 软删除部门
    await prisma.department.update({
      where: { id: departmentId },
      data: { active: false }
    })

    return { success: true, message: '部门删除成功' }
  }
}