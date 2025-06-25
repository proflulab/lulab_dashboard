/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-06-23 14:03:24
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-06-25 12:38:39
 * @FilePath: /lulab_dashboard/lib/services/department.service.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */

import { prisma } from '@/lib/prisma'

// 部门节点类型
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
}


// 部门服务
export const departmentService = {

    /**
     * Description:创建部门
     * @param {any} departmentData:{name:stringdescription?:stringparentId?:string|nulltype?:stringcode?:stringresponsiblePerson?:stringcontactInfo?:string}
     * @returns {any}
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
      * 软删除部门
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
    },

    /**
     * 获取部门架构树
     */
    async getDepartmentTree(organizationId?: string): Promise<DepartmentNode[]> {
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
     * 构建部门节点
     */
    buildDepartmentNode(department: any): DepartmentNode {
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
     * 获取部门成员列表
     */
    async getDepartmentMembers(departmentId: string, includeSubDepartments: boolean = false) {
        let departmentIds = [departmentId]

        if (includeSubDepartments) {
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
    }
}


/**
 * 递归获取所有子部门ID
 * @param parentId 父部门ID
 * @returns 所有子部门ID数组
 */
export async function getAllSubDepartmentIds(parentId: string): Promise<string[]> {
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

/**
 * 获取部门ID列表（包含或不包含子部门）
 * @param departmentId 部门ID
 * @param includeSubDepartments 是否包含子部门
 * @returns 部门ID数组
 */
export async function getDepartmentIds(departmentId: string, includeSubDepartments: boolean = false): Promise<string[]> {
    let departmentIds = [departmentId]

    if (includeSubDepartments) {
        const subDepartmentIds = await getAllSubDepartmentIds(departmentId)
        departmentIds = departmentIds.concat(subDepartmentIds)
    }

    return departmentIds
}

/**
 * 获取部门用户关系数据
 * @param departmentIds 部门ID数组
 * @returns 部门用户关系列表
 */
export async function getDepartmentUsers(departmentIds: string[]) {
    return await prisma.userDepartment.findMany({
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
                    },
                    organizations: {
                        include: {
                            organization: true
                        }
                    }
                }
            },
            department: {
                include: {
                    organization: true
                }
            }
        }
    })


}

/**
 * 获取部门详细信息
 * @param departmentId 部门ID
 * @returns 部门信息
 */
export async function getDepartmentInfo(departmentId: string) {
    return await prisma.department.findUnique({
        where: { id: departmentId },
        include: {
            organization: true,
            parent: true
        }
    })
}

/**
 * 获取部门基本信息（不包含关联数据）
 * @param departmentId 部门ID
 * @returns 部门基本信息
 */
export async function getDepartmentBasic(departmentId: string) {
    return await prisma.department.findUnique({
        where: { id: departmentId }
    })
}

/**
 * 检查部门是否存在且激活
 * @param departmentId 部门ID
 * @returns 是否存在且激活
 */
export async function isDepartmentActive(departmentId: string): Promise<boolean> {
    const department = await prisma.department.findUnique({
        where: { id: departmentId },
        select: { active: true }
    })
    return department?.active ?? false
}

/**
 * 获取部门成员（包括子部门）
 * @param departmentId 部门ID
 * @param includeSubDepartments 是否包含子部门
 * @returns 部门成员列表和部门信息
 */
export async function getDepartmentMembers(departmentId: string, includeSubDepartments: boolean = false) {
    // 获取部门ID列表
    const departmentIds = await getDepartmentIds(departmentId, includeSubDepartments)

    // 获取部门成员
    const departmentUsers = await getDepartmentUsers(departmentIds)

    // 获取部门信息
    const department = await getDepartmentInfo(departmentId)

    return {
        departmentUsers,
        department,
        departmentIds
    }
}