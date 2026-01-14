import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../services/database';

export async function healthRoutes(fastify: FastifyInstance) {
  fastify.get('/', async () => {
    return { status: 'healthy', timestamp: new Date().toISOString() };
  });

  fastify.get('/ready', async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { status: 'ready', database: 'connected' };
    } catch {
      return { status: 'not ready', database: 'disconnected' };
    }
  });
}
