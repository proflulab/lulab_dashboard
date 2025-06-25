import { prisma } from '../prisma'

// 退款相关操作
export const refundService = {
  async getAll() {
    return await prisma.orderRefund.findMany({
      include: {
        order: {
          include: {
            user: true,
          },
        },
        creator: true,
        parentRefund: true,
        childRefunds: true,
      },
      orderBy: {
        id: 'desc',
      },
    })
  },

  async getById(id: string) {
    return await prisma.orderRefund.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            user: true,
          },
        },
        creator: true,
        parentRefund: true,
        childRefunds: true,
      },
    })
  },

  async getByOrderId(orderId: string) {
    return await prisma.orderRefund.findMany({
      where: { orderId },
      include: {
        creator: true,
        parentRefund: true,
        childRefunds: true,
      },
      orderBy: {
        id: 'desc',
      },
    })
  },

  async create(data: {
    afterSaleCode?: string
    orderId?: string
    submittedAt?: Date
    refundedAt?: Date
    refundChannel?: string
    approvalUrl?: string
    createdBy?: string
    refundAmount?: number
    refundReason?: string
    benefitEndedAt?: Date
    benefitUsedDays?: number
    applicantName?: string
    parentId?: string
    productCategory?: string
  }) {
    return await prisma.orderRefund.create({
      data,
      include: {
        order: true,
        creator: true,
        parentRefund: true,
        childRefunds: true,
      },
    })
  },

  async update(id: string, data: Partial<{
    afterSaleCode: string
    orderId: string
    submittedAt: Date
    refundedAt: Date
    refundChannel: string
    approvalUrl: string
    createdBy: string
    refundAmount: number
    refundReason: string
    benefitEndedAt: Date
    benefitUsedDays: number
    applicantName: string
    isFinancialSettled: boolean
    financialSettledAt: Date
    financialNote: string
    parentId: string
    productCategory: string
  }>) {
    return await prisma.orderRefund.update({
      where: { id },
      data,
      include: {
        order: true,
        creator: true,
        parentRefund: true,
        childRefunds: true,
      },
    })
  },

  async delete(id: string) {
    return await prisma.orderRefund.delete({
      where: { id },
    })
  },

  async settleFinancially(id: string, note?: string) {
    return await prisma.orderRefund.update({
      where: { id },
      data: {
        isFinancialSettled: true,
        financialSettledAt: new Date(),
        financialNote: note,
      },
      include: {
        order: true,
        creator: true,
        parentRefund: true,
        childRefunds: true,
      },
    })
  },
}