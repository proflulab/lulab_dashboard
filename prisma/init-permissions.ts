/*
 * 权限初始化脚本
 * 用于初始化基础的权限、角色和组织数据
 */

import { PrismaClient, $Enums } from '@prisma/client'

// 注释掉不需要的导入，初始化脚本不需要session

const prisma = new PrismaClient()

/**
 * 基础权限定义
 */
const BASE_PERMISSIONS = [
  // 用户管理权限
  { name: 'users.view', description: '查看用户', category: 'USER_MANAGEMENT' },
  { name: 'users.create', description: '创建用户', category: 'USER_MANAGEMENT' },
  { name: 'users.edit', description: '编辑用户', category: 'USER_MANAGEMENT' },
  { name: 'users.delete', description: '删除用户', category: 'USER_MANAGEMENT' },
  { name: 'users.manage', description: '管理用户', category: 'USER_MANAGEMENT' },

  // 角色管理权限
  { name: 'roles.view', description: '查看角色', category: 'ROLE_MANAGEMENT' },
  { name: 'roles.create', description: '创建角色', category: 'ROLE_MANAGEMENT' },
  { name: 'roles.edit', description: '编辑角色', category: 'ROLE_MANAGEMENT' },
  { name: 'roles.delete', description: '删除角色', category: 'ROLE_MANAGEMENT' },
  { name: 'roles.manage', description: '管理角色', category: 'ROLE_MANAGEMENT' },

  // 权限管理权限
  { name: 'permissions.view', description: '查看权限', category: 'PERMISSION_MANAGEMENT' },
  { name: 'permissions.create', description: '创建权限', category: 'PERMISSION_MANAGEMENT' },
  { name: 'permissions.edit', description: '编辑权限', category: 'PERMISSION_MANAGEMENT' },
  { name: 'permissions.delete', description: '删除权限', category: 'PERMISSION_MANAGEMENT' },
  { name: 'permissions.manage', description: '管理权限', category: 'PERMISSION_MANAGEMENT' },

  // 组织管理权限
  { name: 'organizations.view', description: '查看组织', category: 'ORGANIZATION_MANAGEMENT' },
  { name: 'organizations.create', description: '创建组织', category: 'ORGANIZATION_MANAGEMENT' },
  { name: 'organizations.edit', description: '编辑组织', category: 'ORGANIZATION_MANAGEMENT' },
  { name: 'organizations.delete', description: '删除组织', category: 'ORGANIZATION_MANAGEMENT' },
  { name: 'organizations.manage', description: '管理组织', category: 'ORGANIZATION_MANAGEMENT' },

  // 部门管理权限
  { name: 'departments.view', description: '查看部门', category: 'DEPARTMENT_MANAGEMENT' },
  { name: 'departments.create', description: '创建部门', category: 'DEPARTMENT_MANAGEMENT' },
  { name: 'departments.edit', description: '编辑部门', category: 'DEPARTMENT_MANAGEMENT' },
  { name: 'departments.delete', description: '删除部门', category: 'DEPARTMENT_MANAGEMENT' },
  { name: 'departments.manage', description: '管理部门', category: 'DEPARTMENT_MANAGEMENT' },

  // 产品管理权限
  { name: 'products.view', description: '查看产品', category: 'PRODUCT_MANAGEMENT' },
  { name: 'products.create', description: '创建产品', category: 'PRODUCT_MANAGEMENT' },
  { name: 'products.edit', description: '编辑产品', category: 'PRODUCT_MANAGEMENT' },
  { name: 'products.delete', description: '删除产品', category: 'PRODUCT_MANAGEMENT' },
  { name: 'products.manage', description: '管理产品', category: 'PRODUCT_MANAGEMENT' },

  // 订单管理权限
  { name: 'orders.view', description: '查看订单', category: 'ORDER_MANAGEMENT' },
  { name: 'orders.create', description: '创建订单', category: 'ORDER_MANAGEMENT' },
  { name: 'orders.edit', description: '编辑订单', category: 'ORDER_MANAGEMENT' },
  { name: 'orders.delete', description: '删除订单', category: 'ORDER_MANAGEMENT' },
  { name: 'orders.manage', description: '管理订单', category: 'ORDER_MANAGEMENT' },
  { name: 'orders.approve', description: '审批订单', category: 'ORDER_MANAGEMENT' },
  { name: 'orders.refund', description: '退款处理', category: 'ORDER_MANAGEMENT' },

  // 财务管理权限
  { name: 'finance.view', description: '查看财务', category: 'FINANCE_MANAGEMENT' },
  { name: 'finance.reports', description: '财务报表', category: 'FINANCE_MANAGEMENT' },
  { name: 'finance.manage', description: '管理财务', category: 'FINANCE_MANAGEMENT' },

  // 系统管理权限
  { name: 'system.settings', description: '系统设置', category: 'SYSTEM_MANAGEMENT' },
  { name: 'system.logs', description: '系统日志', category: 'SYSTEM_MANAGEMENT' },
  { name: 'system.backup', description: '系统备份', category: 'SYSTEM_MANAGEMENT' },
  { name: 'system.manage', description: '系统管理', category: 'SYSTEM_MANAGEMENT' },

  // 仪表板权限
  { name: 'dashboard.view', description: '查看仪表板', category: 'DASHBOARD' },
  { name: 'dashboard.analytics', description: '数据分析', category: 'DASHBOARD' },
]

