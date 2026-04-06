import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send UBL XML as an email attachment.
 * @param {string} to - recipient email address
 * @param {string} orderId - the order ID (used in subject / filename)
 * @param {string} xmlContent - the UBL 2.1 XML string
 * @returns {Promise<object>} nodemailer send result
 */
export async function sendOrderEmail(to, orderId, xmlContent) {
  const mailOptions = {
    from: process.env.SMTP_USER || 'noreply@coolcoolcool.app',
    to,
    subject: `UBL Order Document – ${orderId}`,
    text: `Please find attached the UBL 2.1 XML document for order ${orderId}.`,
    attachments: [
      {
        filename: `${orderId}.xml`,
        content: xmlContent,
        contentType: 'application/xml',
      },
    ],
  };

  return transporter.sendMail(mailOptions);
}
