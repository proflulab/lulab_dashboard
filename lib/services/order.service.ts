import { prisma } from '@/lib/prisma'
import { Currency } from '@prisma/client'

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

  async getById(id: string) {
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
    orderNumber: string
    externalOrderId?: string
    productName?: string
    customerEmail?: string
    userId?: string
    currentOwnerId?: string
    amount: number
    currency?: Currency
    amountCny: number
    paidAt?: Date
    effectiveDate?: Date
    benefitStartDate?: Date
    benefitDurationDays?: number
    activeDays?: number
    benefitDaysRemaining?: number
  }) {
    const { userId, currentOwnerId, ...orderData } = data
    return await prisma.order.create({
      data: {
        ...orderData,
        ...(userId && { user: { connect: { id: userId } } }),
        ...(currentOwnerId && { currentOwner: { connect: { id: currentOwnerId } } }),
      },
      include: {
        user: true,
        currentOwner: true,
        financialCloser: true,
        refunds: true,
      },
    })
  },

  async update(id: string, data: Partial<{
    orderCode: string
    orderNumber: string
    externalOrderId: string
    productName: string
    customerEmail: string
    userId: string
    currentOwnerId: string
    financialCloserId: string
    financialClosedAt: Date
    financialClosed: boolean
    amount: number
    currency: Currency
    amountCny: number
    paidAt: Date
    effectiveDate: Date
    benefitStartDate: Date
    benefitDurationDays: number
    activeDays: number
    benefitDaysRemaining: number
  }>) {
    const { userId, currentOwnerId, financialCloserId, ...orderData } = data
    return await prisma.order.update({
      where: { id },
      data: {
        ...orderData,
        ...(userId && { user: { connect: { id: userId } } }),
        ...(currentOwnerId && { currentOwner: { connect: { id: currentOwnerId } } }),
        ...(financialCloserId && { financialCloser: { connect: { id: financialCloserId } } }),
      },
      include: {
        user: true,
        currentOwner: true,
        financialCloser: true,
        refunds: true,
      },
    })
  },

  async delete(id: string) {
    return await prisma.order.delete({
      where: { id },
    })
  },

  async closeFinancially(id: string, closerId: string) {
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