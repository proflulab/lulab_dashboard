/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-06-19 21:41:26
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-06-20 13:30:17
 * @FilePath: /lulab_dashboard/prisma/seeds/departments.ts
 * @Description: 部门种子模块
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */

import { PrismaClient } from '@prisma/client'

export interface CreatedDepartments {
    tech: any
    sales: any
    finance: any
    hr: any
    customerService: any
}

export async function createDepartments(prisma: PrismaClient, organizationId: string): Promise<CreatedDepartments> {

    const departments = {
        tech: await prisma.department.upsert({
            where: { code: 'TECH' },
            update: {},
            create: {
                name: '技术部',
                code: 'TECH',
                description: '负责技术研发和系统维护',
                organizationId,
            },
        }),
        sales: await prisma.department.upsert({
            where: { code: 'SALES' },
            update: {},
            create: {
                name: '销售部',
                code: 'SALES',
                description: '负责产品销售和市场推广',
                organizationId,
            },
        }),
        finance: await prisma.department.upsert({
            where: { code: 'FINANCE' },
            update: {},
            create: {
                name: '财务部',
                code: 'FINANCE',
                description: '负责财务管理和会计核算',
                organizationId,
            },
        }),
        hr: await prisma.department.upsert({
            where: { code: 'HR' },
            update: {},
            create: {
                name: '人力资源部',
                code: 'HR',
                description: '负责人力资源管理和招聘',
                organizationId,
            },
        }),
        customerService: await prisma.department.upsert({
            where: { code: 'CUSTOMER_SERVICE' },
            update: {},
            create: {
                name: '客服部',
                code: 'CUSTOMER_SERVICE',
                description: '负责客户服务和售后支持',
                organizationId,
            },
        }),
    }



    return departments
}