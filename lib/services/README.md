# 数据库服务层

这个目录包含了按业务领域拆分的数据库服务模块，提高了代码的可维护性和模块化程度。

## 文件结构

```
lib/
├── db.ts              # 统一的服务导出入口
├── services/
│   ├── order.service.ts     # 订单相关操作
│   ├── refund.service.ts    # 退款相关操作
│   ├── user.service.ts      # 用户相关操作
│   ├── dashboard.service.ts # 仪表板统计数据操作
│   └── README.md            # 说明文档
└── ...
```

## 使用方式

### 方式一：从统一入口导入（推荐）

```typescript
// 导入单个服务
import { orderService, refundService, userService, dashboardService } from '@/lib/db'

// 或者导入默认对象
import services from '@/lib/db'
const orders = await services.order.getAll()
const stats = await services.dashboard.getStats()
```

### 方式二：直接导入特定服务

```typescript
import { orderService } from '@/lib/services/order.service'
import { refundService } from '@/lib/services/refund.service'
import { userService } from '@/lib/services/user.service'
import { dashboardService } from '@/lib/services/dashboard.service'
```

## 服务说明

### orderService
订单相关的数据库操作，包括：
- `getAll()` - 获取所有订单
- `getById(id)` - 根据ID获取订单
- `create(data)` - 创建新订单
- `update(id, data)` - 更新订单
- `delete(id)` - 删除订单
- `closeFinancially(id, closerId)` - 财务关闭订单

### refundService
退款相关的数据库操作，包括：
- `getAll()` - 获取所有退款记录
- `getById(id)` - 根据ID获取退款记录
- `getByOrderId(orderId)` - 根据订单ID获取退款记录
- `create(data)` - 创建新退款记录
- `update(id, data)` - 更新退款记录
- `delete(id)` - 删除退款记录
- `settleFinancially(id, note)` - 财务结算退款

### userService
用户相关的数据库操作，包括：
- `getAll()` - 获取所有用户
- `getById(id)` - 根据ID获取用户
- `getByEmail(email)` - 根据邮箱获取用户
- `create(data)` - 创建新用户
- `update(id, data)` - 更新用户信息
- `delete(id)` - 删除用户

### dashboardService
仪表板统计数据相关操作，包括：
- `getStats()` - 获取仪表板核心统计数据（用户数、订单数、收入等）
- `getTrends()` - 获取趋势数据（增长率等）
- `getChartData(days)` - 获取图表数据（每日订单、月收入、用户注册等）
- `getUserActivityStats()` - 获取用户活跃度统计

## 扩展指南

当需要添加新的业务领域服务时：

1. 在 `services/` 目录下创建新的服务文件，如 `product.service.ts`
2. 按照现有服务的模式实现相关方法
3. 在 `index.ts` 中添加导出
4. 更新此 README 文档

## 迁移建议

对于现有代码，建议逐步迁移到新的导入方式：

**新代码推荐使用：**
```typescript
import { orderService, refundService, userService, dashboardService } from '@/lib/db'
```

**或者按需导入：**
```typescript
import { orderService } from '@/lib/services/order.service'
```

1. 统一使用 `@/lib/db` 作为服务导入入口
2. 考虑按页面或功能模块只导入需要的服务，而不是全部导入
3. 新功能直接使用新的服务结构