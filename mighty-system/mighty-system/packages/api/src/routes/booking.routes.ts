import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../services/database';
import { NotFoundError, ValidationError } from '../middleware/error-handler';
import { addMinutes, startOfDay, endOfDay } from 'date-fns';

const createBookingSchema = z.object({
  customerId: z.string().uuid(),
  serviceId: z.string().uuid(),
  staffId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  startTime: z.string().datetime(),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

const updateBookingSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW']).optional(),
  notes: z.string().optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
});

const bookingQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.string().optional(),
  customerId: z.string().optional(),
  staffId: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

async function createBooking(request: FastifyRequest) {
  const tenant = request.tenant;
  if (!tenant) {
    throw new NotFoundError('Tenant not found');
  }

  const body = createBookingSchema.parse(request.body);

  const service = await prisma.service.findUnique({
    where: { id: body.serviceId },
  });

  if (!service || service.tenantId !== tenant.id) {
    throw new NotFoundError('Service not found');
  }

  const customer = await prisma.customer.findUnique({
    where: { id: body.customerId },
  });

  if (!customer || customer.tenantId !== tenant.id) {
    throw new NotFoundError('Customer not found');
  }

  const startTime = new Date(body.startTime);
  const endTime = addMinutes(startTime, service.duration + service.bufferTime);

  const conflictingBooking = await prisma.booking.findFirst({
    where: {
      tenantId: tenant.id,
      staffId: body.staffId ?? null,
      status: { notIn: ['CANCELLED'] },
      OR: [
        {
          startTime: { lte: startTime },
          endTime: { gt: startTime },
        },
        {
          startTime: { lt: endTime },
          endTime: { gte: endTime },
        },
        {
          startTime: { gte: startTime },
          endTime: { lte: endTime },
        },
      ],
    },
  });

  if (conflictingBooking) {
    throw new ValidationError('Time slot is not available', {
      conflictingBookingId: conflictingBooking.id,
      startTime: conflictingBooking.startTime,
      endTime: conflictingBooking.endTime,
    });
  }

  const booking = await prisma.booking.create({
    data: {
      tenantId: tenant.id,
      customerId: body.customerId,
      serviceId: body.serviceId,
      staffId: body.staffId,
      locationId: body.locationId,
      startTime,
      endTime,
      price: service.price,
      status: 'PENDING',
      notes: body.notes,
      metadata: body.metadata ?? {},
    },
  });

  return booking;
}

async function getBookings(request: FastifyRequest) {
  const tenant = request.tenant;
  if (!tenant) {
    throw new NotFoundError('Tenant not found');
  }

  const query = bookingQuerySchema.parse(request.query);

  const where: any = {
    tenantId: tenant.id,
  };

  if (query.startDate || query.endDate) {
    where.startTime = {};
    if (query.startDate) where.startTime.gte = new Date(query.startDate);
    if (query.endDate) where.startTime.lte = new Date(query.endDate);
  }

  if (query.status) {
    where.status = query.status;
  }

  if (query.customerId) {
    where.customerId = query.customerId;
  }

  if (query.staffId) {
    where.staffId = query.staffId;
  }

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        customer: true,
        service: true,
        staff: true,
        location: true,
      },
      orderBy: { startTime: 'asc' },
      take: query.limit,
      skip: query.offset,
    }),
    prisma.booking.count({ where }),
  ]);

  return {
    data: bookings,
    total,
    limit: query.limit,
    offset: query.offset,
  };
}

async function getBooking(request: FastifyRequest) {
  const tenant = request.tenant;
  if (!tenant) {
    throw new NotFoundError('Tenant not found');
  }

  const booking = await prisma.booking.findFirst({
    where: {
      id: (request.params as any).id,
      tenantId: tenant.id,
    },
    include: {
      customer: true,
      service: true,
      staff: true,
      location: true,
    },
  });

  if (!booking) {
    throw new NotFoundError('Booking not found');
  }

  return booking;
}

async function updateBooking(request: FastifyRequest) {
  const tenant = request.tenant;
  if (!tenant) {
    throw new NotFoundError('Tenant not found');
  }

  const body = updateBookingSchema.parse(request.body);
  const bookingId = (request.params as any).id;

  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, tenantId: tenant.id },
  });

  if (!booking) {
    throw new NotFoundError('Booking not found');
  }

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      ...body,
      startTime: body.startTime ? new Date(body.startTime) : undefined,
      endTime: body.endTime ? new Date(body.endTime) : undefined,
      cancelledAt: body.status === 'CANCELLED' ? new Date() : undefined,
    },
  });

  return updated;
}

async function cancelBooking(request: FastifyRequest) {
  const tenant = request.tenant;
  if (!tenant) {
    throw new NotFoundError('Tenant not found');
  }

  const bookingId = (request.params as any).id;
  const body = z.object({ reason: z.string().optional() }).parse(request.body);

  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, tenantId: tenant.id },
  });

  if (!booking) {
    throw new NotFoundError('Booking not found');
  }

  if (booking.status === 'CANCELLED') {
    throw new Error('Booking is already cancelled');
  }

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      notes: booking.notes ? `${booking.notes}\n\nCancellation reason: ${body.reason ?? 'No reason provided'}` : `Cancellation reason: ${body.reason ?? 'No reason provided'}`,
    },
  });

  return updated;
}

export async function bookingRoutes(fastify: FastifyInstance) {
  fastify.post('/', { schema: { body: createBookingSchema } }, createBooking);
  fastify.get('/', { schema: { querystring: bookingQuerySchema } }, getBookings);
  fastify.get('/:id', getBooking);
  fastify.put('/:id', { schema: { body: updateBookingSchema } }, updateBooking);
  fastify.post('/:id/cancel', cancelBooking);
}
