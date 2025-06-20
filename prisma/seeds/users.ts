/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-06-19 21:41:26
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-06-20 03:41:11
 * @FilePath: /lulab_dashboard/prisma/seeds/users.ts
 * @Description: 用户数据种子模块
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */

import { PrismaClient, $Enums, User, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

export interface CreatedUsers {
  adminUser: User
  financeUser: User
  customerServiceUser: User
  normalUsers: User[]
  roles: {
    admin: Role
    finance: Role
    customerService: Role
    user: Role
  }
}

export async function createUsers(prisma: PrismaClient): Promise<CreatedUsers> {

  // 创建用户
  const hashedPassword = await bcrypt.hash('admin123', 10)
  const userPassword = await bcrypt.hash('user123', 10)

  // 创建管理员用户
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@lulab.com' },
    update: {},
    create: {
      email: 'admin@lulab.com',
      name: '系统管理员',
      password: hashedPassword,
      emailVerifiedAt: new Date(),
      countryCode: '+86',
      phone: '13800138000',
      phoneVerifiedAt: new Date(),
    },
  })

  // 创建财务用户
  const financeUser = await prisma.user.upsert({
    where: { email: 'finance@lulab.com' },
    update: {},
    create: {
      email: 'finance@lulab.com',
      name: '财务专员',
      password: hashedPassword,
      emailVerifiedAt: new Date(),
      countryCode: '+86',
      phone: '13800138001',
      phoneVerifiedAt: new Date(),
    },
  })

  // 创建客服用户
  const customerServiceUser = await prisma.user.upsert({
    where: { email: 'service@lulab.com' },
    update: {},
    create: {
      email: 'service@lulab.com',
      name: '客服专员',
      password: hashedPassword,
      emailVerifiedAt: new Date(),
      countryCode: '+86',
      phone: '13800138002',
      phoneVerifiedAt: new Date(),
    },
  })

  // 创建普通用户
  const normalUsers = []
  for (let i = 1; i <= 5; i++) {
    const user = await prisma.user.upsert({
      where: { email: `user${i}@example.com` },
      update: {},
      create: {
        email: `user${i}@example.com`,
        name: `用户${i}`,
        password: userPassword,
        emailVerifiedAt: new Date(),
        countryCode: '+86',
        phone: `1380013800${i.toString().padStart(2, '0')}`,
        phoneVerifiedAt: new Date(),
      },
    })
    normalUsers.push(user)
  }



  // 创建基础角色

  const roles = {
    admin: await prisma.role.upsert({
      where: { code: 'ADMIN' },
      update: {},
      create: {
        name: '管理员',
        code: 'ADMIN',
        description: '系统管理员，拥有大部分管理权限',
        level: 1,
        type: $Enums.RoleType.SYSTEM,
      },
    }),
    finance: await prisma.role.upsert({
      where: { code: 'FINANCE' },
      update: {},
      create: {
        name: '财务',
        code: 'FINANCE',
        description: '财务人员，拥有财务相关权限',
        level: 3,
        type: $Enums.RoleType.CUSTOM,
      },
    }),
    customerService: await prisma.role.upsert({
      where: { code: 'CUSTOMER_SERVICE' },
      update: {},
      create: {
        name: '客服',
        code: 'CUSTOMER_SERVICE',
        description: '客服人员，拥有客户服务权限',
        level: 4,
        type: $Enums.RoleType.CUSTOM,
      },
    }),
    user: await prisma.role.upsert({
      where: { code: 'USER' },
      update: {},
      create: {
        name: '普通用户',
        code: 'USER',
        description: '普通用户，基础查看权限',
        level: 5,
        type: $Enums.RoleType.CUSTOM,
      },
    }),
  }



  // 为用户分配角色


  // 管理员用户分配管理员角色
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: roles.admin.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: roles.admin.id,
    },
  })

  // 财务用户分配财务角色
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: financeUser.id,
        roleId: roles.finance.id,
      },
    },
    update: {},
    create: {
      userId: financeUser.id,
      roleId: roles.finance.id,
    },
  })

  // 客服用户分配客服角色
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: customerServiceUser.id,
        roleId: roles.customerService.id,
      },
    },
    update: {},
    create: {
      userId: customerServiceUser.id,
      roleId: roles.customerService.id,
    },
  })

  // 普通用户分配普通用户角色
  for (const user of normalUsers) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: user.id,
          roleId: roles.user.id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        roleId: roles.user.id,
      },
    })
  }



  return {
    adminUser,
    financeUser,
    customerServiceUser,
    normalUsers,
    roles
  }
}