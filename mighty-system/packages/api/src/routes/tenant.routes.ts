import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../services/database';
import { NotFoundError } from '../middleware/error-handler';

const updateTenantSchema = z.object({
  name: z.string().min(1).optional(),
  settings: z.record(z.unknown()).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'TRIAL', 'CANCELLED']).optional(),
});

async function getTenant(request: FastifyRequest) {
  const tenant = request.tenant;
  if (!tenant) {
    throw new NotFoundError('Tenant not found');
  }

  return {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    status: tenant.status,
    subscriptionTier: tenant.subscriptionTier,
    settings: tenant.settings,
    createdAt: tenant.createdAt,
  };
}

async function updateTenant(request: FastifyRequest) {
  const tenant = request.tenant;
  if (!tenant) {
    throw new NotFoundError('Tenant not found');
  }

  const body = updateTenantSchema.parse(request.body);

  const updated = await prisma.tenant.update({
    where: { id: tenant.id },
    data: body,
  });

  return {
    id: updated.id,
    name: updated.name,
    slug: updated.slug,
    status: updated.status,
    subscriptionTier: updated.subscriptionTier,
    settings: updated.settings,
  };
}

async function getTenantStats(request: FastifyRequest) {
  const tenant = request.tenant;
  if (!tenant) {
    throw new NotFoundError('Tenant not found');
  }

  const [customerCount, bookingCount, serviceCount, staffCount] = await Promise.all([
    prisma.customer.count({ where: { tenantId: tenant.id } }),
    prisma.booking.count({ where: { tenantId: tenant.id } }),
    prisma.service.count({ where: { tenantId: tenant.id } }),
    prisma.staff.count({ where: { tenantId: tenant.id } }),
  ]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayBookings = await prisma.booking.count({
    where: {
      tenantId: tenant.id,
      startTime: { gte: today, lt: tomorrow },
    },
  });

  return {
    customers: customerCount,
    bookings: bookingCount,
    services: serviceCount,
    staff: staffCount,
    todayBookings,
  };
}

export async function tenantRoutes(fastify: FastifyInstance) {
  fastify.get('/', getTenant);
  fastify.put('/', { schema: { body: updateTenantSchema } }, updateTenant);
  fastify.get('/stats', getTenantStats);
}
