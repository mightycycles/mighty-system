import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../services/database';
import { AuthenticationError, NotFoundError } from '../middleware/error-handler';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET ?? 'your-secret-key';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  tenantName: z.string().min(1),
  tenantSlug: z.string().min(1).regex(/^[a-z0-9-]+$/),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

async function register(request: FastifyRequest) {
  const body = registerSchema.parse(request.body);

  const existingTenant = await prisma.tenant.findUnique({
    where: { slug: body.tenantSlug },
  });

  if (existingTenant) {
    throw new Error('Tenant slug already exists');
  }

  const hashedPassword = await bcrypt.hash(body.password, 12);

  const tenant = await prisma.tenant.create({
    data: {
      name: body.tenantName,
      slug: body.tenantSlug,
      status: 'TRIAL',
      subscriptionTier: 'FREE',
    },
  });

  const user = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: body.email,
      password: hashedPassword,
      firstName: body.firstName,
      lastName: body.lastName,
      role: 'OWNER',
    },
  });

  const token = jwt.sign(
    { userId: user.id, tenantId: tenant.id, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: tenant.id,
    },
    tenant: {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      status: tenant.status,
    },
  };
}

async function login(request: FastifyRequest) {
  const body = loginSchema.parse(request.body);

  const user = await prisma.user.findFirst({
    where: {
      email: body.email,
      isActive: true,
    },
    include: {
      tenant: true,
    },
  });

  if (!user) {
    throw new AuthenticationError('Invalid credentials');
  }

  const validPassword = await bcrypt.compare(body.password, user.password);
  if (!validPassword) {
    throw new AuthenticationError('Invalid credentials');
  }

  const token = jwt.sign(
    { userId: user.id, tenantId: user.tenantId, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    },
    tenant: {
      id: user.tenant.id,
      name: user.tenant.name,
      slug: user.tenant.slug,
      status: user.tenant.status,
    },
  };
}

async function getMe(request: FastifyRequest) {
  const user = (request as any).user;
  if (!user) {
    throw new AuthenticationError();
  }

  const fullUser = await prisma.user.findUnique({
    where: { id: user.userId },
    include: {
      tenant: true,
    },
  });

  if (!fullUser) {
    throw new NotFoundError('User not found');
  }

  return {
    user: {
      id: fullUser.id,
      email: fullUser.email,
      role: fullUser.role,
      tenantId: fullUser.tenantId,
    },
    tenant: {
      id: fullUser.tenant.id,
      name: fullUser.tenant.name,
      slug: fullUser.tenant.slug,
      status: fullUser.tenant.status,
    },
  };
}

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/register', { schema: { body: registerSchema } }, register);
  fastify.post('/login', { schema: { body: loginSchema } }, login);
  fastify.get('/me', getMe);
}
