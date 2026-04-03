import { registerSeller, loginSeller } from '../services/userService.js'; 

export async function register(req, res) {
  const { name, email, password, street, city, postalCode, countryCode, companyId, legalEntityId, taxSchemeId, contactName, contactPhone, contactEmail } = req.body;
  if (!name || !email || !password || !street || !city || !postalCode || !countryCode || !companyId || !legalEntityId || !taxSchemeId || !contactName || !contactPhone || !contactEmail) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const result = await registerSeller(req.body);
    return res.status(200).json(result);
  } catch (e) {
    if (e.code === 'DUPLICATE_EMAIL') return res.status(409).json({ error: e.message });
    return res.status(500).json({ error: e.message });
  }
}

export async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing required fields' });
  try {
    const result = await loginSeller({ email, password });
    return res.status(200).json(result);
  } catch (e) {
    if (e.code === 'INVALID_CREDENTIALS') return res.status(401).json({ error: e.message });
    return res.status(500).json({ error: e.message });
  }
}