import { prisma } from '../prisma'

// 用户相关操作
export const userService = {
  async getAll() {
    return await prisma.user.findMany({
      where: {
        deletedAt: null, // 只获取未删除的用户
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
        organizations: {
          include: {
            organization: true,
          },
        },
        departments: {
          include: {
            department: true,
          },
        },
      },
    })
  },

  async getById(id: string) {
    return await prisma.user.findFirst({
      where: {
        id,
        deletedAt: null, // 只获取未删除的用户
      },
      include: {
        orders: true,
        currentOwnerOrders: true,
        financialCloserOrders: true,
        createdRefunds: true,
        createdProducts: true,
        updatedProducts: true,
        roles: {
          include: {
            role: true,
          },
        },
        organizations: {
          include: {
            organization: true,
          },
        },
        departments: {
          include: {
            department: true,
          },
        },
        permissions: {
          include: {
            permission: true,
          },
        },
        dataPermissions: true,
      },
    })
  },

  async getByEmail(email: string) {
    return await prisma.user.findFirst({
      where: {
        email,
        deletedAt: null, // 只获取未删除的用户
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    })
  },

  async create(data: {
    name?: string
    email: string
    password?: string
    countryCode?: string
    phone?: string
    avatar?: string
    active?: boolean
  }) {
    return await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: data.password,
        countryCode: data.countryCode,
        phone: data.phone,
        avatar: data.avatar,
        active: data.active ?? true,
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    })
  },

  async update(id: string, data: Partial<{
    name: string
    email: string
    password: string
    countryCode: string
    phone: string
    avatar: string
    active: boolean
    emailVerifiedAt: Date
    phoneVerifiedAt: Date
  }>) {
    // 先检查用户是否存在且未删除
    const existingUser = await prisma.user.findFirst({
      where: { id, deletedAt: null }
    })

    if (!existingUser) {
      throw new Error('User not found or has been deleted')
    }

    return await prisma.user.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email,
        password: data.password,
        countryCode: data.countryCode,
        phone: data.phone,
        avatar: data.avatar,
        active: data.active,
        emailVerifiedAt: data.emailVerifiedAt,
        phoneVerifiedAt: data.phoneVerifiedAt,
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    })
  },

  // 软删除用户
  async softDelete(id: string) {
    // 先检查用户是否存在且未删除
    const existingUser = await prisma.user.findFirst({
      where: { id, deletedAt: null }
    })

    if (!existingUser) {
      throw new Error('User not found or has been deleted')
    }

    return await prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        active: false,
      },
    })
  },

  // 硬删除用户（谨慎使用）
  async hardDelete(id: string) {
    return await prisma.user.delete({
      where: { id },
    })
  },

  // 恢复软删除的用户
  async restore(id: string) {
    return await prisma.user.update({
      where: { id },
      data: {
        deletedAt: null,
        active: true,
      },
    })
  },

  // 根据手机号查找用户
  async getByPhone(countryCode: string, phone: string) {
    return await prisma.user.findFirst({
      where: {
        countryCode,
        phone,
        deletedAt: null,
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    })
  },
}