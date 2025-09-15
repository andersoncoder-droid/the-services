import express from 'express';
import reviewsRoutes from './routes/reviews.routes';
import dotenv from 'dotenv';
import morgan from 'morgan';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(morgan('dev'));
app.use(express.json());

// Rutas
app.use('/', reviewsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'reviews-service' });
});

app.listen(PORT, () => {
  console.log(`Reviews service running on port ${PORT}`);
});