/**
 * 基础角色定义
 */
const BASE_ROLES = [
  {
    name: '超级管理员',
    code: 'SUPER_ADMIN',
    description: '系统超级管理员，拥有所有权限',
    level: 0,
    type: $Enums.RoleType.SYSTEM,
    permissions: BASE_PERMISSIONS.map(p => p.name) // 所有权限
  },
  {
    name: '管理员',
    code: 'ADMIN',
    description: '系统管理员，拥有大部分管理权限',
    level: 1,
    type: $Enums.RoleType.SYSTEM,
    permissions: [
      'users.view', 'users.create', 'users.edit', 'users.manage',
      'roles.view', 'roles.create', 'roles.edit',
      'permissions.view',
      'organizations.view', 'organizations.create', 'organizations.edit',
      'departments.view', 'departments.create', 'departments.edit',
      'products.view', 'products.create', 'products.edit', 'products.manage',
      'orders.view', 'orders.create', 'orders.edit', 'orders.manage', 'orders.approve',
      'finance.view', 'finance.reports',
      'dashboard.view', 'dashboard.analytics'
    ]
  },
  {
    name: '经理',
    code: 'MANAGER',
    description: '部门经理，拥有部门管理权限',
    level: 2,
    type: $Enums.RoleType.CUSTOM,
    permissions: [
      'users.view',
      'departments.view',
      'products.view', 'products.create', 'products.edit',
      'orders.view', 'orders.create', 'orders.edit', 'orders.approve',
      'dashboard.view', 'dashboard.analytics'
    ]
  },
  {
    name: '财务',
    code: 'FINANCE',
    description: '财务人员，拥有财务相关权限',
    level: 3,
    type: $Enums.RoleType.CUSTOM,
    permissions: [
      'orders.view', 'orders.refund',
      'finance.view', 'finance.reports', 'finance.manage',
      'dashboard.view'
    ]
  },
  {
    name: '客服',
    code: 'CUSTOMER_SERVICE',
    description: '客服人员，拥有客户服务权限',
    level: 4,
    type: $Enums.RoleType.CUSTOM,
    permissions: [
      'orders.view', 'orders.edit',
      'products.view',
      'dashboard.view'
    ]
  },
  {
    name: '普通用户',
    code: 'USER',
    description: '普通用户，基础查看权限',
    level: 5,
    type: $Enums.RoleType.CUSTOM,
    permissions: [
      'dashboard.view'
    ]
  }
]

/**
 * 基础组织定义
 */
const BASE_ORGANIZATIONS = [
  {
    name: '总公司',
    code: 'HEAD_OFFICE',
    description: '公司总部',
    departments: [
      { name: '技术部', code: 'TECH', description: '技术开发部门' },
      { name: '销售部', code: 'SALES', description: '销售业务部门' },
      { name: '财务部', code: 'FINANCE', description: '财务管理部门' },
      { name: '人事部', code: 'HR', description: '人力资源部门' },
      { name: '客服部', code: 'CUSTOMER_SERVICE', description: '客户服务部门' }
    ]
  }
]

