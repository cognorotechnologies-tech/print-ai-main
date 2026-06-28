import { Router } from 'express';
import { authRouter } from './auth';
import { designsRouter } from './designs';
import { catalogRouter } from './catalog';
import { productsRouter } from './products';
import { cartRouter } from './cart';
import { ordersRouter } from './orders';
import { paymentsRouter } from './payments';

const router = Router();

// Health check route
router.get('/health', (req, res) => {
  res.json({ status: 'ok', version: 'v1' });
});

// Authentication routes
router.use('/auth', authRouter);

// Design routes
router.use('/designs', designsRouter);

// Catalog routes (v1 API)
router.use('/catalog', catalogRouter);

// Product routes (design document specification)
router.use('/products', productsRouter);

// Cart routes
router.use('/cart', cartRouter);

// Order routes
router.use('/orders', ordersRouter);

// Payment routes
router.use('/payments', paymentsRouter);

export { router as apiRouter };
