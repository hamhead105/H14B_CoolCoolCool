import prisma from '../prisma.js';

export async function getAllSpecials() {
  return await prisma.special.findMany({
    include: {
      product: {
        select: {
          name: true,
          description: true
        }
      }
    }
  });
}

export async function getSpecialByProductId(productId) {
  return await prisma.special.findUnique({
    where: { productId },
    include: {
      product: {
        select: {
          name: true,
          description: true
        }
      }
    }
  });
}

export async function createSpecial(data) {
  return await prisma.special.create({
    data
  });
}

export async function updateSpecial(productId, data) {
  return await prisma.special.update({
    where: { productId },
    data
  });
}

export async function deleteSpecial(productId) {
  return await prisma.special.delete({
    where: { productId }
  });
}

export async function getProductById(productId) {
  return await prisma.product.findUnique({
    where: { productId }
  });
}