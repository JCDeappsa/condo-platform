import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { testConnection } from './config/database';
import { initModels } from './models';
import { errorHandler } from './common/error.handler';
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/users.routes';
import unitRoutes from './modules/units/units.routes';
import billingRoutes from './modules/billing/billing.routes';
import paymentRoutes from './modules/payments/payments.routes';
import collectionsRoutes from './modules/collections/collections.routes';
import maintenanceRoutes from './modules/maintenance/maintenance.routes';
import metersRoutes from './modules/meters/meters.routes';
import projectsRoutes from './modules/projects/projects.routes';
import vendorsRoutes from './modules/vendors/vendors.routes';
import announcementsRoutes from './modules/announcements/announcements.routes';
import documentsRoutes from './modules/documents/documents.routes';
import dashboardsRoutes from './modules/dashboards/dashboards.routes';
import auditLogsRoutes from './modules/audit-logs/audit-logs.routes';
import residentsRoutes from './modules/residents/residents.routes';
import settingsRoutes from './modules/settings/settings.routes';

const app = express();

// Security & parsing middleware
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    // Allow the configured frontend URL
    if (origin === env.frontendUrl) return callback(null, true);
    // Allow any Vercel preview deployments
    if (origin.endsWith('.vercel.app')) return callback(null, true);
    // Allow localhost in development
    if (env.nodeEnv === 'development' && origin.includes('localhost')) return callback(null, true);
    callback(new Error('CORS no permitido'));
  },
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { success: false, error: 'Demasiadas solicitudes, intente de nuevo más tarde.' },
});
app.use('/api/', limiter);

// Swagger docs
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Plataforma de Administración de Condominio',
      version: '1.0.0',
      description: 'API REST para la administración de condominios',
    },
    servers: [
      { url: `http://localhost:${env.port}`, description: 'Desarrollo local' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/modules/**/**.routes.ts'],
});
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Plataforma de Condominio - API funcionando',
    timestamp: new Date().toISOString(),
    environment: env.nodeEnv,
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/units', unitRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/collections', collectionsRoutes);
app.use('/api/maintenance-tickets', maintenanceRoutes);
app.use('/api/meters', metersRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/vendors', vendorsRoutes);
app.use('/api/announcements', announcementsRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/dashboards', dashboardsRoutes);
app.use('/api/audit-logs', auditLogsRoutes);
app.use('/api/residents', residentsRoutes);
app.use('/api/settings', settingsRoutes);

// Error handler (must be last)
app.use(errorHandler);

// Start server
async function start(): Promise<void> {
  try {
    await testConnection();
    initModels();

    app.listen(env.port, () => {
      console.log(`Servidor corriendo en puerto ${env.port}`);
      console.log(`Documentación API: http://localhost:${env.port}/api/docs`);
    });
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

start();

export default app;
