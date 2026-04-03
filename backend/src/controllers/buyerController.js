import { registerBuyer, loginBuyer } from '../services/userService.js'; 

export async function register(req, res) {
  const { name, email, password, street, city, postalCode, countryCode } = req.body;
  if (!name || !email || !password || !street || !city || !postalCode || !countryCode) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const result = await registerBuyer(req.body);
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
    const result = await loginBuyer({ email, password });
    return res.status(200).json(result);
  } catch (e) {
    if (e.code === 'INVALID_CREDENTIALS') return res.status(401).json({ error: e.message });
    return res.status(500).json({ error: e.message });
  }
}