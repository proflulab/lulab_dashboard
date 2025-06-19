import { prisma } from '../prisma'

// 订单相关操作
export const orderService = {
  async getAll() {
    return await prisma.order.findMany({
      include: {
        user: true,
        currentOwner: true,
        financialCloser: true,
        refunds: {
          include: {
            creator: true,
          },
        },
      },
      orderBy: {
        id: 'desc',
      },
    })
  },

  async getById(id: number) {
    return await prisma.order.findUnique({
      where: { id },
      include: {
        user: true,
        currentOwner: true,
        financialCloser: true,
        refunds: {
          include: {
            creator: true,
            parentRefund: true,
            childRefunds: true,
          },
        },
      },
    })
  },

  async create(data: {
    orderCode: string
    externalOrderId?: string
    productName?: string
    customerEmail?: string
    userId?: string
    currentOwnerId?: string
    amountPaid?: number
    currency?: string
    amountPaidCny?: number
    paidAt?: Date
    effectiveDate?: Date
    benefitStartDate?: Date
    benefitDurationDays?: number
    activeDays?: number
    benefitDaysRemaining?: number
  }) {
    return await prisma.order.create({
      data,
      include: {
        user: true,
        currentOwner: true,
        financialCloser: true,
        refunds: true,
      },
    })
  },

  async update(id: number, data: Partial<{
    orderCode: string
    externalOrderId: string
    productName: string
    customerEmail: string
    userId: string
    currentOwnerId: string
    financialCloserId: string
    financialClosedAt: Date
    financialClosed: boolean
    amountPaid: number
    currency: string
    amountPaidCny: number
    paidAt: Date
    effectiveDate: Date
    benefitStartDate: Date
    benefitDurationDays: number
    activeDays: number
    benefitDaysRemaining: number
  }>) {
    return await prisma.order.update({
      where: { id },
      data,
      include: {
        user: true,
        currentOwner: true,
        financialCloser: true,
        refunds: true,
      },
    })
  },

  async delete(id: number) {
    return await prisma.order.delete({
      where: { id },
    })
  },

  async closeFinancially(id: number, closerId: string) {
    return await prisma.order.update({
      where: { id },
      data: {
        financialClosed: true,
        financialCloserId: closerId,
        financialClosedAt: new Date(),
      },
      include: {
        user: true,
        currentOwner: true,
        financialCloser: true,
        refunds: true,
      },
    })
  },
}