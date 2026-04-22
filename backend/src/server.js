import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import orderRoutes from './routes/orders.js';
import productRoutes from './routes/products.js';
import healthRoutes from './routes/health.js';
import docsRoutes from './routes/docs.js';
import buyerRoutes from './routes/buyers.js';
import sellerRoutes from './routes/sellers.js';
import emailRoutes from './routes/email.js';
import ratingRoutes from './routes/ratings.js';
import invoiceRoutes from './routes/invoices.js';
import { orderDespatchRouter, despatchAdviceRouter } from './routes/despatchAdvices.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/api/orders', orderRoutes);
app.use('/api/orders', emailRoutes);
app.use('/api/orders', ratingRoutes);
app.use('/api/products', productRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/api-docs', docsRoutes);
app.use('/api/buyers', buyerRoutes);
app.use('/api/sellers', sellerRoutes);
app.use('/api/orders', invoiceRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/orders', orderDespatchRouter);
app.use('/api/despatch-advices', despatchAdviceRouter);

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Bad JSON' });
  }
  next();
});

if (import.meta.url === `file://${process.argv[1]}`) {
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}

export default app;