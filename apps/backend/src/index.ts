import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { secureHeaders } from 'hono/secure-headers';
import { timeout } from 'hono/timeout';
import { metrics } from './middleware/metrics.js';
import { errorHandler } from './middleware/error.js';
import { notFoundHandler } from './middleware/notFound.js';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import propertyRoutes from './routes/properties.js';
import bookingRoutes from './routes/bookings.js';
import serviceRoutes from './routes/services.js';
import marketplaceRoutes from './routes/marketplace.js';
import searchRoutes from './routes/search.js';
import reviewRoutes from './routes/reviews.js';
import notificationRoutes from './routes/notifications.js';
import messageRoutes from './routes/messages.js';
import uploadRoutes from './routes/upload.js';
import adminRoutes from './routes/admin.js';
import pageRoutes from './routes/pages.js';
import contactRoutes from './routes/contact.js';
import dashboardRoutes from './routes/dashboard.js';

const app = new Hono();

// Global middleware
app.use(logger());
app.use(secureHeaders());
app.use(prettyJSON());
// Parse CORS origins from env (comma-separated)
const corsOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : ['http://localhost:3000', 'http://localhost:3003'];

app.use(cors({
  origin: corsOrigins,
  credentials: true,
}));
app.use(timeout(30000)); // 30s timeout

// Metrics endpoint for Prometheus
app.use('/metrics', metrics);

// Health check endpoint
app.get('/health', (c) => c.json({ 
  status: 'ok', 
  timestamp: new Date().toISOString(),
  version: '1.0.0'
}));

// API routes
app.route('/api/v1/auth', authRoutes);
app.route('/api/v1/users', userRoutes);
app.route('/api/v1/properties', propertyRoutes);
app.route('/api/v1/bookings', bookingRoutes);
app.route('/api/v1/services', serviceRoutes);
app.route('/api/v1/marketplace', marketplaceRoutes);
app.route('/api/v1/search', searchRoutes);
app.route('/api/v1/reviews', reviewRoutes);
app.route('/api/v1/notifications', notificationRoutes);
app.route('/api/v1/messages', messageRoutes);
app.route('/api/v1/upload', uploadRoutes);
app.route('/api/v1/admin', adminRoutes);
app.route('/api/v1/pages', pageRoutes);
app.route('/api/v1/contact', contactRoutes);
app.route('/api/v1/dashboard', dashboardRoutes);

// Error handling
app.onError(errorHandler);
app.notFound(notFoundHandler);

// Start server
const port = parseInt(process.env.PORT || '3001');

console.log(`🚀 Rentora API Server starting on port ${port}...`);

serve({
  fetch: app.fetch,
  port,
});

console.log(`✅ Server running at http://localhost:${port}`);
console.log(`📊 Metrics available at http://localhost:${port}/metrics`);

export default app;