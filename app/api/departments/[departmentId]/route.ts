/*
 * 部门详情 API 路由
 * 用于获取、更新和删除单个部门的操作
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { organizationService } from '@/lib/services/organization.service'
import { PermissionService } from '@/lib/services/permission.service'

/**
 * GET /api/departments/[departmentId]
 * 获取部门详情
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ departmentId: string }> }
) {
    try {
        // 验证用户身份
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: '未授权访问' },
                { status: 401 }
            )
        }

        const { departmentId } = await params

        // 检查权限
        const hasPermission = await PermissionService.checkPermission(
            session.user.id,
            'departments.view'
        )
        if (!hasPermission.hasPermission) {
            return NextResponse.json(
                { error: '权限不足' },
                { status: 403 }
            )
        }

        // 获取部门详情
        const department = await organizationService.getDepartmentById(departmentId)

        if (!department) {
            return NextResponse.json(
                { error: '部门不存在' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            data: department
        })
    } catch (error) {
        console.error('Error fetching department detail:', error)
        return NextResponse.json(
            { error: '获取部门详情失败' },
            { status: 500 }
        )
    }
}

/**
 * PUT /api/departments/[departmentId]
 * 更新部门信息
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ departmentId: string }> }
) {
    try {
        // 验证用户身份
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: '未授权访问' },
                { status: 401 }
            )
        }

        const { departmentId } = await params

        // 检查权限
        const hasPermission = await PermissionService.checkPermission(
            session.user.id,
            'departments.update'
        )
        if (!hasPermission.hasPermission) {
            return NextResponse.json(
                { error: '权限不足' },
                { status: 403 }
            )
        }

        // 解析请求体
        const body = await request.json()
        const { name, description, parentId } = body

        // 验证必填字段
        if (!name || name.trim() === '') {
            return NextResponse.json(
                { error: '部门名称不能为空' },
                { status: 400 }
            )
        }

        // 更新部门
        const updatedDepartment = await organizationService.updateDepartment(departmentId, {
            name: name.trim(),
            description: description?.trim(),
            parentId
        })

        return NextResponse.json({
            success: true,
            data: updatedDepartment
        })
    } catch (error) {
        console.error('Error updating department:', error)
        return NextResponse.json(
            { error: '更新部门失败' },
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/departments/[departmentId]
 * 删除部门
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ departmentId: string }> }
) {
    try {
        // 验证用户身份
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: '未授权访问' },
                { status: 401 }
            )
        }

        const { departmentId } = await params

        // 检查权限
        const hasPermission = await PermissionService.checkPermission(
            session.user.id,
            'departments.delete'
        )
        if (!hasPermission.hasPermission) {
            return NextResponse.json(
                { error: '权限不足' },
                { status: 403 }
            )
        }

        // 删除部门
        await organizationService.deleteDepartment(departmentId)

        return NextResponse.json({
            success: true,
            message: '部门删除成功'
        })
    } catch (error) {
        console.error('Error deleting department:', error)
        return NextResponse.json(
            { error: '删除部门失败' },
            { status: 500 }
        )
    }
}