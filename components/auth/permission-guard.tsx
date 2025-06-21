/*
 * 权限保护组件
 * 用于在组件级别进行权限控制
 */

'use client'

import React from 'react'
// import { useSession } from 'next-auth/react' // 暂时不需要
import { usePermission, useMultiplePermissions, useRole, useRoleLevel } from '@/hooks/use-permission'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { ShieldX } from 'lucide-react'

// 权限保护组件属性接口
interface PermissionGuardProps {
  children: React.ReactNode
  permission?: string
  permissions?: string[]
  permissionMode?: 'AND' | 'OR'
  roles?: string[]
  roleMode?: 'AND' | 'OR'
  level?: number
  fallback?: React.ReactNode
  loading?: React.ReactNode
  showError?: boolean
  errorMessage?: string
}

/**
 * 权限保护组件
 * 根据用户权限决定是否渲染子组件
 */
export function PermissionGuard({
  children,
  permission,
  permissions,
  permissionMode = 'AND',
  roles,
  roleMode = 'OR',
  level,
  fallback,
  loading,
  showError = true,
  errorMessage = '您没有权限访问此内容'
}: PermissionGuardProps) {
  // 权限检查
  const singlePermissionResult = usePermission(permission)
  const multiplePermissionsResult = useMultiplePermissions(
    permissions || [],
    permissionMode
  )
  const roleResult = useRole(roles || [], roleMode)
  const levelResult = useRoleLevel(level || 999)

  // 确定最终的权限检查结果
  const getPermissionResult = () => {
    const checks = []

    // 单个权限检查
    if (permission) {
      checks.push(singlePermissionResult)
    }

    // 多个权限检查
    if (permissions && permissions.length > 0) {
      checks.push(multiplePermissionsResult)
    }

    // 角色检查
    if (roles && roles.length > 0) {
      checks.push(roleResult)
    }

    // 级别检查
    if (level !== undefined) {
      checks.push(levelResult)
    }

    // 如果没有任何检查条件，默认允许访问
    if (checks.length === 0) {
      return { hasPermission: true, loading: false }
    }

    // 合并检查结果
    const isLoading = checks.some(check => check.loading)
    const hasPermission = checks.every(check => check.hasPermission)
    const error = checks.find(check => check.error)?.error

    return { hasPermission, loading: isLoading, error }
  }

  const result = getPermissionResult()

  // 加载状态
  if (result.loading) {
    return loading || <PermissionSkeleton />
  }

  // 权限不足
  if (!result.hasPermission) {
    if (fallback) {
      return <>{fallback}</>
    }

    if (showError) {
      return (
        <Alert variant="destructive" className="m-4">
          <ShieldX className="h-4 w-4" />
          <AlertDescription>
            {errorMessage}
          </AlertDescription>
        </Alert>
      )
    }

    return null
  }

  // 有权限，渲染子组件
  return <>{children}</>
}

/**
 * 按钮权限保护组件
 * 专门用于按钮等操作元素的权限控制
 */
interface ButtonGuardProps {
  children: React.ReactNode
  permission?: string
  permissions?: string[]
  permissionMode?: 'AND' | 'OR'
  roles?: string[]
  roleMode?: 'AND' | 'OR'
  level?: number
  disabled?: boolean
  hide?: boolean
}

export function ButtonGuard({
  children,
  permission,
  permissions,
  permissionMode = 'AND',
  roles,
  roleMode = 'OR',
  level,
  disabled = false,
  hide = false
}: ButtonGuardProps) {
  const singlePermissionResult = usePermission(permission)
  const multiplePermissionsResult = useMultiplePermissions(
    permissions || [],
    permissionMode
  )
  const roleResult = useRole(roles || [], roleMode)
  const levelResult = useRoleLevel(level || 999)

  const getPermissionResult = () => {
    const checks = []

    if (permission) checks.push(singlePermissionResult)
    if (permissions && permissions.length > 0) checks.push(multiplePermissionsResult)
    if (roles && roles.length > 0) checks.push(roleResult)
    if (level !== undefined) checks.push(levelResult)

    if (checks.length === 0) {
      return { hasPermission: true, loading: false }
    }

    const isLoading = checks.some(check => check.loading)
    const hasPermission = checks.every(check => check.hasPermission)

    return { hasPermission, loading: isLoading }
  }

  const result = getPermissionResult()

  // 加载状态
  if (result.loading) {
    return <Skeleton className="h-9 w-20" />
  }

  // 权限不足
  if (!result.hasPermission) {
    if (hide) {
      return null
    }

    // 禁用按钮
    return React.cloneElement(children as React.ReactElement<{ disabled?: boolean; title?: string }>, {
      disabled: true,
      title: '权限不足'
    })
  }

  // 有权限，正常渲染
  return React.cloneElement(children as React.ReactElement<{ disabled?: boolean }>, {
    disabled: disabled
  })
}

