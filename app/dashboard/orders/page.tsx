import { orderService } from '@/lib/db'
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Plus, MoreHorizontal, Edit, Trash2, Eye, CreditCard, Package, DollarSign } from "lucide-react"

import { Decimal } from '@prisma/client/runtime/library'

interface OrderWithRelations {
  id: number
  orderCode: string
  externalOrderId?: string
  productName?: string
  customerEmail?: string
  userId?: string
  currentOwnerId?: string
  financialCloserId?: string
  financialClosedAt?: Date
  financialClosed: boolean
  amountPaid?: Decimal | null
  currency?: string
  amountPaidCny?: Decimal | null
  paidAt?: Date
  effectiveDate?: Date
  benefitStartDate?: Date
  benefitDurationDays?: number
  activeDays?: number
  benefitDaysRemaining?: number
  createdAt: Date
  updatedAt: Date
  user?: {
    id: string
    name?: string
    email: string
    image?: string
  }
  currentOwner?: {
    id: string
    name?: string
    email: string
  }
  financialCloser?: {
    id: string
    name?: string
    email: string
  }
  refunds: Array<{
    id: number
    afterSaleCode?: string
    orderId?: number
    submittedAt?: Date
    refundedAt?: Date
    refundChannel?: string
    approvalUrl?: string
    createdBy?: string
    refundAmount?: Decimal
    refundReason?: string
    benefitEndedAt?: Date
    benefitUsedDays?: number
    applicantName?: string
    isFinancialSettled: boolean
    financialSettledAt?: Date
    financialNote?: string
    parentId?: number
    productCategory?: string
    createdAt: Date
    updatedAt: Date
    creator?: {
      id: string
      name?: string | null
      email: string
      createdAt: Date
      updatedAt: Date
      password?: string | null
      emailVerifiedAt?: Date | null
      avatar?: string | null
    }
  }>
}

export default async function OrdersPage() {
  const orders = await orderService.getAll() as OrderWithRelations[]

  // 统计数据
  const totalRevenue = orders.filter((o) => o.financialClosed).reduce((sum: number, order) => {
    const amount = order.amountPaidCny ? order.amountPaidCny.toNumber() : 0
    return sum + amount
  }, 0)
  const pendingOrders = orders.filter((o) => !o.financialClosed).length
  const completedOrders = orders.filter((o) => o.financialClosed).length

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">订单管理</h1>
          <p className="text-muted-foreground">
            管理和查看所有订单信息
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          创建订单
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总订单数</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
            <p className="text-xs text-muted-foreground">
              待处理 {pendingOrders} 个
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总收入</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              已完成订单收入
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待支付订单</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingOrders}</div>
            <p className="text-xs text-muted-foreground">
              需要跟进处理
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已完成订单</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedOrders}</div>
            <p className="text-xs text-muted-foreground">
              成功交付课程
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>订单列表</CardTitle>
          <CardDescription>
            共 {orders.length} 个订单
          </CardDescription>
        </CardHeader>
        <CardContent>


          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>订单信息</TableHead>
                  <TableHead>学员</TableHead>
                  <TableHead>课程</TableHead>
                  <TableHead>金额</TableHead>
                  <TableHead>支付信息</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>订单日期</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div className="font-medium">{order.orderCode}</div>
                      {order.externalOrderId && (
                        <div className="text-sm text-muted-foreground">
                          外部订单: {order.externalOrderId}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={order.user?.image || ''} />
                          <AvatarFallback>
                            {(order.user?.name || order.customerEmail || 'U').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{order.user?.name || '未知用户'}</div>
                          <div className="text-sm text-muted-foreground">
                            {order.user?.email || order.customerEmail || '无邮箱'}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{order.productName || '未知产品'}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-green-600">
                        {order.currency === 'USD' ? '$' : '¥'}{order.amountPaid ? order.amountPaid.toNumber().toLocaleString() : '0'}
                        {order.currency === 'USD' && order.amountPaidCny && (
                          <div className="text-xs text-muted-foreground">
                            ≈ ¥{order.amountPaidCny.toNumber().toLocaleString()}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {order.currency || 'CNY'}
                        {order.paidAt && (
                          <div className="text-xs text-muted-foreground">
                            {new Date(order.paidAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={order.financialClosed ? 'default' : 'outline'}>
                        {order.financialClosed ? '已结单' : '未结单'}
                      </Badge>
                      {order.refunds.length > 0 && (
                        <Badge variant="destructive" className="ml-1">
                          有退款
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                      {order.effectiveDate && (
                        <div className="text-xs text-muted-foreground">
                          生效: {new Date(order.effectiveDate).toLocaleDateString()}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>操作</DropdownMenuLabel>
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            查看详情
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            编辑订单
                          </DropdownMenuItem>
                          {!order.financialClosed && (
                            <DropdownMenuItem>
                              <CreditCard className="mr-2 h-4 w-4" />
                              财务结单
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            删除订单
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {orders.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">暂无订单数据</p>
            </div>
          )}

          {/* 分页控件 */}

        </CardContent>
      </Card>
    </div>
  )
}