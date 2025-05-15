import { prisma } from '@/modules/c-shared/infrastructure/persistence/prisma/client';
import { PaymentEntity, PaymentTransaction } from '@/modules/c-linePay/domain/models/payment.model';
import { IPaymentRepository } from '@/modules/c-linePay/domain/repositories/payment.repository.interface';
import { AssetEnum, PaymentEnum, TransactionEnum } from '@prisma/client';

/**
 * 支付倉庫實現
 * 使用 Prisma 操作數據庫
 */
export class PaymentRepository implements IPaymentRepository {
  /**
   * 創建支付交易記錄
   * @param transaction - 交易數據
   * @returns 創建的交易記錄
   */
  async createTransaction(transaction: PaymentTransaction): Promise<PaymentTransaction> {
    try {
      // 先確認用戶存在
      const user = await prisma.user.findUnique({
        where: { id: transaction.userId }
      });

      if (!user) {
        throw new Error(`User not found with id: ${transaction.userId}`);
      }

      const created = await prisma.linePay.create({
        data: {
          order_id: transaction.orderId,
          amount: transaction.amount,
          currency: transaction.currency,
          status: transaction.status,
          packages: transaction.packages,
          paymentUrl: transaction.paymentUrl,
          redirectUrls: transaction.redirectUrls,
          user: {
            connect: { id: transaction.userId }
          }
        },
        include: {
          user: true  // 確保包含完整的用戶資料
        }
      });

      // 確保返回的資料結構與 PaymentTransaction 介面一致
      return {
        transactionId: created.transactionId || undefined,
        orderId: created.order_id,
        userId: created.userId,
        amount: created.amount,
        currency: created.currency,
        status: created.status,
        packages: created.packages as any[],
        redirectUrls: created.redirectUrls as any,
        paymentUrl: created.paymentUrl as any
      };
    } catch (error) {
      console.error('Failed to create transaction:', error);
      throw error;
    }
  }

  /**
   * 根據訂單ID查詢交易
   * @param orderId - 訂單ID
   * @returns 交易記錄或null
   */
  async getTransactionByOrderId(orderId: string): Promise<{
    userId: string;
    amount: number;
    status: PaymentEnum;
    user: { userId: string };  // 改為 userId
  } | null> {
    const payment = await prisma.linePay.findUnique({
      where: { order_id: orderId },
      select: {
        userId: true,
        amount: true,
        status: true,
        user: {
          select: { userId: true }  // 改為 userId
        }
      }
    });

    return payment;
  }

  /**
   * 更新交易狀態
   * @param orderId - 訂單ID
   * @param status - 新狀態
   * @param transactionId - 交易ID
   * @returns 更新的交易記錄
   */
  async updateTransactionStatus(
    orderId: string,
    status: PaymentEnum,
    transactionId?: string
  ): Promise<void> {
    console.log('Updating transaction status:', { orderId, status, transactionId });
    await prisma.linePay.update({
      where: { order_id: orderId },
      data: {
        status,
        ...(transactionId && { transactionId })
      }
    });
    console.log('Transaction status updated:', { orderId, status, transactionId });
  }

  /**
   * 處理成功支付後的資產更新
   * @param userId - 用戶ID
   * @param amount - 金額
   * @returns void
   */
  async handleSuccessfulPayment(userId: string, amount: number): Promise<void> {
    try {
      console.log(`開始處理支付成功後資產更新: userId=${userId}, amount=${amount}`);

      // 使用交易確保資料一致性
      await prisma.$transaction(async (tx) => {
        // 1. 更新用戶資產
        const updatedAsset = await tx.userAsset.update({
          where: { userId },
          data: {
            diamonds: { increment: amount }
          },
          select: {
            diamonds: true
          }
        });

        // 2. 創建資產變動記錄
        await tx.assetMutation.create({
          data: {
            userId,
            currency: AssetEnum.DIAMOND,
            amount: amount,
            balance: updatedAsset.diamonds, // 使用更新後的餘額
            reason: TransactionEnum.INCREASE,
            description: `LINE Pay 充值 ${amount} 鑽石`
          }
        });

        // 3. 更新支付記錄狀態（如果需要）
        // 首先查找相關的支付記錄
        const payment = await tx.linePay.findFirst({
          where: {
            userId,
            status: PaymentEnum.PENDING
          },
          orderBy: {
            createdAt: 'desc'
          },
          select: {
            order_id: true
          }
        });

        if (payment) {
          await tx.linePay.update({
            where: {
              order_id: payment.order_id  // 使用 order_id 作為唯一識別
            },
            data: {
              status: PaymentEnum.SUCCESS,
              updatedAt: new Date()
            }
          });
        }
      });

      console.log(`資產更新成功: userId=${userId}, amount=${amount}`);
    } catch (error) {
      console.error(`資產更新失敗:`, error);
      throw error;
    }
  }

  /**
   * 創建支付實體
   * @param payment - 支付數據
   * @returns 創建的支付實體
   */
  async create(payment: Omit<PaymentEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<PaymentEntity> {
    const created = await prisma.linePay.create({
      data: {
        userId: payment.userId,
        transactionId: payment.transactionId,
        order_id: payment.orderId,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        packages: payment.packages,
        paymentUrl: payment.paymentUrl,
        redirectUrls: payment.redirectUrls
      }
    });

    return this.mapToPaymentEntity(created);
  }

  /**
   * 根據訂單ID查詢支付實體
   * @param orderId - 訂單ID
   * @returns 支付實體或null
   */
  async findByOrderId(orderId: string): Promise<PaymentEntity | null> {
    const payment = await prisma.linePay.findUnique({
      where: { order_id: orderId }
    });

    return payment ? this.mapToPaymentEntity(payment) : null;
  }

  /**
   * 更新支付狀態
   * @param orderId - 訂單ID
   * @param status - 新狀態
   * @param transactionId - 交易ID
   * @returns 更新後的支付實體
   */
  async updateStatus(orderId: string, status: PaymentEnum, transactionId?: string): Promise<PaymentEntity> {
    const updated = await prisma.linePay.update({
      where: { order_id: orderId },
      data: {
        status,
        ...(transactionId && { transactionId })
      }
    });

    return this.mapToPaymentEntity(updated);
  }

  /**
   * 將 Prisma 模型映射為支付實體
   * @param model - Prisma 模型
   * @returns 支付實體
   */
  private mapToPaymentEntity(model: any): PaymentEntity {
    return {
      id: model.id,
      userId: model.userId,
      transactionId: model.transactionId || undefined,
      orderId: model.order_id,
      amount: model.amount,
      currency: model.currency,
      status: model.status,
      packages: model.packages as any,
      paymentUrl: model.paymentUrl as any,
      redirectUrls: model.redirectUrls as any,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt
    };
  }
}

// 導出單例實例
export const paymentRepository = new PaymentRepository();
