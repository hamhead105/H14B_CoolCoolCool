import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrate() {
  try {
    console.log('Truncating Order table...');
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Order" CASCADE;`);
    console.log('✓ Orders cleared');

    console.log('\nAdding despatch advice columns if they do not exist...');

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Order"
        ADD COLUMN IF NOT EXISTS "externalDespatchAdviceId" TEXT,
        ADD COLUMN IF NOT EXISTS "despatchAdviceMetadata"   JSONB,
        ADD COLUMN IF NOT EXISTS "despatchAdviceError"      TEXT;
    `);
    console.log('✓ Despatch advice columns added');

    console.log('\nVerifying final columns on Order table...');
    const cols = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'Order'
      ORDER BY ordinal_position;
    `);
    console.table(cols);

  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();