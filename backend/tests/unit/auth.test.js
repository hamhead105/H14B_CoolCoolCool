import { jest } from '@jest/globals';

const mockVerify = jest.fn((token) => {
  if (!token || token === 'Invalid token') {
    throw new Error('invalid token');
  }
  return { buyerId: 1, role: 'buyer' };
});

await jest.unstable_mockModule('jsonwebtoken', () => ({
  default: {
    verify: mockVerify
  }
}));

const { authMiddleware } = await import('../../src/middleware/auth.js');

const createReq = (headers = {}) => ({ headers });
const createRes = () => {
  const res = {};
  res.status = jest.fn().mockImplementation((code) => {
    res.statusCode = code;
    return res;
  });
  res.json = jest.fn().mockImplementation((payload) => {
    res.payload = payload;
    return res;
  });
  return res;
};

const next = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  delete process.env.JWT_SECRET;
  delete process.env.NODE_ENV;
});

test('development environment bypasses auth and attaches test user', () => {
  process.env.NODE_ENV = 'development';

  const req = createReq({});
  const res = createRes();

  authMiddleware(req, res, next);

  expect(next).toHaveBeenCalledTimes(1);
  expect(req.user).toEqual({ id: 'test-user-id' });
});

test('returns 500 when JWT_SECRET is missing in production', () => {
  process.env.NODE_ENV = 'production';

  const req = createReq({ authorization: 'Bearer Valid token' });
  const res = createRes();

  authMiddleware(req, res, next);

  expect(res.status).toHaveBeenCalledWith(500);
  expect(res.json).toHaveBeenCalledWith({ error: 'Server configuration error: JWT_SECRET is not defined' });
  expect(next).not.toHaveBeenCalled();
});

test('returns 401 when authorization header is missing', () => {
  process.env.JWT_SECRET = 'test-secret';
  process.env.NODE_ENV = 'production';

  const req = createReq({});
  const res = createRes();

  authMiddleware(req, res, next);

  expect(res.status).toHaveBeenCalledWith(401);
  expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
});

test('returns 401 when token is invalid', () => {
  process.env.JWT_SECRET = 'test-secret';
  process.env.NODE_ENV = 'production';

  const req = createReq({ authorization: 'Bearer Invalid token' });
  const res = createRes();

  authMiddleware(req, res, next);

  expect(res.status).toHaveBeenCalledWith(401);
  expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
  expect(next).not.toHaveBeenCalled();
});

test('valid token calls next and attaches decoded user', () => {
  process.env.JWT_SECRET = 'test-secret';
  process.env.NODE_ENV = 'production';

  const req = createReq({ authorization: 'Bearer Valid token' });
  const res = createRes();

  authMiddleware(req, res, next);

  expect(mockVerify).toHaveBeenCalledWith('Valid token', 'test-secret');
  expect(req.user).toEqual({ buyerId: 1, role: 'buyer' });
  expect(next).toHaveBeenCalledTimes(1);
});
