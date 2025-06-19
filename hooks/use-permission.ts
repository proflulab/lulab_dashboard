/*
 * 权限验证 Hook
 * 用于在 React 组件中进行权限验证
 */

'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState, useCallback } from 'react'

// 本地权限类型定义
interface Permission {
  id: string
  code: string
  name: string
  description?: string
  resource?: string
  action?: string
  createdAt: Date
  updatedAt: Date
}

// 权限检查结果接口
interface PermissionResult {
  hasPermission: boolean
  loading: boolean
  error?: string
}

// 权限信息接口
interface UserPermissions {
  permissions: Permission[]
  roles: string[]
  organizations: string[]
  departments: string[]
  level: number
}

/**
 * 权限验证 Hook
 */
export function usePermission(permissionCode?: string): PermissionResult {
  const { data: session, status } = useSession()
  const [result, setResult] = useState<PermissionResult>({
    hasPermission: false,
    loading: true
  })

  useEffect(() => {
    if (status === 'loading') {
      setResult({ hasPermission: false, loading: true })
      return
    }

    if (!session?.user?.id) {
      setResult({ hasPermission: false, loading: false, error: '用户未登录' })
      return
    }

    if (!permissionCode) {
      setResult({ hasPermission: true, loading: false })
      return
    }

    // 检查权限
    checkPermission(session.user.id, permissionCode)
      .then(hasPermission => {
        setResult({ hasPermission, loading: false })
      })
      .catch(error => {
        setResult({ hasPermission: false, loading: false, error: error.message })
      })
  }, [session, status, permissionCode])

  return result
}

/**
 * 多权限验证 Hook
 */
export function useMultiplePermissions(
  permissionCodes: string[],
  mode: 'AND' | 'OR' = 'AND'
): PermissionResult {
  const { data: session, status } = useSession()
  const [result, setResult] = useState<PermissionResult>({
    hasPermission: false,
    loading: true
  })

  useEffect(() => {
    if (status === 'loading') {
      setResult({ hasPermission: false, loading: true })
      return
    }

    if (!session?.user?.id) {
      setResult({ hasPermission: false, loading: false, error: '用户未登录' })
      return
    }

    if (permissionCodes.length === 0) {
      setResult({ hasPermission: true, loading: false })
      return
    }

    // 批量检查权限
    checkMultiplePermissions(session.user.id, permissionCodes, mode)
      .then(hasPermission => {
        setResult({ hasPermission, loading: false })
      })
      .catch(error => {
        setResult({ hasPermission: false, loading: false, error: error.message })
      })
  }, [session, status, JSON.stringify(permissionCodes), mode])

  return result
}

/**
 * 角色验证 Hook
 */
export function useRole(roleCodes: string[], mode: 'AND' | 'OR' = 'OR'): PermissionResult {
  const { data: session, status } = useSession()
  const [result, setResult] = useState<PermissionResult>({
    hasPermission: false,
    loading: true
  })

  useEffect(() => {
    if (status === 'loading') {
      setResult({ hasPermission: false, loading: true })
      return
    }

    if (!session?.user?.id) {
      setResult({ hasPermission: false, loading: false, error: '用户未登录' })
      return
    }

    // 如果没有提供角色代码，直接返回false
    if (!roleCodes || roleCodes.length === 0) {
      setResult({ hasPermission: false, loading: false })
      return
    }

    // 检查角色
    checkRole(session.user.id, roleCodes, mode)
      .then(hasPermission => {
        setResult({ hasPermission, loading: false })
      })
      .catch(error => {
        console.error('useRole hook错误:', error)
        setResult({ hasPermission: false, loading: false, error: error.message })
      })
  }, [session, status, JSON.stringify(roleCodes), mode])

  return result
}

/**
 * 角色级别验证 Hook
 */
export function useRoleLevel(requiredLevel: number): PermissionResult {
  const { data: session, status } = useSession()
  const [result, setResult] = useState<PermissionResult>({
    hasPermission: false,
    loading: true
  })

  useEffect(() => {
    if (status === 'loading') {
      setResult({ hasPermission: false, loading: true })
      return
    }

    if (!session?.user?.id) {
      setResult({ hasPermission: false, loading: false, error: '用户未登录' })
      return
    }

    // 检查角色级别
    checkRoleLevel(session.user.id, requiredLevel)
      .then(hasPermission => {
        setResult({ hasPermission, loading: false })
      })
      .catch(error => {
        setResult({ hasPermission: false, loading: false, error: error.message })
      })
  }, [session, status, requiredLevel])

  return result
}

