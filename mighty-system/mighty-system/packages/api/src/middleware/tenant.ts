import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../services/database';
import { logger } from '../services/logger';

export async function tenantMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const excludedPaths = ['/health', '/docs', '/api/v1/auth'];
  
  if (excludedPaths.some(path => request.url.startsWith(path))) {
    return;
  }

  const host = request.hostname;
  const subdomain = host.split('.')[0];

  if (request.headers['x-tenant-id']) {
    const tenantId = request.headers['x-tenant-id'] as string;
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    
    if (tenant && tenant.status === 'ACTIVE') {
      request.tenant = tenant;
      return;
    }
  }

  const tenant = await prisma.tenant.findFirst({
    where: {
      OR: [
        { slug: subdomain },
        { slug: host.split('.')[0] },
      ],
      status: { in: ['ACTIVE', 'TRIAL'] },
    },
  });

  if (tenant) {
    request.tenant = tenant as any;
  } else if (!excludedPaths.some(path => request.url.startsWith(path))) {
    reply.status(404).send({ error: 'Tenant not found' });
  }
}
