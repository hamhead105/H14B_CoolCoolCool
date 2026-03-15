import 'dotenv/config';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import orderRoutes from './routes/orders.js';
import healthRoutes from './routes/health.js';


const app = express();
const port = process.env.PORT || 3000;

const swaggerDefinition = {
  openapi: '3.0.0',
  info: { title: 'CoolCoolCool API', version: '1.0.0' },
  servers: [
    { url: 'https://h14bcoolcoolcool.vercel.app', description: 'Production' },
    { url: `http://localhost:${port}`, description: 'Local' }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer'
      }
    }
  }
};

const options = { swaggerDefinition, apis: ['./src/routes/*.js'] };
const swaggerSpec = swaggerJSDoc(options);

app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// POST route
app.post('/orders', async (req, res) => {
    const { 
        order, 
        buyer, 
        seller, 
        delivery, 
        tax, 
        items, 
        loyaltyPointsRedeemed 
    } = req.body;

    const authHeader = req.headers['authorization'];
    if (!authHeader || authHeader === 'Invalid token') {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!order?.id || !buyer?.companyId || !items || !Array.isArray(items)) {
        return res.status(422).json({ 
            error: "Missing required fields: order.id, buyer.companyId, and items array are mandatory." 
        });
    }

    try {
        let xml_output = create_xml(req.body);
        const taxAmount = Number(getTaxAmount(req.body).toFixed(2));
        const payableAmount = Number(getPayableAmount(req.body).toFixed(2));
        const lineExtensionAmount = getLineExtension(req.body);

        await prisma.order.create({
            data: {
                orderId: order.id,
                status: "order placed",
                inputData: req.body,
                totalCost: (taxAmount + payableAmount),
                taxAmount: taxAmount,
                payableAmount: payableAmount,
                anticipatedMonetaryTotal: lineExtensionAmount,
                loyaltyPointsEarned: Math.round(payableAmount * loyalty_point_coeff),
                loyaltyPointsRedeemed: 0,
            }
        });

        res.status(200).json({
            orderId: order.id,
            status: "order placed",
            totalCost: taxAmount + payableAmount,
            taxAmount: taxAmount,
            payableAmount: payableAmount,
            anticipatedMonetaryTotal: lineExtensionAmount,
            loyaltyPointsEarned: Math.round(payableAmount * loyalty_point_coeff),
            loyaltyPointsRedeemed: 0,
            ublDocument: xml_output
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            message: "Vercel Error", 
            detail: error.message,
            stack: error.stack 
        }); 
    }
});

// GET route
app.get('/orders/:id', async (req, res) => {

    const authHeader = req.headers['authorization'];
    if (!authHeader || authHeader === 'Invalid token') {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const orderId = req.params.id;

    try {

        const found = await prisma.order.findUnique({
            where: { orderId: orderId }
        });

        if (!found) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const xml_output = create_xml(found.inputData);

        res.status(200).json({
            orderId: found.orderId,
            status: found.status,
            totalCost: found.totalCost,
            taxAmount: found.taxAmount,
            payableAmount: found.payableAmount,
            anticipatedMonetaryTotal: found.anticipatedMonetaryTotal,
            createdAt: found.createdAt,
            ublDocument: xml_output
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Vercel Error",
            detail: error.message,
            stack: error.stack
        });
    }
});

/**
 * @swagger
 * /orders/{id}:
 *   delete:
 *     summary: Delete an order
 *     tags:
 *       - Orders
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the order to delete
 *     responses:
 *       200:
 *         description: Order deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Order deleted successfully
 *                 id:
 *                   type: string
 *                 deletedAt:
 *                   type: string
 *       401:
 *         description: Unauthorised
 *       404:
 *         description: Order not found
 */
app.delete('/orders/:id', async (req, res) => {
    const { id } = req.params;

    const authHeader = req.headers['authorization'];
    if (!authHeader || authHeader === 'Invalid token') {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const found = await prisma.order.findUnique({
            where: { orderId: id }
        });

        if (!found) {
            return res.status(404).json({ error: 'Order not found' });
        }

        await prisma.order.delete({
            where: { orderId: id }
        });

        res.status(200).json({
            message: 'Order deleted successfully',
            id: id,
            deletedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Internal server error',
            detail: error.message
        });
    }
});

// --- ERROR HANDLING ---
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Bad JSON' });
  }
  next();
});

// stop hanging
// if (require.main === module) {
//     app.listen(port, () => {
//         console.log(`Server running at http://localhost:${port}`);
//     });
// }

export default app;