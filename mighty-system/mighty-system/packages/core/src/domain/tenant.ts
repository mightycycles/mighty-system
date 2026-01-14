import { z } from 'zod';
import { Entity } from './base';

export const TenantIdSchema = z.string().uuid();
export type TenantId = z.infer<typeof TenantIdSchema>;

export const TenantStatusSchema = z.enum(['active', 'suspended', 'trial', 'cancelled']);
export type TenantStatus = z.infer<typeof TenantStatusSchema>;

export const TenantSchema = z.object({
  id: TenantIdSchema,
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  status: TenantStatusSchema,
  settings: z.record(z.unknown()).default({}),
  subscriptionTier: z.enum(['free', 'starter', 'professional', 'enterprise']).default('free'),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Tenant = z.infer<typeof TenantSchema>;

export interface TenantRepository {
  findById(id: TenantId): Promise<Tenant | null>;
  findBySlug(slug: string): Promise<Tenant | null>;
  create(tenant: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>): Promise<Tenant>;
  update(id: TenantId, data: Partial<Tenant>): Promise<Tenant>;
  delete(id: TenantId): Promise<void>;
}
