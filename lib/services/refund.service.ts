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

  async getById(id: number) {
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

  async getByOrderId(orderId: number) {
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
    orderId?: number
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
    parentId?: number
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

  async update(id: number, data: Partial<{
    afterSaleCode: string
    orderId: number
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
    parentId: number
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

  async delete(id: number) {
    return await prisma.orderRefund.delete({
      where: { id },
    })
  },

  async settleFinancially(id: number, note?: string) {
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