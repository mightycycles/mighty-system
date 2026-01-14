import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../services/database';
import { NotFoundError } from '../middleware/error-handler';

const createServiceSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  duration: z.number().min(1),
  price: z.number().min(0),
  currency: z.string().default('GBP'),
  categoryId: z.string().uuid().optional(),
  isActive: z.boolean().default(true),
  maxCapacity: z.number().min(1).default(1),
  bufferTime: z.number().min(0).default(0),
  staffRequired: z.number().min(1).default(1),
  color: z.string().optional(),
  minAdvanceHours: z.number().min(0).default(0),
  maxAdvanceDays: z.number().min(0).default(365),
  minCancelHours: z.number().min(0).default(24),
  refundPercent: z.number().min(0).max(100).default(100),
});

const updateServiceSchema = createServiceSchema.partial();

async function createService(request: FastifyRequest) {
  const tenant = request.tenant;
  if (!tenant) {
    throw new NotFoundError('Tenant not found');
  }

  const body = createServiceSchema.parse(request.body);

  const service = await prisma.service.create({
    data: {
      tenantId: tenant.id,
      ...body,
    },
  });

  return service;
}

async function getServices(request: FastifyRequest) {
  const tenant = request.tenant;
  if (!tenant) {
    throw new NotFoundError('Tenant not found');
  }

  const services = await prisma.service.findMany({
    where: { tenantId: tenant.id },
    include: {
      category: true,
    },
    orderBy: { name: 'asc' },
  });

  return services;
}

async function getService(request: FastifyRequest) {
  const tenant = request.tenant;
  if (!tenant) {
    throw new NotFoundError('Tenant not found');
  }

  const service = await prisma.service.findFirst({
    where: {
      id: (request.params as any).id,
      tenantId: tenant.id,
    },
    include: {
      category: true,
      staff: {
        include: {
          staff: true,
        },
      },
    },
  });

  if (!service) {
    throw new NotFoundError('Service not found');
  }

  return service;
}

async function updateService(request: FastifyRequest) {
  const tenant = request.tenant;
  if (!tenant) {
    throw new NotFoundError('Tenant not found');
  }

  const body = updateServiceSchema.parse(request.body);
  const serviceId = (request.params as any).id;

  const service = await prisma.service.findFirst({
    where: { id: serviceId, tenantId: tenant.id },
  });

  if (!service) {
    throw new NotFoundError('Service not found');
  }

  const updated = await prisma.service.update({
    where: { id: serviceId },
    data: body,
  });

  return updated;
}

async function deleteService(request: FastifyRequest) {
  const tenant = request.tenant;
  if (!tenant) {
    throw new NotFoundError('Tenant not found');
  }

  const serviceId = (request.params as any).id;

  const service = await prisma.service.findFirst({
    where: { id: serviceId, tenantId: tenant.id },
  });

  if (!service) {
    throw new NotFoundError('Service not found');
  }

  await prisma.service.delete({ where: { id: serviceId } });

  return { success: true };
}

export async function serviceRoutes(fastify: FastifyInstance) {
  fastify.post('/', { schema: { body: createServiceSchema } }, createService);
  fastify.get('/', getServices);
  fastify.get('/:id', getService);
  fastify.put('/:id', { schema: { body: updateServiceSchema } }, updateService);
  fastify.delete('/:id', deleteService);
}
