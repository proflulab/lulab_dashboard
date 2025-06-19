/*
 * 权限中间件
 * 用于路由级别的权限验证
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import type {
  PermissionConfig,
  PermissionCache,
  PermissionCheckResult,
  RoutePermissions,
  ApiPermissions,
  HttpMethod,
  PermissionMiddlewareConfig,
  UserPermissionInfo
} from './types'

// 默认中间件配置
const DEFAULT_CONFIG: PermissionMiddlewareConfig = {
  cacheTTL: 5 * 60 * 1000, // 5分钟
  maxCacheSize: 1000,
  enableCache: true,
  enableDetailedLogging: false,
  unauthorizedPath: '/dashboard/unauthorized',
  signinPath: '/auth/signin',
  publicPaths: ['/auth', '/api/auth', '/'],
  checkTimeout: 5000
}

// 内存缓存存储
const permissionCache = new Map<string, PermissionCache>()
let middlewareConfig = { ...DEFAULT_CONFIG }

/**
 * 配置权限中间件
 */
export function configurePermissionMiddleware(config: Partial<PermissionMiddlewareConfig>): void {
  middlewareConfig = { ...middlewareConfig, ...config }
}

/**
 * 获取当前中间件配置
 */
export function getPermissionMiddlewareConfig(): PermissionMiddlewareConfig {
  return { ...middlewareConfig }
}

// 路由权限配置映射
const ROUTE_PERMISSIONS: RoutePermissions = {
  // 仪表板
  '/dashboard': { permissions: ['dashboard.view'], mode: 'OR' },

  // 用户管理
  '/dashboard/users': { permissions: ['user.view'], level: 3 },
  '/dashboard/users/create': { permissions: ['user.create'], level: 2 },
  '/dashboard/users/edit': { permissions: ['user.edit'], level: 2 },
  '/dashboard/users/delete': { permissions: ['user.delete'], level: 1 },

  // 角色管理
  '/dashboard/roles': { permissions: ['role.view'], level: 2 },
  '/dashboard/roles/create': { permissions: ['role.create'], level: 1 },
  '/dashboard/roles/edit': { permissions: ['role.edit'], level: 1 },

  // 权限管理
  '/dashboard/permissions': { permissions: ['permission.view'], level: 1 },

  // 组织管理
  '/dashboard/organizations': { permissions: ['organization.view'], level: 2 },
  '/dashboard/organizations/create': { permissions: ['organization.create'], level: 1 },

  // 产品管理
  '/dashboard/products': { permissions: ['product.view'], level: 3 },
  '/dashboard/products/create': { permissions: ['product.create'], level: 2 },
  '/dashboard/products/edit': { permissions: ['product.edit'], level: 2 },

  // 订单管理
  '/dashboard/orders': { permissions: ['order.view'], level: 3 },
  '/dashboard/orders/create': { permissions: ['order.create'], level: 3 },
  '/dashboard/orders/edit': { permissions: ['order.edit'], level: 2 },
  '/dashboard/orders/financial': { permissions: ['order.financial'], roles: ['FINANCE', 'ADMIN'], mode: 'OR' },

  // 财务管理
  '/dashboard/finance': { roles: ['FINANCE', 'ADMIN'], mode: 'OR' },
  '/dashboard/finance/reports': { permissions: ['finance.reports'], roles: ['FINANCE', 'ADMIN'], mode: 'AND' },

  // 系统设置
  '/dashboard/settings': { level: 1 },
  '/dashboard/settings/system': { permissions: ['system.config'], level: 0 }
}

