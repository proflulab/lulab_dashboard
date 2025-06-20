/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-06-18 22:29:50
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-06-20 19:32:48
 * @FilePath: /lulab_dashboard/lib/db.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */

// 统一导出所有服务
export { orderService } from './services/order.service'
export { refundService } from './services/refund.service'
export { userService } from './services/user.service'
export { dashboardService } from './services/dashboard.service'
export { permissionService } from './services/permission.service'

// 也可以作为默认导出
import { orderService } from './services/order.service'
import { refundService } from './services/refund.service'
import { userService } from './services/user.service'
import { dashboardService } from './services/dashboard.service'
import { permissionService } from './services/permission.service'

const db = {
  order: orderService,
  refund: refundService,
  user: userService,
  dashboard: dashboardService,
  permission: permissionService,
}

export default db
