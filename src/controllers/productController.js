import { createProduct } from '../services/productService.js';

export async function postProduct(req, res) {
  
  const { sellerId, role } = req.user;

  if (role !== 'seller') {
    return res.status(403).json({ error: 'Only sellers can create product listings.' });
  }

  const {productId, name, description, cost, brand, family, releaseDate, onSpecial, discount, productTier, nextProduct} = req.body;

  if (!productId || !name || cost === undefined || !description || !brand || !family || !releaseDate || onSpecial === undefined || discount === undefined) {
    return res.status(422).json({
      error: 'Missing required fields'
    });
  }
  try {
    try {
      await createProduct({
        productId: productId,
        sellerId: sellerId,
        name: name,
        description: description,
        cost: cost,
        brand: brand,
        family: family,
        releaseDate: releaseDate,
        onSpecial: onSpecial,
        discount: discount,
        productTier: productTier,
        nextProduct: nextProduct
      });
    } catch (error) {
      if (error.code === 'P2002') {
        return res.status(400).json({ error: "A product with this ID already exists." });
      }
      return res.status(500).json({ error: error.message });
    }

    // todo make productId
    return res.status(200).json({
        productId: productId,
        name: name,
        description: description
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}