// API 权限配置
const API_PERMISSIONS: ApiPermissions = {
  // 用户相关API
  'GET /api/users': { permissions: ['users.view'] },
  'POST /api/users': { permissions: ['users.create'] },
  'GET /api/users/[userId]': { permissions: ['users.view'] },
  'PUT /api/users/[userId]': { permissions: ['users.edit'] },
  'DELETE /api/users/[userId]': { permissions: ['users.delete'] },
  'POST /api/users/[userId]/restore': { permissions: ['users.restore'] },
  'PUT /api/users/[userId]/status': { permissions: ['users.status'] },
  'GET /api/users/stats': { permissions: ['users.stats'] },
  'GET /api/users/search': { permissions: ['users.search'] },
  'POST /api/users/search': { permissions: ['users.search'] },
  'POST /api/users/batch': { permissions: ['users.batch.create'] },
  'PUT /api/users/batch': { permissions: ['users.batch.update'] },

  // 产品 API
  'GET /api/products': { permissions: ['product.view'] },
  'POST /api/products': { permissions: ['product.create'] },
  'PUT /api/products': { permissions: ['product.edit'] },
  'DELETE /api/products': { permissions: ['product.delete'] },

  // 订单 API
  'GET /api/orders': { permissions: ['order.view'] },
  'POST /api/orders': { permissions: ['order.create'] },
  'PUT /api/orders': { permissions: ['order.edit'] },
  'PUT /api/orders/financial': { permissions: ['order.financial'], roles: ['FINANCE', 'ADMIN'] },

  // 财务 API
  'GET /api/finance': { roles: ['FINANCE', 'ADMIN'] },
  'GET /api/finance/reports': { permissions: ['finance.reports'] },

  // 系统 API
  'GET /api/system': { level: 1 },
  'POST /api/system': { permissions: ['system.config'], level: 0 }
}

/**
 * 获取用户权限缓存
 */
function getUserPermissionCache(userId: string): PermissionCache | null {
  const cache = permissionCache.get(userId)
  if (!cache) return null

  // 检查缓存是否过期
  if (Date.now() - cache.timestamp > cache.ttl) {
    permissionCache.delete(userId)
    return null
  }

  return cache
}

/**
 * 设置用户权限缓存
 */
function setUserPermissionCache(userId: string, userInfo: UserPermissionInfo): void {
  if (!middlewareConfig.enableCache) return

  const cache: PermissionCache = {
    userId,
    permissions: new Set(userInfo.permissions.map(p => p.code)),
    roles: new Set(userInfo.roles.map(r => r.code)),
    level: userInfo.roles.length > 0 ? Math.min(...userInfo.roles.map(r => r.level)) : 999,
    organizations: new Set(userInfo.organizations.map(o => o.code)),
    departments: new Set(userInfo.departments.map(d => d.code)),
    timestamp: Date.now(),
    ttl: middlewareConfig.cacheTTL!,
    active: userInfo.user.active
  }

  permissionCache.set(userId, cache)

  // 清理过期缓存（优化的LRU策略）
  if (permissionCache.size > middlewareConfig.maxCacheSize!) {
    cleanupExpiredCache()
  }
}

/**
 * 清理过期缓存
 */
function cleanupExpiredCache(): void {
  const now = Date.now()
  const expiredKeys: string[] = []

  for (const [key, value] of permissionCache.entries()) {
    if (now - value.timestamp > value.ttl) {
      expiredKeys.push(key)
    }
  }

  expiredKeys.forEach(key => permissionCache.delete(key))

  // 如果清理后仍然超过限制，删除最旧的缓存
  if (permissionCache.size > middlewareConfig.maxCacheSize!) {
    const sortedEntries = Array.from(permissionCache.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp)

    const toDelete = sortedEntries.slice(0, permissionCache.size - middlewareConfig.maxCacheSize!)
    toDelete.forEach(([key]) => permissionCache.delete(key))
  }
}

/**
 * 清除用户权限缓存
 */
export function clearUserPermissionCache(userId: string): void {
  permissionCache.delete(userId)
}

/**
 * 清除所有权限缓存
 */
export function clearAllPermissionCache(): void {
  permissionCache.clear()
}

/**
 * 权限验证中间件
 */
