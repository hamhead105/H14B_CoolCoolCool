import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrate() {
  try {
    console.log('Checking existing columns...');

    const existing = await prisma.$queryRawUnsafe(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'Order'
    `);

    const cols = existing.map(r => r.column_name);
    console.log('Current columns:', cols);


    console.log('\nDone. Verifying final state...');

    const final = await prisma.$queryRawUnsafe(`
      SELECT "orderId", "status", "externalInvoiceId", "invoiceError"
      FROM "Order"
      LIMIT 5;`
    );

    console.table(final);

  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();