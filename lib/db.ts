// 统一导出所有服务
export { orderService } from './services/order.service'
export { refundService } from './services/refund.service'
export { userService } from './services/user.service'

// 也可以作为默认导出
import { orderService } from './services/order.service'
import { refundService } from './services/refund.service'
import { userService } from './services/user.service'

const db = {
  order: orderService,
  refund: refundService,
  user: userService,
}

export default db