/**
 * 初始化权限数据
 */
async function initPermissions() {
  console.log('开始初始化权限数据...')

  try {
    // 创建权限
    console.log('创建基础权限...')
    for (const permission of BASE_PERMISSIONS) {
      await (prisma as any).permission.upsert({
        where: { code: permission.name },
        update: {
          name: permission.name,
          description: permission.description
        },
        create: {
          name: permission.name,
          code: permission.name,
          description: permission.description,
          resource: permission.category || 'SYSTEM',
          action: 'VIEW'
        }
      })
    }
    console.log(`✅ 创建了 ${BASE_PERMISSIONS.length} 个权限`)

    // 创建角色
    console.log('创建基础角色...')
    for (const role of BASE_ROLES) {
      const createdRole = await (prisma as any).role.upsert({
        where: { code: role.code },
        update: {
          name: role.name,
          description: role.description,
          level: role.level,
          type: role.type
        },
        create: {
          name: role.name,
          code: role.code,
          description: role.description,
          level: role.level,
          type: role.type
        }
      })

      // 分配权限给角色
      for (const permissionName of role.permissions) {
        const permission = await (prisma as any).permission.findUnique({
          where: { code: permissionName }
        })

        if (permission) {
          await (prisma as any).rolePermission.upsert({
            where: {
              roleId_permissionId: {
                roleId: createdRole.id,
                permissionId: permission.id
              }
            },
            update: {},
            create: {
              roleId: createdRole.id,
              permissionId: permission.id
            }
          })
        }
      }
    }
    console.log(`✅ 创建了 ${BASE_ROLES.length} 个角色`)

    // 创建组织和部门
    console.log('创建基础组织结构...')
    for (const org of BASE_ORGANIZATIONS) {
      const createdOrg = await (prisma as any).organization.upsert({
        where: { code: org.code },
        update: {
          name: org.name,
          description: org.description
        },
        create: {
          name: org.name,
          code: org.code,
          description: org.description
        }
      })

      // 创建部门
      for (const dept of org.departments) {
        await (prisma as any).department.upsert({
          where: { code: dept.code },
          update: {
            name: dept.name,
            description: dept.description,
            organizationId: createdOrg.id
          },
          create: {
            name: dept.name,
            code: dept.code,
            description: dept.description,
            organizationId: createdOrg.id
          }
        })
      }
    }
    console.log(`✅ 创建了组织结构`)

    console.log('🎉 权限数据初始化完成！')
  } catch (error) {
    console.error('❌ 权限数据初始化失败:', error)
    throw error
  }
}

/**
 * 清理权限数据
 */
async function cleanPermissions() {
  console.log('开始清理权限数据...')

  try {
    // 删除关联数据
    await (prisma as any).rolePermission.deleteMany()
    await (prisma as any).userRole.deleteMany()
    await (prisma as any).userPermission.deleteMany()
    await (prisma as any).userOrganization.deleteMany()
    await (prisma as any).userDepartment.deleteMany()

    // 删除主数据
    await (prisma as any).department.deleteMany()
    await (prisma as any).organization.deleteMany()
    await (prisma as any).role.deleteMany()
    await (prisma as any).permission.deleteMany()

    console.log('✅ 权限数据清理完成')
  } catch (error) {
    console.error('❌ 权限数据清理失败:', error)
    throw error
  }
}

/**
 * 主函数
 */
async function main() {
  const command = process.argv[2]

  try {
    switch (command) {
      case 'init':
        await initPermissions()
        break
      case 'clean':
        await cleanPermissions()
        break
      case 'reset':
        await cleanPermissions()
        await initPermissions()
        break
      default:
        console.log('使用方法:')
        console.log('  npm run permissions:init   - 初始化权限数据')
        console.log('  npm run permissions:clean  - 清理权限数据')
        console.log('  npm run permissions:reset  - 重置权限数据')
        break
    }
  } catch (error) {
    console.error('执行失败:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main()
}

export { initPermissions, cleanPermissions }