import { createProduct, getProductsByAttributes, getProductById } from '../services/productService.js';

export async function postProduct(req, res) {
  const {productId, sellerId, name, description, cost, brand, family, releaseDate, onSpecial, discount, productTier, nextProduct} = req.body;

  if (!productId || !sellerId || !name || cost === undefined || !description || !brand || !family || !releaseDate || onSpecial === undefined || discount === undefined) {
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
      console.error(error);
          return res.status(400).json({
          error: "Duplicate order: A product with this ID already exists.",
      });
    }

    return res.status(200).json({
        productId: productId,
        name: name,
        description: description
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export async function getProducts(req, res) {
  const { name, brand, family, onSpecial } = req.query;

  try {
    let specialBool = undefined;
    if (onSpecial === 'true') specialBool = true;
    if (onSpecial === 'false') specialBool = false;

    const matchProducts = await getProductsByAttributes(
      brand, 
      family, 
      specialBool, 
      name
    );

    return res.status(200).json(matchProducts);

  } catch (error) {
    console.error("Fetch Error:", error);
    return res.status(500).json({ 
      error: "Error retrieving products", 
      details: error.message 
    });
  }
}

export async function getProductId(req, res) {
  const orderId = req.params.id;

  try {
    const found = await getProductById(orderId);
    console.log("-> URL Param ID:", orderId);
    console.log("-> Is getProductById a Mock?", getProductById.toString());
    console.log("-> Database Result:", found);

    if (!found) {
      return res.status(404).json({ error: 'Product not found' });
    }

    return res.status(200).json(found);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}