import prisma from '../prisma.js';

export async function createBuyer(data) {
  return await prisma.buyer.create({ data });
}