export async function permissionMiddleware(request: NextRequest): Promise<NextResponse | undefined> {
  const startTime = Date.now()
  const { pathname } = request.nextUrl
  const method = request.method as HttpMethod

  try {
    // 检查是否为公共路径
    if (isPublicPath(pathname)) {
      return NextResponse.next()
    }

    // 获取当前用户会话
    const session = await auth()

    if (!session?.user?.id) {
      if (middlewareConfig.enableDetailedLogging) {
        console.log(`[权限中间件] 未认证用户访问: ${pathname}`)
      }
      return NextResponse.redirect(new URL(middlewareConfig.signinPath!, request.url))
    }

    const userId = session.user.id

    // 确定权限配置
    let permissionConfig: PermissionConfig | undefined

    if (pathname.startsWith('/api/')) {
      // API 路由权限检查
      const apiKey = `${method} ${pathname}`
      permissionConfig = API_PERMISSIONS[apiKey] || findMatchingApiPermission(method, pathname)
    } else {
      // 页面路由权限检查
      permissionConfig = ROUTE_PERMISSIONS[pathname] || findMatchingRoutePermission(pathname)
    }

    // 如果没有配置权限要求，允许访问
    if (!permissionConfig) {
      if (middlewareConfig.enableDetailedLogging) {
        console.log(`[权限中间件] 无权限配置，允许访问: ${pathname}`)
      }
      return NextResponse.next()
    }

    // 执行权限验证
    const checkResult = await validatePermissionsWithResult(userId, permissionConfig, startTime)

    if (middlewareConfig.enableDetailedLogging) {
      console.log(`[权限中间件] 用户 ${userId} 访问 ${pathname}: ${checkResult.hasPermission ? '允许' : '拒绝'} (${checkResult.duration}ms)${checkResult.fromCache ? ' [缓存]' : ''}`)
    }

    if (!checkResult.hasPermission) {
      if (pathname.startsWith('/api/')) {
        // API 返回 403
        return NextResponse.json(
          {
            error: '权限不足',
            code: 'INSUFFICIENT_PERMISSIONS',
            reason: checkResult.reason
          },
          { status: 403 }
        )
      } else {
        // 页面重定向到无权限页面
        return NextResponse.redirect(new URL(middlewareConfig.unauthorizedPath!, request.url))
      }
    }

    return NextResponse.next()
  } catch (error) {
    console.error('[权限中间件] 验证失败:', error)

    // 发生错误时，为安全起见拒绝访问
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: '权限验证失败', code: 'PERMISSION_CHECK_ERROR' },
        { status: 500 }
      )
    } else {
      return NextResponse.redirect(new URL(middlewareConfig.unauthorizedPath!, request.url))
    }
  }
}

/**
 * 检查是否为公共路径
 */
function isPublicPath(pathname: string): boolean {
  return middlewareConfig.publicPaths!.some(publicPath =>
    pathname.startsWith(publicPath)
  )
}

/**
 * 查找匹配的路由权限配置
 */
function findMatchingRoutePermission(pathname: string): PermissionConfig | undefined {
  // 精确匹配
  if (ROUTE_PERMISSIONS[pathname]) {
    return ROUTE_PERMISSIONS[pathname]
  }

  // 模糊匹配（从最具体到最一般）
  const segments = pathname.split('/').filter(Boolean)

  for (let i = segments.length; i > 0; i--) {
    const partialPath = '/' + segments.slice(0, i).join('/')
    if (ROUTE_PERMISSIONS[partialPath]) {
      return ROUTE_PERMISSIONS[partialPath]
    }
  }

  return undefined
}

/**
 * 查找匹配的 API 权限配置
 */
function findMatchingApiPermission(method: string, pathname: string): PermissionConfig | undefined {
  // 精确匹配
  const exactKey = `${method} ${pathname}`
  if (API_PERMISSIONS[exactKey]) {
    return API_PERMISSIONS[exactKey]
  }

  // 模糊匹配
  const segments = pathname.split('/').filter(Boolean)

  for (let i = segments.length; i > 0; i--) {
    const partialPath = '/' + segments.slice(0, i).join('/')
    const partialKey = `${method} ${partialPath}`
    if (API_PERMISSIONS[partialKey]) {
      return API_PERMISSIONS[partialKey]
    }
  }

  return undefined
}

/**
 * 验证用户权限并返回详细结果
 */
async function validatePermissionsWithResult(
  userId: string,
  config: PermissionConfig,
  startTime: number
): Promise<PermissionCheckResult> {
  const result = await validatePermissions(userId, config)
  return {
    hasPermission: result,
    duration: Date.now() - startTime,
    fromCache: getUserPermissionCache(userId) !== null
  }
}

