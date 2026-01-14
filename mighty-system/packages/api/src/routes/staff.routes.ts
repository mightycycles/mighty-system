import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../services/database';
import { NotFoundError } from '../middleware/error-handler';

const createStaffSchema = z.object({
  userId: z.string().uuid(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  role: z.enum(['OWNER', 'MANAGER', 'STAFF']).default('STAFF'),
  isActive: z.boolean().default(true),
  workingHours: z.record(z.array(z.object({
    start: z.string(),
    end: z.string(),
  }))).optional(),
  breaks: z.array(z.object({
    dayOfWeek: z.number().min(0).max(6),
    start: z.string(),
    end: z.string(),
  })).optional(),
  serviceIds: z.array(z.string().uuid()).optional(),
});

const updateStaffSchema = createStaffSchema.partial();

async function createStaff(request: FastifyRequest) {
  const tenant = request.tenant;
  if (!tenant) {
    throw new NotFoundError('Tenant not found');
  }

  const body = createStaffSchema.parse(request.body);

  const user = await prisma.user.findUnique({
    where: { id: body.userId },
  });

  if (!user || user.tenantId !== tenant.id) {
    throw new NotFoundError('User not found');
  }

  const staff = await prisma.staff.create({
    data: {
      tenantId: tenant.id,
      userId: body.userId,
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone,
      role: body.role,
      isActive: body.isActive,
      workingHours: body.workingHours ?? {},
      breaks: body.breaks ?? [],
    },
  });

  if (body.serviceIds?.length) {
    await prisma.staffService.createMany({
      data: body.serviceIds.map(serviceId => ({
        staffId: staff.id,
        serviceId,
      })),
    });
  }

  return staff;
}

async function getStaff(request: FastifyRequest) {
  const tenant = request.tenant;
  if (!tenant) {
    throw new NotFoundError('Tenant not found');
  }

  const staff = await prisma.staff.findMany({
    where: { tenantId: tenant.id },
    include: {
      user: true,
      services: {
        include: {
          service: true,
        },
      },
    },
    orderBy: { firstName: 'asc' },
  });

  return staff;
}

async function getStaffMember(request: FastifyRequest) {
  const tenant = request.tenant;
  if (!tenant) {
    throw new NotFoundError('Tenant not found');
  }

  const staff = await prisma.staff.findFirst({
    where: {
      id: (request.params as any).id,
      tenantId: tenant.id,
    },
    include: {
      user: true,
      services: {
        include: {
          service: true,
        },
      },
    },
  });

  if (!staff) {
    throw new NotFoundError('Staff member not found');
  }

  return staff;
}

async function updateStaff(request: FastifyRequest) {
  const tenant = request.tenant;
  if (!tenant) {
    throw new NotFoundError('Tenant not found');
  }

  const body = updateStaffSchema.parse(request.body);
  const staffId = (request.params as any).id;

  const staff = await prisma.staff.findFirst({
    where: { id: staffId, tenantId: tenant.id },
  });

  if (!staff) {
    throw new NotFoundError('Staff member not found');
  }

  const updated = await prisma.staff.update({
    where: { id: staffId },
    data: {
      ...body,
      workingHours: body.workingHours ?? staff.workingHours,
      breaks: body.breaks ?? staff.breaks,
    },
  });

  if (body.serviceIds) {
    await prisma.staffService.deleteMany({ where: { staffId } });
    if (body.serviceIds.length) {
      await prisma.staffService.createMany({
        data: body.serviceIds.map(serviceId => ({
          staffId,
          serviceId,
        })),
      });
    }
  }

  return updated;
}

async function deleteStaff(request: FastifyRequest) {
  const tenant = request.tenant;
  if (!tenant) {
    throw new NotFoundError('Tenant not found');
  }

  const staffId = (request.params as any).id;

  const staff = await prisma.staff.findFirst({
    where: { id: staffId, tenantId: tenant.id },
  });

  if (!staff) {
    throw new NotFoundError('Staff member not found');
  }

  await prisma.staffService.deleteMany({ where: { staffId } });
  await prisma.staff.delete({ where: { id: staffId } });

  return { success: true };
}

export async function staffRoutes(fastify: FastifyInstance) {
  fastify.post('/', { schema: { body: createStaffSchema } }, createStaff);
  fastify.get('/', getStaff);
  fastify.get('/:id', getStaffMember);
  fastify.put('/:id', { schema: { body: updateStaffSchema } }, updateStaff);
  fastify.delete('/:id', deleteStaff);
}