/**
 * 菜单权限保护组件
 * 用于菜单项的权限控制
 */
interface MenuGuardProps {
  children: React.ReactNode
  permission: string
  fallback?: React.ReactNode
}

export function MenuGuard({ children, permission, fallback }: MenuGuardProps) {
  const { hasPermission, loading } = usePermission(permission)

  if (loading) {
    return <Skeleton className="h-8 w-full" />
  }

  if (!hasPermission) {
    return fallback || null
  }

  return <>{children}</>
}

/**
 * 字段权限保护组件
 * 用于表单字段等的权限控制
 */
interface FieldGuardProps {
  children: React.ReactNode
  permission: string
  mode?: 'hide' | 'readonly' | 'mask'
  maskText?: string
}

export function FieldGuard({
  children,
  permission,
  mode = 'hide',
  maskText = '***'
}: FieldGuardProps) {
  const { hasPermission, loading } = usePermission(permission)

  if (loading) {
    return <Skeleton className="h-6 w-24" />
  }

  if (!hasPermission) {
    switch (mode) {
      case 'hide':
        return null
      case 'readonly':
        return React.cloneElement(children as React.ReactElement<{ disabled?: boolean; readOnly?: boolean }>, {
          disabled: true,
          readOnly: true
        })
      case 'mask':
        return <span className="text-muted-foreground">{maskText}</span>
      default:
        return null
    }
  }

  return <>{children}</>
}

/**
 * 数据权限保护组件
 * 用于数据展示的权限控制
 */
interface DataGuardProps {
  children: React.ReactNode
  resource: string
  action?: string
  fallback?: React.ReactNode
}

export function DataGuard({
  children,
  resource,
  action = 'read',
  fallback
}: DataGuardProps) {
  // 这里需要实现资源访问权限检查
  // 暂时使用简单的权限检查
  const permission = `${resource}.${action}`
  const { hasPermission, loading } = usePermission(permission)

  if (loading) {
    return <Skeleton className="h-20 w-full" />
  }

  if (!hasPermission) {
    return fallback || (
      <Alert>
        <ShieldX className="h-4 w-4" />
        <AlertDescription>
          您没有权限查看此数据
        </AlertDescription>
      </Alert>
    )
  }

  return <>{children}</>
}

/**
 * 权限加载骨架屏组件
 */
function PermissionSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  )
}

/**
 * 高阶组件：权限保护
 */
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  permissionConfig: {
    permission?: string
    permissions?: string[]
    roles?: string[]
    level?: number
    fallback?: React.ReactNode
  }
) {
  return function PermissionWrappedComponent(props: P) {
    return (
      <PermissionGuard {...permissionConfig}>
        <Component {...props} />
      </PermissionGuard>
    )
  }
}

/**
 * 权限检查工具函数
 */
export const PermissionUtils = {
  /**
   * 检查是否为管理员
   */
  isAdmin: (userRole?: string) => userRole === 'ADMIN',

  /**
   * 检查是否为财务人员
   */
  isFinance: (userRole?: string) => ['ADMIN', 'FINANCE'].includes(userRole || ''),

  /**
   * 检查是否为客服人员
   */
  isCustomerService: (userRole?: string) =>
    ['ADMIN', 'CUSTOMER_SERVICE'].includes(userRole || ''),

  /**
   * 检查是否为管理人员
   */
  isManager: (userRole?: string) =>
    ['ADMIN', 'MANAGER'].includes(userRole || ''),

  /**
   * 获取角色级别
   */
  getRoleLevel: (userRole?: string) => {
    const levels = {
      'ADMIN': 0,
      'MANAGER': 1,
      'FINANCE': 2,
      'CUSTOMER_SERVICE': 3,
      'USER': 4
    }
    return levels[userRole as keyof typeof levels] || 999
  }
}