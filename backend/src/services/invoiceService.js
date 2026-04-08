import axios from 'axios';

const INVOICE_BASE_URL = process.env.INVOICE_BASE_URL;
const INVOICE_API_KEY = process.env.INVOICE_API_KEY;

export async function createInvoice(invoiceData)
{
    try
    {
        const response = await axios.post(
            `${INVOICE_BASE_URL}/invoices`,
            invoiceData,
            {
                headers: {
                    accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-API-Key': INVOICE_API_KEY,
                },
            }
        );

        return response.data;
    }
    catch (error)
    {
        console.error(
            'Invoice API error:',
            error.response?.data || error.message
        );
        throw new Error('Failed to create invoice');
    }
}