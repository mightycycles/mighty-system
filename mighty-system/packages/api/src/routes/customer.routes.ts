import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../services/database';
import { NotFoundError } from '../middleware/error-handler';

const createCustomerSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  phone: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  postcode: z.string().optional(),
  country: z.string().default('UK'),
  dateOfBirth: z.string().optional(),
  marketingConsent: z.boolean().optional(),
  gdprConsent: z.boolean().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const updateCustomerSchema = z.object({
  email: z.string().email().optional(),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  postcode: z.string().optional(),
  country: z.string().optional(),
  dateOfBirth: z.string().optional(),
  marketingConsent: z.boolean().optional(),
  gdprConsent: z.boolean().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const customerQuerySchema = z.object({
  search: z.string().optional(),
  tags: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

async function createCustomer(request: FastifyRequest) {
  const tenant = request.tenant;
  if (!tenant) {
    throw new NotFoundError('Tenant not found');
  }

  const body = createCustomerSchema.parse(request.body);

  const existing = await prisma.customer.findFirst({
    where: { tenantId: tenant.id, email: body.email },
  });

  if (existing) {
    throw new Error('Customer with this email already exists');
  }

  const customer = await prisma.customer.create({
    data: {
      tenantId: tenant.id,
      email: body.email,
      firstName: body.firstName,
      lastName: body.lastName,
      phone: body.phone,
      addressLine1: body.addressLine1,
      addressLine2: body.addressLine2,
      city: body.city,
      postcode: body.postcode,
      country: body.country,
      dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
      marketingConsent: body.marketingConsent ?? false,
      gdprConsent: body.gdprConsent ?? false,
      notes: body.notes,
      tags: body.tags ?? [],
    },
  });

  if (body.gdprConsent) {
    await prisma.gDPRConsent.create({
      data: {
        customerId: customer.id,
        tenantId: tenant.id,
        type: 'booking_creation',
        granted: true,
        source: 'api',
      },
    });
  }

  return customer;
}

async function getCustomers(request: FastifyRequest) {
  const tenant = request.tenant;
  if (!tenant) {
    throw new NotFoundError('Tenant not found');
  }

  const query = customerQuerySchema.parse(request.query);

  const where: any = { tenantId: tenant.id };

  if (query.search) {
    where.OR = [
      { firstName: { contains: query.search, mode: 'insensitive' } },
      { lastName: { contains: query.search, mode: 'insensitive' } },
      { email: { contains: query.search, mode: 'insensitive' } },
      { phone: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  if (query.tags) {
    where.tags = { hasSome: query.tags.split(',') };
  }

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: query.limit,
      skip: query.offset,
    }),
    prisma.customer.count({ where }),
  ]);

  return {
    data: customers,
    total,
    limit: query.limit,
    offset: query.offset,
  };
}

async function getCustomer(request: FastifyRequest) {
  const tenant = request.tenant;
  if (!tenant) {
    throw new NotFoundError('Tenant not found');
  }

  const customer = await prisma.customer.findFirst({
    where: {
      id: (request.params as any).id,
      tenantId: tenant.id,
    },
    include: {
      bookings: {
        take: 10,
        orderBy: { startTime: 'desc' },
        include: {
          service: true,
        },
      },
    },
  });

  if (!customer) {
    throw new NotFoundError('Customer not found');
  }

  return customer;
}

async function updateCustomer(request: FastifyRequest) {
  const tenant = request.tenant;
  if (!tenant) {
    throw new NotFoundError('Tenant not found');
  }

  const body = updateCustomerSchema.parse(request.body);
  const customerId = (request.params as any).id;

  const customer = await prisma.customer.findFirst({
    where: { id: customerId, tenantId: tenant.id },
  });

  if (!customer) {
    throw new NotFoundError('Customer not found');
  }

  const updated = await prisma.customer.update({
    where: { id: customerId },
    data: {
      ...body,
      dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
    },
  });

  return updated;
}

async function deleteCustomer(request: FastifyRequest) {
  const tenant = request.tenant;
  if (!tenant) {
    throw new NotFoundError('Tenant not found');
  }

  const customerId = (request.params as any).id;

  const customer = await prisma.customer.findFirst({
    where: { id: customerId, tenantId: tenant.id },
  });

  if (!customer) {
    throw new NotFoundError('Customer not found');
  }

  await prisma.customer.update({
    where: { id: customerId },
    data: {
      email: `deleted_${Date.now()}@deleted.com`,
      phone: null,
      metadata: { ...(customer.metadata as object), deletedAt: new Date().toISOString() },
    },
  });

  return { success: true };
}

async function exportCustomerData(request: FastifyRequest) {
  const tenant = request.tenant;
  if (!tenant) {
    throw new NotFoundError('Tenant not found');
  }

  const customerId = (request.params as any).id;

  const customer = await prisma.customer.findFirst({
    where: { id: customerId, tenantId: tenant.id },
    include: {
      bookings: true,
    },
  });

  if (!customer) {
    throw new NotFoundError('Customer not found');
  }

  const consents = await prisma.gDPRConsent.findMany({
    where: { customerId, tenantId: tenant.id },
  });

  return {
    customer,
    bookings: customer.bookings,
    gdprConsents: consents,
    exportedAt: new Date().toISOString(),
  };
}

export async function customerRoutes(fastify: FastifyInstance) {
  fastify.post('/', { schema: { body: createCustomerSchema } }, createCustomer);
  fastify.get('/', { schema: { querystring: customerQuerySchema } }, getCustomers);
  fastify.get('/:id', getCustomer);
  fastify.put('/:id', { schema: { body: updateCustomerSchema } }, updateCustomer);
  fastify.delete('/:id', deleteCustomer);
  fastify.get('/:id/export', exportCustomerData);
}
