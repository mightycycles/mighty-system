import { z } from 'zod';
import { Entity, EntityIdSchema } from './base';

export const CustomerIdSchema = EntityIdSchema;
export type CustomerId = z.infer<typeof CustomerIdSchema>;

export const CustomerSchema = z.object({
  id: CustomerIdSchema,
  tenantId: EntityIdSchema,
  email: z.string().email(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  phone: z.string().optional(),
  address: z.object({
    line1: z.string().optional(),
    line2: z.string().optional(),
    city: z.string().optional(),
    postcode: z.string().optional(),
    country: z.string().default('UK'),
  }).optional(),
  dateOfBirth: z.date().optional(),
  marketingConsent: z.boolean().default(false),
  gdprConsent: z.boolean().default(false),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Customer = z.infer<typeof CustomerSchema>;

export const CustomerCreateInputSchema = z.object({
  tenantId: EntityIdSchema,
  email: z.string().email(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  phone: z.string().optional(),
  address: CustomerSchema.shape.address.optional(),
  dateOfBirth: z.date().optional(),
  marketingConsent: z.boolean().optional(),
  gdprConsent: z.boolean().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type CustomerCreateInput = z.infer<typeof CustomerCreateInputSchema>;

export interface CustomerRepository {
  findById(id: CustomerId): Promise<Customer | null>;
  findByEmail(email: string, tenantId: string): Promise<Customer | null>;
  findByTenant(tenantId: string, filters?: {
    search?: string;
    tags?: string[];
    limit?: number;
    offset?: number;
  }): Promise<Customer[]>;
  create(input: CustomerCreateInput): Promise<Customer>;
  update(id: CustomerId, data: Partial<Customer>): Promise<Customer>;
  delete(id: CustomerId): Promise<void>;
  count(tenantId: string): Promise<number>;
}

export interface GDPRService {
  exportCustomerData(customerId: string, tenantId: string): Promise<Record<string, unknown>>;
  deleteCustomerData(customerId: string, tenantId: string): Promise<void>;
  recordConsent(customerId: string, tenantId: string, consent: {
    type: string;
    granted: boolean;
    timestamp: Date;
    source: string;
  }): Promise<void>;
}
