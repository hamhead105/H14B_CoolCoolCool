import { PrismaClient } from '@prisma/client';
import 'dotenv/config';
const prisma = new PrismaClient();

async function main() {
  // Create a test order
  const order = await prisma.order.create({
    data: {
      status: 'tes3t',
      inputData: { test: true },
      totalCost: 3.00,
      taxAmount: 10.00,
      payableAmount: 110.00,
      anticipatedMonetaryTotal: 100.00,
      loyaltyPointsEarned: 0,
      loyaltyPointsRedeemed: 0,
    }
  });

  console.log('Created order:', order);

  // Read it back
  const found = await prisma.order.findUnique({
    where: { orderId: order.orderId }
  });

  console.log('Found order:', found);

  //Delete it
  await prisma.order.delete({
    where: { orderId: order.orderId }
  });

  console.log('Deleted order, DB connection working correctly');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());