/**
 * 验证用户权限（优化版本，支持缓存）
 * 实现真正的权限验证逻辑
 */
async function validatePermissions(
  userId: string,
  config: PermissionConfig
): Promise<boolean> {
  try {
    const mode = config.mode || 'AND'
    const checks: boolean[] = []

    // 尝试从缓存获取权限信息
    let cache = getUserPermissionCache(userId)
    let userInfo: any = null

    if (!cache) {
      // 缓存未命中，从数据库获取
      const { PermissionService } = await import('@/lib/services/permission.service')
      userInfo = await PermissionService.getUserPermissionInfo(userId)

      if (!userInfo) {
        return false
      }

      // 检查用户是否激活
      if (!userInfo.user.active) {
        return false
      }

      // 设置缓存
      setUserPermissionCache(userId, userInfo)
      cache = getUserPermissionCache(userId)!
    }

    // 超级管理员拥有所有权限
    if (cache.roles.has('ADMIN')) {
      return true
    }

    // 检查权限代码（使用缓存）
    if (config.permissions && config.permissions.length > 0) {
      const permissionChecks = config.permissions.map(permissionCode =>
        cache.permissions.has(permissionCode)
      )

      if (mode === 'AND') {
        checks.push(permissionChecks.every(Boolean))
      } else {
        checks.push(permissionChecks.some(Boolean))
      }
    }

    // 检查角色（使用缓存）
    if (config.roles && config.roles.length > 0) {
      const hasRequiredRole = config.roles.some(roleCode =>
        cache.roles.has(roleCode)
      )
      checks.push(hasRequiredRole)
    }

    // 检查角色级别（使用缓存）
    if (config.level !== undefined) {
      const hasPermission = cache.level <= config.level
      checks.push(hasPermission)
    }

    // 检查组织（使用缓存）
    if (config.organizations && config.organizations.length > 0) {
      const organizationChecks = config.organizations.map(orgCode =>
        cache.organizations.has(orgCode)
      )

      if (mode === 'AND') {
        checks.push(organizationChecks.every(Boolean))
      } else {
        checks.push(organizationChecks.some(Boolean))
      }
    }

    // 检查部门（使用缓存）
    if (config.departments && config.departments.length > 0) {
      const departmentChecks = config.departments.map(deptCode =>
        cache.departments.has(deptCode)
      )

      if (mode === 'AND') {
        checks.push(departmentChecks.every(Boolean))
      } else {
        checks.push(departmentChecks.some(Boolean))
      }
    }

    // 检查资源访问权限（需要动态检查，无法缓存）
    if (config.resource && config.action) {
      // 对于资源权限，仍需要调用服务进行检查
      if (!userInfo) {
        const { PermissionService } = await import('@/lib/services/permission.service')
        userInfo = await PermissionService.getUserPermissionInfo(userId)
      }

      if (userInfo) {
        const hasResourceAccess = userInfo.permissions.some((p: any) =>
          p.resource === config.resource &&
          (p.action === config.action || p.action === '*') &&
          p.active
        )
        checks.push(hasResourceAccess)
      } else {
        checks.push(false)
      }
    }

    // 如果没有任何检查项，默认允许访问
    if (checks.length === 0) {
      return true
    }

    // 根据模式返回结果
    if (mode === 'AND') {
      return checks.every(Boolean)
    } else {
      return checks.some(Boolean)
    }
  } catch (error) {
    console.error('权限验证失败:', error)
    // 权限验证失败时，为了安全起见，拒绝访问
    return false
  }
}

/**
 * 导出权限配置（用于动态配置）
 */
export { ROUTE_PERMISSIONS, API_PERMISSIONS }

/**
 * 添加路由权限配置
 */
export function addRoutePermission(path: string, config: PermissionConfig) {
  ROUTE_PERMISSIONS[path] = config
}

/**
 * 添加 API 权限配置
 */
export function addApiPermission(method: string, path: string, config: PermissionConfig) {
  const key = `${method} ${path}`
  API_PERMISSIONS[key] = config
}