/**
 * 权限中间件类型定义
 * 提供完整的TypeScript类型支持
 */

// 权限验证模式
export type PermissionMode = 'AND' | 'OR'

// 角色级别枚举
export enum RoleLevel {
  SUPER_ADMIN = 0,
  ADMIN = 1,
  MANAGER = 2,
  USER = 3,
  GUEST = 4
}

// 权限操作类型
export type PermissionAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'view'
  | 'edit'
  | 'manage'
  | '*'  // 所有操作

// 资源类型
export type ResourceType =
  | 'USER'
  | 'ROLE'
  | 'PERMISSION'
  | 'ORGANIZATION'
  | 'DEPARTMENT'
  | 'PRODUCT'
  | 'ORDER'
  | 'FINANCE'
  | 'SYSTEM'
  | 'MENU'
  | string  // 允许自定义资源类型

// 权限配置接口
export interface PermissionConfig {
  /** 需要的权限代码列表 */
  permissions?: string[]
  /** 需要的角色列表 */
  roles?: string[]
  /** 需要的最低角色级别 */
  level?: RoleLevel | number
  /** 需要的组织列表 */
  organizations?: string[]
  /** 需要的部门列表 */
  departments?: string[]
  /** 资源标识 */
  resource?: ResourceType
  /** 操作类型 */
  action?: PermissionAction
  /** 权限验证模式（AND: 全部满足, OR: 满足其一） */
  mode?: PermissionMode
  /** 自定义权限检查函数 */
  customCheck?: (userId: string) => Promise<boolean>
  /** 权限描述 */
  description?: string
  /** 是否启用缓存 */
  enableCache?: boolean
}

// 权限缓存接口
export interface PermissionCache {
  /** 用户ID */
  userId: string
  /** 用户权限代码集合 */
  permissions: Set<string>
  /** 用户角色代码集合 */
  roles: Set<string>
  /** 用户最高角色级别 */
  level: number
  /** 用户组织代码集合 */
  organizations: Set<string>
  /** 用户部门代码集合 */
  departments: Set<string>
  /** 缓存创建时间戳 */
  timestamp: number
  /** 缓存生存时间（毫秒） */
  ttl: number
  /** 用户是否激活 */
  active: boolean
}

// 权限验证结果接口
export interface PermissionCheckResult {
  /** 是否有权限 */
  hasPermission: boolean
  /** 拒绝原因 */
  reason?: string
  /** 用户角色级别 */
  level?: number
  /** 检查耗时（毫秒） */
  duration?: number
  /** 是否使用了缓存 */
  fromCache?: boolean
}

// 路由权限映射类型
export type RoutePermissions = Record<string, PermissionConfig>

// API权限映射类型
export type ApiPermissions = Record<string, PermissionConfig>

// HTTP方法类型
export type HttpMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'DELETE'
  | 'PATCH'
  | 'HEAD'
  | 'OPTIONS'

// 权限中间件配置
export interface PermissionMiddlewareConfig {
  /** 缓存TTL（毫秒），默认5分钟 */
  cacheTTL?: number
  /** 最大缓存条目数，默认1000 */
  maxCacheSize?: number
  /** 是否启用权限缓存，默认true */
  enableCache?: boolean
  /** 是否启用详细日志，默认false */
  enableDetailedLogging?: boolean
  /** 未授权页面路径，默认'/dashboard/unauthorized' */
  unauthorizedPath?: string
  /** 登录页面路径，默认'/auth/signin' */
  signinPath?: string
  /** 公共路径列表（不需要权限检查） */
  publicPaths?: string[]
  /** 权限检查超时时间（毫秒），默认5000 */
  checkTimeout?: number
}

// 用户权限信息接口
export interface UserPermissionInfo {
  user: {
    id: string
    name: string | null
    email: string
    active: boolean
  }
  organizations: Array<{
    id: string
    code: string
    name: string
    level: number
    active: boolean
  }>
  departments: Array<{
    id: string
    code: string
    name: string
    active: boolean
  }>
  roles: Array<{
    id: string
    code: string
    name: string
    level: number
    active: boolean
  }>
  permissions: Array<{
    id: string
    code: string
    name: string
    resource?: string | null
    action?: string | null
    level?: number | null
    active: boolean
  }>
  dataPermissions: string[]
}

// 权限变更事件类型
export type PermissionChangeEvent =
  | 'USER_ROLE_CHANGED'
  | 'USER_PERMISSION_CHANGED'
  | 'USER_ORGANIZATION_CHANGED'
  | 'USER_DEPARTMENT_CHANGED'
  | 'USER_ACTIVATED'
  | 'USER_DEACTIVATED'
  | 'ROLE_PERMISSION_CHANGED'
  | 'PERMISSION_UPDATED'
  | 'ORGANIZATION_UPDATED'
  | 'DEPARTMENT_UPDATED'

// 权限变更回调函数类型
export type PermissionChangeCallback = (
  userId: string,
  event: PermissionChangeEvent,
  details?: Record<string, any>
) => void | Promise<void>

// 权限统计信息
export interface PermissionStats {
  /** 缓存命中率 */
  cacheHitRate: number
  /** 总权限检查次数 */
  totalChecks: number
  /** 缓存命中次数 */
  cacheHits: number
  /** 平均检查耗时（毫秒） */
  averageCheckTime: number
  /** 当前缓存条目数 */
  currentCacheSize: number
  /** 权限拒绝次数 */
  deniedCount: number
  /** 最近的权限检查记录 */
  recentChecks: Array<{
    userId: string
    path: string
    method?: string
    result: boolean
    timestamp: number
    duration: number
  }>
}

// 权限审计日志
export interface PermissionAuditLog {
  /** 日志ID */
  id: string
  /** 用户ID */
  userId: string
  /** 访问路径 */
  path: string
  /** HTTP方法 */
  method?: string
  /** 权限检查结果 */
  result: boolean
  /** 拒绝原因 */
  reason?: string
  /** 用户IP地址 */
  ipAddress?: string
  /** 用户代理 */
  userAgent?: string
  /** 检查耗时 */
  duration: number
  /** 是否使用缓存 */
  fromCache: boolean
  /** 时间戳 */
  timestamp: number
}

// 所有类型已通过interface和type声明自动导出