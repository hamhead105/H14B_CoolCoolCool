import {
  getAllSpecials,
  getSpecialByProductId,
  createSpecial,
  updateSpecial,
  deleteSpecial,
  getProductById
} from '../services/specialService.js';

function mapSpecialResponse(special) {
  return {
    productId: special.productId,
    name: special.product?.name,
    description: special.product?.description,
    discount: special.discount,
    theme: special.theme,
    startDate: special.startDate,
    endDate: special.endDate
  };
}

export async function getSpecials(req, res) {
  try {
    const specials = await getAllSpecials();

    return res.status(200).json(
      specials.map((special) => mapSpecialResponse(special))
    );
  }
  catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export async function postSpecial(req, res) {
  const { role } = req.user;

  if (role !== 'seller') {
    return res.status(403).json({ error: 'Only sellers can add specials.' });
  }

  const { productId, discount, theme, startDate, endDate } = req.body;

  if (!productId || discount === undefined || !startDate || !endDate) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const product = await getProductById(productId);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const existingSpecial = await getSpecialByProductId(productId);

    if (existingSpecial) {
      return res.status(409).json({ error: 'Product is already on special' });
    }

    const created = await createSpecial({
      productId,
      discount,
      theme,
      startDate: new Date(startDate),
      endDate: new Date(endDate)
    });

    return res.status(200).json({
      productId: created.productId,
      discount: created.discount,
      startDate: created.startDate,
      endDate: created.endDate
    });
  }
  catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export async function getSpecialId(req, res) {
  const productId = req.params.productId;

  try {
    const special = await getSpecialByProductId(productId);

    if (!special) {
      return res.status(404).json({ error: 'Special not found' });
    }

    return res.status(200).json(mapSpecialResponse(special));
  }
  catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export async function putSpecial(req, res) {
  const { role } = req.user;
  const productId = req.params.productId;
  const { discount, theme, endDate } = req.body;

  if (role !== 'seller') {
    return res.status(403).json({ error: 'Only sellers can update specials.' });
  }

  if (discount === undefined && theme === undefined && endDate === undefined) {
    return res.status(400).json({ error: 'No valid fields provided' });
  }

  try {
    const existing = await getSpecialByProductId(productId);

    if (!existing) {
      return res.status(404).json({ error: 'Special not found' });
    }

    await updateSpecial(productId, {
      ...(discount !== undefined && { discount }),
      ...(theme !== undefined && { theme }),
      ...(endDate !== undefined && { endDate: new Date(endDate) })
    });

    const updated = await getSpecialByProductId(productId);

    return res.status(200).json({
      productId: updated.productId,
      discount: updated.discount,
      theme: updated.theme,
      endDate: updated.endDate
    });
  }
  catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export async function deleteSpecialId(req, res) {
  const { role } = req.user;
  const productId = req.params.productId;

  if (role !== 'seller') {
    return res.status(403).json({ error: 'Only sellers can remove specials.' });
  }

  try {
    const existing = await getSpecialByProductId(productId);

    if (!existing) {
      return res.status(404).json({ error: 'Special not found' });
    }

    await deleteSpecial(productId);

    return res.status(200).json({
      message: 'Special deleted successfully'
    });
  }
  catch (error) {
    return res.status(500).json({ error: error.message });
  }
}