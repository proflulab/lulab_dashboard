import { prisma } from '../prisma'
import { Gender } from '@prisma/client'

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
        profile: true, // 包含用户详细信息
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
        profile: true, // 包含用户详细信息
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
        profile: true, // 包含用户详细信息
        roles: {
          include: {
            role: true,
          },
        },
      },
    })
  },

  async create(data: {
    email: string
    password?: string
    countryCode?: string
    phone?: string
    active?: boolean
    // Profile data
    name?: string
    avatar?: string
    bio?: string
    firstName?: string
    lastName?: string
    dateOfBirth?: Date
    gender?: Gender
    address?: string
    city?: string
    country?: string
    zipCode?: string
    website?: string
  }) {
    return await prisma.user.create({
      data: {
        email: data.email,
        password: data.password,
        countryCode: data.countryCode,
        phone: data.phone,
        active: data.active ?? true,
        profile: data.name || data.avatar || data.bio || data.firstName || data.lastName || 
                data.dateOfBirth || data.gender || data.address || data.city || 
                data.country || data.zipCode || data.website ? {
          create: {
            name: data.name,
            avatar: data.avatar,
            bio: data.bio,
            firstName: data.firstName,
            lastName: data.lastName,
            dateOfBirth: data.dateOfBirth,
            gender: data.gender,
            address: data.address,
            city: data.city,
            country: data.country,
            zipCode: data.zipCode,
            website: data.website,
          }
        } : undefined,
      },
      include: {
        profile: true,
        roles: {
          include: {
            role: true,
          },
        },
      },
    })
  },

  async update(id: string, data: Partial<{
    email: string
    password: string
    countryCode: string
    phone: string
    active: boolean
    emailVerifiedAt: Date
    phoneVerifiedAt: Date
    // Profile data
    name: string
    avatar: string
    bio: string
    firstName: string
    lastName: string
    dateOfBirth: Date
    gender: Gender
    address: string
    city: string
    country: string
    zipCode: string
    website: string
  }>) {
    // 先检查用户是否存在且未删除
    const existingUser = await prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: { profile: true }
    })

    if (!existingUser) {
      throw new Error('User not found or has been deleted')
    }

    // 分离用户基本信息和profile信息
    const { name, avatar, bio, firstName, lastName, dateOfBirth, gender, 
            address, city, country, zipCode, website, ...userData } = data

    const profileData = {
      name, avatar, bio, firstName, lastName, dateOfBirth, 
      gender, address, city, country, zipCode, website
    }

    // 过滤掉undefined的profile字段
     const filteredProfileData = Object.fromEntries(
       Object.entries(profileData).filter(([, value]) => value !== undefined)
     )

    return await prisma.user.update({
      where: { id },
      data: {
        ...userData,
        profile: Object.keys(filteredProfileData).length > 0 ? {
          upsert: {
            create: filteredProfileData,
            update: filteredProfileData,
          }
        } : undefined,
      },
      include: {
        profile: true,
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
        profile: true, // 包含用户详细信息
        roles: {
          include: {
            role: true,
          },
        },
      },
    })
  },
}