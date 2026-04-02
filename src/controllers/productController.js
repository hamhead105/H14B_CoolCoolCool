import { createProduct, getProductsByAttributes, getProductById, updateProduct, getAllProducts, deleteProductById } from '../services/productService.js';

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
  const productId = req.params.id;

  try {
    const found = await getProductById(productId);

    if (!found) {
      return res.status(404).json({ error: 'Product not found' });
    }

    return res.status(200).json(found);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}

export async function putProduct(req, res) {
  const productId = req.params.id;

  try {
    const existing = await getProductById(productId);

    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const mergedInput = {
      name: req.body.name ?? existing.name,
      description: req.body.description ?? existing.description,
      cost: req.body.cost ?? existing.cost,
      discount: req.body.discount ?? existing.discount,
      onSpecial: req.body.onSpecial ?? existing.onSpecial,
    };

    await updateProduct(productId, {
      inputData: mergedInput,
    });

    return res.status(200).json(await getProductById(productId));
  }
  catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}

export async function deleteProduct(req, res) {
    const productId = req.params.id;

  try {
    const found = await getProductById(productId);

    if (!found) {
      return res.status(404).json({ error: 'Order not found' });
    }

    await deleteProductById(productId);

    return res.status(200).json({
      message: 'Product deleted successfully',
      productId: productId,
      deletedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Internal server error',
      detail: error.message
    });
  }
}