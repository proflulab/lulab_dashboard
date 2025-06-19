# 权限中间件使用指南

## 概述

权限中间件 (`permission.middleware.ts`) 提供了完整的路由级别权限验证功能，支持多种权限检查方式和性能优化。

## 功能特性

### 1. 多维度权限验证
- **权限代码检查**: 基于具体权限代码的精确控制
- **角色检查**: 基于用户角色的访问控制
- **级别检查**: 基于角色级别的层次化权限
- **组织检查**: 基于组织归属的权限控制
- **部门检查**: 基于部门归属的权限控制
- **资源权限**: 基于资源和操作的细粒度控制

### 2. 性能优化
- **内存缓存**: 5分钟TTL的权限信息缓存
- **批量检查**: 优化的权限验证算法
- **动态导入**: 避免在中间件层直接导入Prisma

### 3. 灵活配置
- **AND/OR模式**: 支持多条件的与/或逻辑
- **动态配置**: 支持运行时添加权限规则
- **精确/模糊匹配**: 支持路径的精确和模糊匹配

## 配置说明

### 权限配置接口

```typescript
interface PermissionConfig {
  permissions?: string[]        // 需要的权限代码
  roles?: string[]             // 需要的角色
  level?: number               // 需要的角色级别
  organizations?: string[]     // 需要的组织
  departments?: string[]       // 需要的部门
  resource?: string           // 资源标识
  action?: string             // 操作类型
  mode?: 'AND' | 'OR'         // 权限验证模式
}
```

### 路由权限配置示例

```typescript
const ROUTE_PERMISSIONS: Record<string, PermissionConfig> = {
  // 基础权限检查
  '/dashboard': { permissions: ['dashboard.view'], mode: 'OR' },
  
  // 角色级别检查
  '/dashboard/users': { permissions: ['user.view'], level: 3 },
  
  // 多角色检查
  '/dashboard/finance': { roles: ['FINANCE', 'ADMIN'], mode: 'OR' },
  
  // 复合权限检查
  '/dashboard/finance/reports': { 
    permissions: ['finance.reports'], 
    roles: ['FINANCE', 'ADMIN'], 
    mode: 'AND' 
  },
  
  // 超级管理员专用
  '/dashboard/settings/system': { permissions: ['system.config'], level: 0 }
}
```

### API权限配置示例

```typescript
const API_PERMISSIONS: Record<string, PermissionConfig> = {
  // RESTful API权限
  'GET /api/users': { permissions: ['users.view'] },
  'POST /api/users': { permissions: ['users.create'] },
  'PUT /api/users/[userId]': { permissions: ['users.edit'] },
  'DELETE /api/users/[userId]': { permissions: ['users.delete'] },
  
  // 复合API权限
  'PUT /api/orders/financial': { 
    permissions: ['order.financial'], 
    roles: ['FINANCE', 'ADMIN'] 
  }
}
```

## 使用方法

### 1. 在 middleware.ts 中集成

```typescript
import { permissionMiddleware } from '@/lib/middleware/permission.middleware'

export async function middleware(request: NextRequest) {
  // 其他中间件逻辑...
  
  // 权限验证
  const permissionResult = await permissionMiddleware(request)
  if (permissionResult) {
    return permissionResult
  }
  
  return NextResponse.next()
}
```

### 2. 动态添加权限配置

```typescript
import { addRoutePermission, addApiPermission } from '@/lib/middleware/permission.middleware'

// 添加路由权限
addRoutePermission('/custom/path', {
  permissions: ['custom.access'],
  level: 2
})

// 添加API权限
addApiPermission('POST', '/api/custom', {
  roles: ['ADMIN'],
  permissions: ['custom.create']
})
```

### 3. 缓存管理

```typescript
import { 
  clearUserPermissionCache, 
  clearAllPermissionCache 
} from '@/lib/middleware/permission.middleware'

// 清除特定用户缓存（用户权限变更时）
clearUserPermissionCache(userId)

// 清除所有缓存（系统维护时）
clearAllPermissionCache()
```

## 权限验证模式

### AND 模式（默认）
所有指定的权限条件都必须满足：

```typescript
{
  permissions: ['user.view', 'user.edit'],
  roles: ['ADMIN', 'MANAGER'],
  mode: 'AND'  // 必须同时拥有所有权限和角色
}
```

### OR 模式
满足任一权限条件即可：

```typescript
{
  permissions: ['user.view', 'user.edit'],
  roles: ['ADMIN', 'MANAGER'],
  mode: 'OR'   // 拥有任一权限或角色即可
}
```

## 角色级别说明

角色级别采用数字表示，数字越小级别越高：

- `0`: 超级管理员 (SUPER_ADMIN)
- `1`: 系统管理员 (ADMIN)
- `2`: 部门管理员 (MANAGER)
- `3`: 普通用户 (USER)
- `4`: 访客 (GUEST)

## 性能优化建议

### 1. 合理使用缓存
- 权限信息会自动缓存5分钟
- 用户权限变更后及时清除缓存
- 避免频繁的权限检查操作

### 2. 优化权限配置
- 使用精确的路径匹配而非过度依赖模糊匹配
- 合理设置权限粒度，避免过于细化
- 优先使用角色和级别检查，减少复杂的权限代码检查

### 3. 监控和调试
- 权限验证失败会记录错误日志
- 可以通过日志分析权限检查的性能
- 定期清理过期的权限缓存

## 错误处理

### 页面访问被拒绝
用户会被重定向到 `/dashboard/unauthorized` 页面

### API访问被拒绝
返回 HTTP 403 状态码和错误信息：

```json
{
  "error": "权限不足",
  "code": "INSUFFICIENT_PERMISSIONS"
}
```

## 安全考虑

1. **默认拒绝**: 权限验证失败时默认拒绝访问
2. **缓存安全**: 缓存数据不包含敏感信息
3. **错误处理**: 避免在错误信息中泄露系统内部信息
4. **会话验证**: 所有权限检查都基于有效的用户会话

## 扩展开发

### 自定义权限检查器

```typescript
// 扩展权限配置接口
interface CustomPermissionConfig extends PermissionConfig {
  customCheck?: (userId: string) => Promise<boolean>
}

// 在validatePermissions函数中添加自定义检查逻辑
if (config.customCheck) {
  const customResult = await config.customCheck(userId)
  checks.push(customResult)
}
```

### 权限变更通知

```typescript
// 权限变更时的回调处理
export function onPermissionChange(userId: string, changeType: string) {
  // 清除相关缓存
  clearUserPermissionCache(userId)
  
  // 发送权限变更通知
  // notifyPermissionChange(userId, changeType)
}
```