import prisma from '../prisma.js';

export async function createRating(data) {
  return await prisma.rating.create({ data });
}

export async function getRatingByOrderId(orderId) {
  return await prisma.rating.findUnique({ where: { orderId } });
}
