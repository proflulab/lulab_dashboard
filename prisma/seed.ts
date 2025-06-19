/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-06-15 20:26:06
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-06-18 03:50:39
 * @FilePath: /lulab_dashboard/prisma/seed.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */
import { PrismaClient, ProductCategory, ProductStatus, $Enums } from '@prisma/client'
import bcrypt from 'bcryptjs'
// 注释掉不需要的导入，seed脚本不需要session

const prisma = new PrismaClient()

async function main() {
  console.log('开始数据库种子数据初始化...')

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

  console.log('用户创建完成')

  // 创建基础角色
  console.log('创建基础角色...')
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

  console.log('角色创建完成')

  // 为用户分配角色
  console.log('为用户分配角色...')

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

  console.log('用户角色分配完成')

  // 创建产品
  const products = [
    {
      productCode: 'COURSE-001',
      name: 'Python编程基础课程',
      description: '从零开始学习Python编程，适合初学者的完整课程体系',
      shortDescription: 'Python编程入门课程',
      category: ProductCategory.COURSE,
      status: ProductStatus.ACTIVE,
      price: 299.00,
      originalPrice: 399.00,
      currency: 'CNY',
      durationDays: 365,
      maxUsers: 1000,
      tags: ['编程', 'Python', '基础'],
      imageUrl: 'https://example.com/python-course.jpg',
      sortOrder: 1,
      isRecommended: true,
      isFeatured: true,
      salesCount: 150,
      viewCount: 2500,
      rating: 4.8,
      reviewCount: 120,
      createdBy: adminUser.id,
      publishedAt: new Date(),
    },
    {
      productCode: 'MEMBERSHIP-001',
      name: '年度VIP会员',
      description: '享受全站课程免费学习，专属客服支持，优先技术答疑',
      shortDescription: '年度VIP会员权益',
      category: ProductCategory.MEMBERSHIP,
      status: ProductStatus.ACTIVE,
      price: 1999.00,
      originalPrice: 2999.00,
      currency: 'CNY',
      durationDays: 365,
      maxUsers: 500,
      tags: ['会员', 'VIP', '全站'],
      imageUrl: 'https://example.com/vip-membership.jpg',
      sortOrder: 2,
      isRecommended: true,
      isFeatured: false,
      salesCount: 80,
      viewCount: 1200,
      rating: 4.9,
      reviewCount: 65,
      createdBy: adminUser.id,
      publishedAt: new Date(),
    },
    {
      productCode: 'CONSULT-001',
      name: '一对一技术咨询',
      description: '资深工程师一对一技术指导，解决实际项目问题',
      shortDescription: '一对一技术咨询服务',
      category: ProductCategory.CONSULTATION,
      status: ProductStatus.ACTIVE,
      price: 500.00,
      originalPrice: 600.00,
      currency: 'CNY',
      durationDays: 30,
      maxUsers: 1,
      tags: ['咨询', '一对一', '技术指导'],
      imageUrl: 'https://example.com/consultation.jpg',
      sortOrder: 3,
      isRecommended: false,
      isFeatured: true,
      salesCount: 25,
      viewCount: 800,
      rating: 5.0,
      reviewCount: 20,
      createdBy: adminUser.id,
      publishedAt: new Date(),
    },
    {
      productCode: 'MATERIAL-001',
      name: '前端开发资料包',
      description: '包含HTML、CSS、JavaScript等前端开发必备资料和模板',
      shortDescription: '前端开发资料包',
      category: ProductCategory.MATERIAL,
      status: ProductStatus.ACTIVE,
      price: 99.00,
      originalPrice: 149.00,
      currency: 'CNY',
      durationDays: null,
      maxUsers: null,
      tags: ['前端', '资料', '模板'],
      imageUrl: 'https://example.com/frontend-materials.jpg',
      downloadUrl: 'https://example.com/download/frontend-pack.zip',
      sortOrder: 4,
      isRecommended: false,
      isFeatured: false,
      salesCount: 200,
      viewCount: 3000,
      rating: 4.5,
      reviewCount: 180,
      createdBy: adminUser.id,
      publishedAt: new Date(),
    },
  ]

  const createdProducts = []
  for (const productData of products) {
    const product = await prisma.product.upsert({
      where: { productCode: productData.productCode },
      update: {},
      create: productData,
    })
    createdProducts.push(product)
  }

  console.log('产品创建完成')

  // 创建订单
  const orders = []
  for (let i = 0; i < 10; i++) {
    const user = normalUsers[i % normalUsers.length]
    const product = createdProducts[i % createdProducts.length]
    const orderDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // 最近30天内的随机日期

    const order = await prisma.order.create({
      data: {
        orderCode: `ORD-${Date.now()}-${i.toString().padStart(3, '0')}`,
        externalOrderId: `EXT-${Math.random().toString(36).substr(2, 9)}`,
        // productId: product.id, // 注释掉，因为schema中可能没有这个字段
        productName: product.name,
        customerEmail: user.email,
        userId: user.id,
        currentOwnerId: customerServiceUser.id,
        financialCloserId: i < 5 ? financeUser.id : null,
        financialClosedAt: i < 5 ? new Date() : null,
        financialClosed: i < 5,
        amountPaid: product.price,
        currency: product.currency,
        amountPaidCny: product.price,
        paidAt: orderDate,
        effectiveDate: orderDate,
        benefitStartDate: orderDate,
        benefitDurationDays: product.durationDays,
        activeDays: Math.floor(Math.random() * (product.durationDays || 30)),
        benefitDaysRemaining: product.durationDays ? product.durationDays - Math.floor(Math.random() * 30) : null,
        createdAt: orderDate,
      },
    })
    orders.push(order)
  }

  console.log('订单创建完成')

  // 创建退款记录
  const refunds = []
  for (let i = 0; i < 3; i++) {
    const order = orders[i]
    const refundDate = new Date(order.createdAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000) // 订单创建后7天内

    const refund = await prisma.orderRefund.create({
      data: {
        afterSaleCode: `AS-${Date.now()}-${i.toString().padStart(3, '0')}`,
        orderId: order.id,
        submittedAt: refundDate,
        refundedAt: i < 2 ? new Date(refundDate.getTime() + 24 * 60 * 60 * 1000) : null, // 前两个已退款
        refundChannel: i === 0 ? '抖音平台退款' : i === 1 ? '微信退款' : '支付宝退款',
        approvalUrl: `https://example.com/approval/${i}`,
        createdBy: customerServiceUser.id,
        refundAmount: order.amountPaid,
        refundReason: i === 0 ? '课程内容不符合预期' : i === 1 ? '重复购买' : '个人原因',
        benefitEndedAt: refundDate,
        benefitUsedDays: Math.floor(Math.random() * 10),
        applicantName: `申请人${i + 1}`,
        isFinancialSettled: i < 2,
        financialSettledAt: i < 2 ? new Date() : null,
        financialNote: i < 2 ? '退款已处理完成' : null,
        productCategory: order.productName?.includes('课程') ? 'COURSE' : 'OTHER',
        createdAt: refundDate,
      },
    })
    refunds.push(refund)
  }

  console.log('退款记录创建完成')

  console.log('数据库种子数据初始化完成！')
  console.log(`创建了 ${normalUsers.length + 3} 个用户`)
  console.log(`创建了 4 个角色`)
  console.log(`分配了 ${normalUsers.length + 3} 个用户角色关联`)
  console.log(`创建了 ${createdProducts.length} 个产品`)
  console.log(`创建了 ${orders.length} 个订单`)
  console.log(`创建了 ${refunds.length} 个退款记录`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })