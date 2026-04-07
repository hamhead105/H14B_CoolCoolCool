import { jest } from '@jest/globals';

const mSendMail = jest.fn();

const createRes = () => ({ statusCode: null, payload: null });

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  delete process.env.SMTP_USER;
  delete process.env.SMTP_PASS;
});

test('isEmailConfigured returns false when SMTP credentials are missing', async () => {
  await jest.unstable_mockModule('nodemailer', () => ({
    default: {
      createTransport: jest.fn(() => ({ sendMail: mSendMail }))
    }
  }));

  const { isEmailConfigured } = await import('../../src/services/emailService.js');
  expect(isEmailConfigured()).toBe(false);
});

test('sendOrderEmail returns null when email is not configured', async () => {
  await jest.unstable_mockModule('nodemailer', () => ({
    default: {
      createTransport: jest.fn(() => ({ sendMail: mSendMail }))
    }
  }));

  const { sendOrderEmail } = await import('../../src/services/emailService.js');
  const result = await sendOrderEmail('recipient@example.com', 'ORD-001', '<xml/>');

  expect(result).toBeNull();
  expect(mSendMail).not.toHaveBeenCalled();
});

test('sendOrderEmail sends email when SMTP is configured', async () => {
  process.env.SMTP_USER = 'noreply@test.com';
  process.env.SMTP_PASS = 'password';

  await jest.unstable_mockModule('nodemailer', () => ({
    default: {
      createTransport: jest.fn(() => ({ sendMail: mSendMail }))
    }
  }));

  const { sendOrderEmail } = await import('../../src/services/emailService.js');
  mSendMail.mockResolvedValue({ messageId: 'abc123' });

  const result = await sendOrderEmail('recipient@example.com', 'ORD-001', '<xml/>');

  expect(result).toEqual({ messageId: 'abc123' });
  expect(mSendMail).toHaveBeenCalledTimes(1);
  expect(mSendMail.mock.calls[0][0]).toMatchObject({
    to: 'recipient@example.com',
    subject: 'UBL Order Document – ORD-001'
  });
});
