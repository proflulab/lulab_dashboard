/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-06-18 22:29:50
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-06-26 15:52:12
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
export { organizationService } from './services/organization.service'
export { departmentService } from './services/department.service'

// 也可以作为默认导出
import { orderService } from './services/order.service'
import { refundService } from './services/refund.service'
import { userService } from './services/user.service'
import { dashboardService } from './services/dashboard.service'
import { permissionService } from './services/permission.service'
import { organizationService } from './services/organization.service'
import { departmentService } from './services/department.service'

const db = {
  order: orderService,
  refund: refundService,
  user: userService,
  dashboard: dashboardService,
  permission: permissionService,
  organization: organizationService,
  department: departmentService,
}

export default db
