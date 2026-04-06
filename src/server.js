import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import orderRoutes from './routes/orders.js';
import productRoutes from './routes/products.js';
import healthRoutes from './routes/health.js';
import docsRoutes from './routes/docs.js';
import buyerRoutes from './routes/buyers.js'
import sellerRoutes from './routes/sellers.js'
import specialsRoutes from './routes/specials.js';


const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/orders', orderRoutes);
app.use('/products', productRoutes);
app.use('/health', healthRoutes);
app.use('/api-docs', docsRoutes);
app.use('/buyers', buyerRoutes);
app.use('/sellers', sellerRoutes);
app.use('/specials', specialsRoutes);

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