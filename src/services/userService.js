import prisma from '../prisma.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// BUYER 

export async function registerBuyer(data) {
  const { name, email, password, street, city, postalCode, countryCode, companyId, taxSchemeId, contactPhone } = data;

  const existing = await prisma.buyer.findUnique({ where: { email } });
  if (existing) {
    const err = new Error('Email already exists');
    err.code = 'DUPLICATE_EMAIL';
    throw err;
  }

  const hashed = await bcrypt.hash(password, 10);
  const buyer = await prisma.buyer.create({
    data: { name, email, password: hashed, street, city, postalCode, countryCode, companyId, taxSchemeId, contactPhone }
  });

  const token = jwt.sign(
    { buyerId: buyer.buyerId, role: 'buyer' },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return { buyerId: buyer.buyerId, token };
}


// SELLER

export async function registerSeller(data) {
  const { name, email, password, street, city, postalCode, countryCode, companyId, legalEntityId, taxSchemeId, contactName, contactPhone, contactEmail } = data;

  const existing = await prisma.seller.findUnique({ where: { email } });
  if (existing) {
    const err = new Error('Email already exists');
    err.code = 'DUPLICATE_EMAIL';
    throw err;
  }

  const hashed = await bcrypt.hash(password, 10);
  const seller = await prisma.seller.create({
    data: { name, email, password: hashed, street, city, postalCode, countryCode, companyId, legalEntityId, taxSchemeId, contactName, contactPhone, contactEmail }
  });

  const token = jwt.sign(
    { sellerId: seller.sellerId, role: 'seller' },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return { sellerId: seller.sellerId, token };
}
