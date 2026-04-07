import jwt from 'jsonwebtoken';

export function authMiddleware(req, res, next) {

  // TODO remove when done testing
  if (process.env.NODE_ENV === 'development') {
    req.user = { id: 'test-user-id' }; // Mock a user object
    return next(); // Skip the check!
  }
  // REMOVE ENDS HERE

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ error: 'Server configuration error: JWT_SECRET is not defined' });
  }

  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}