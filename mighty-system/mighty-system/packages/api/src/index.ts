import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { tenantRoutes } from './routes/tenant.routes';
import { bookingRoutes } from './routes/booking.routes';
import { customerRoutes } from './routes/customer.routes';
import { serviceRoutes } from './routes/service.routes';
import { staffRoutes } from './routes/staff.routes';
import { authRoutes } from './routes/auth.routes';
import { healthRoutes } from './routes/health.routes';
import { errorHandler } from './middleware/error-handler';
import { tenantMiddleware } from './middleware/tenant';
import { logger } from './services/logger';

export function createApp() {
  const app = Fastify({
    logger,
    trustProxy: true,
  });

  app.register(helmet, {
    contentSecurityPolicy: false,
  });

  app.register(cors, {
    origin: process.env.CORS_ORIGIN?.split(',') ?? true,
    credentials: true,
  });

  app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  app.register(swagger, {
    openapi: {
      info: {
        title: 'Mighty System API',
        description: 'Multi-tenant SaaS Booking Platform API',
        version: '1.0.0',
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
  });

  app.register(swaggerUi, {
    routePrefix: '/docs',
  });

  app.decorateRequest('tenant', null);
  app.decorateRequest('user', null);

  app.addHook('preHandler', tenantMiddleware);

  app.register(healthRoutes, { prefix: '/health' });
  app.register(authRoutes, { prefix: '/api/v1/auth' });
  app.register(tenantRoutes, { prefix: '/api/v1/tenants' });
  app.register(bookingRoutes, { prefix: '/api/v1/bookings' });
  app.register(customerRoutes, { prefix: '/api/v1/customers' });
  app.register(serviceRoutes, { prefix: '/api/v1/services' });
  app.register(staffRoutes, { prefix: '/api/v1/staff' });

  app.setErrorHandler(errorHandler);

  return app;
}

export async function startServer() {
  const app = createApp();
  
  try {
    await app.listen({
      host: process.env.HOST ?? '0.0.0.0',
      port: parseInt(process.env.PORT ?? '3001'),
    });
    
    logger.info(`Server running at http://localhost:${process.env.PORT ?? 3001}`);
    return app;
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}
