import prisma from '../prisma.js';

export async function createProduct(data) {
  return await prisma.product.create({ data });
}

export async function getProductById(productId) {
  return await prisma.product.findUnique({ where: { productId } });
}

export async function deleteProductById(productId) {
  return await prisma.product.delete({ where: { productId } });
}

export async function updateProduct(productId, data) {
  return await prisma.product.update({ where: { productId }, data });
}

export async function getAllProducts(filters) {
  return await prisma.product.findMany({ where: filters });
}