/**
 * 获取用户权限信息 Hook
 */
export function useUserPermissions(): {
  permissions: UserPermissions | null
  loading: boolean
  error?: string
  refetch: () => void
} {
  const { data: session, status } = useSession()
  const [permissions, setPermissions] = useState<UserPermissions | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | undefined>()

  const fetchPermissions = useCallback(async () => {
    if (!session?.user?.id) {
      setPermissions(null)
      setLoading(false)
      setError('用户未登录')
      return
    }

    try {
      setLoading(true)
      setError(undefined)

      const response = await fetch(`/api/permissions/user/${session.user.id}`)
      if (!response.ok) {
        throw new Error('获取权限信息失败')
      }

      const data = await response.json()
      setPermissions(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误')
      setPermissions(null)
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id])

  useEffect(() => {
    if (status === 'loading') {
      setLoading(true)
      return
    }

    fetchPermissions()
  }, [status, session?.user?.id])

  return {
    permissions,
    loading,
    error,
    refetch: fetchPermissions
  }
}

/**
 * 获取用户菜单权限 Hook
 */
export function useMenuPermissions(): {
  menuTree: Permission[]
  loading: boolean
  error?: string
} {
  const { data: session, status } = useSession()
  const [menuTree, setMenuTree] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | undefined>()

  useEffect(() => {
    if (status === 'loading') {
      setLoading(true)
      return
    }

    if (!session?.user?.id) {
      setMenuTree([])
      setLoading(false)
      setError('用户未登录')
      return
    }

    // 获取菜单权限
    fetch(`/api/permissions/menu/${session.user.id}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('获取菜单权限失败')
        }
        return response.json()
      })
      .then(data => {
        setMenuTree(data)
        setLoading(false)
        setError(undefined)
      })
      .catch(err => {
        setError(err.message)
        setMenuTree([])
        setLoading(false)
      })
  }, [session, status])

  return { menuTree, loading, error }
}

// 辅助函数：检查单个权限
async function checkPermission(userId: string, permissionCode: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/permissions/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        // userId参数不需要显式传递，API会从session中获取
        permission: permissionCode
      })
    })

    if (!response.ok) {
      throw new Error('权限检查失败')
    }

    const result = await response.json()
    return result.hasPermission
  } catch (error) {
    console.error('权限检查错误:', error)
    return false
  }
}

// 辅助函数：批量检查权限
async function checkMultiplePermissions(
  userId: string,
  permissionCodes: string[],
  mode: 'AND' | 'OR'
): Promise<boolean> {
  try {
    const response = await fetch(`/api/permissions/check-multiple`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        // userId参数不需要显式传递，API会从session中获取
        permissions: permissionCodes,
        mode
      })
    })

    if (!response.ok) {
      throw new Error('权限检查失败')
    }

    const result = await response.json()
    return result.hasPermission
  } catch (error) {
    console.error('权限检查错误:', error)
    return false
  }
}

// 辅助函数：检查角色
async function checkRole(
  userId: string,
  roleCodes: string[],
  mode: 'AND' | 'OR'
): Promise<boolean> {
  try {
    console.log('开始角色检查:', { userId, roleCodes, mode })

    // 如果没有提供角色代码，直接返回false
    if (!roleCodes || roleCodes.length === 0) {
      console.log('角色代码为空，返回false')
      return false
    }

    const response = await fetch(`/api/permissions/check-role`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        // userId参数不需要显式传递，API会从session中获取
        roles: roleCodes,
        mode
      })
    })

    console.log('角色检查响应状态:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('角色检查API错误:', { status: response.status, error: errorText })
      throw new Error(`角色检查失败: ${response.status} - ${errorText}`)
    }

    const result = await response.json()
    console.log('角色检查结果:', result)
    return result.hasPermission
  } catch (error) {
    console.error('角色检查错误:', error)
    // 对于权限检查失败，返回false而不是抛出错误
    return false
  }
}

// 辅助函数：检查角色级别
async function checkRoleLevel(userId: string, requiredLevel: number): Promise<boolean> {
  try {
    const response = await fetch(`/api/permissions/check-level`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        // userId参数不需要显式传递，API会从session中获取
        level: requiredLevel
      })
    })

    if (!response.ok) {
      throw new Error('角色级别检查失败')
    }

    const result = await response.json()
    return result.hasPermission
  } catch (error) {
    console.error('角色级别检查错误:', error)
    return false
  }
}