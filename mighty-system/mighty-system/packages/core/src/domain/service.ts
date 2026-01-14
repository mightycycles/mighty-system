import { z } from 'zod';
import { Entity, EntityIdSchema } from './base';

export const ServiceIdSchema = EntityIdSchema;
export type ServiceId = z.infer<typeof ServiceIdSchema>;

export const ServiceSchema = z.object({
  id: ServiceIdSchema,
  tenantId: EntityIdSchema,
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  duration: z.number().min(1), // minutes
  price: z.number().min(0),
  currency: z.string().default('GBP'),
  categoryId: EntityIdSchema.optional(),
  isActive: z.boolean().default(true),
  maxCapacity: z.number().min(1).default(1),
  bufferTime: z.number().min(0).default(0), // minutes before/after
  staffRequired: z.number().min(1).default(1),
  color: z.string().optional(), // hex color for calendar
  bookingWindow: z.object({
    minAdvanceHours: z.number().min(0).default(0),
    maxAdvanceDays: z.number().min(0).default(365),
  }).optional(),
  cancellationPolicy: z.object({
    minHoursNotice: z.number().min(0).default(24),
    refundPercent: z.number().min(0).max(100).default(100),
  }).optional(),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Service = z.infer<typeof ServiceSchema>;

export interface ServiceRepository {
  findById(id: ServiceId): Promise<Service | null>;
  findByTenant(tenantId: string, filters?: {
    categoryId?: string;
    isActive?: boolean;
  }): Promise<Service[]>;
  create(service: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>): Promise<Service>;
  update(id: ServiceId, data: Partial<Service>): Promise<Service>;
  delete(id: ServiceId): Promise<void>;
}

export const StaffIdSchema = EntityIdSchema;
export type StaffId = z.infer<typeof StaffIdSchema>;

export const StaffSchema = z.object({
  id: StaffIdSchema,
  tenantId: EntityIdSchema,
  userId: EntityIdSchema,
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  role: z.enum(['owner', 'manager', 'staff']).default('staff'),
  serviceIds: z.array(EntityIdSchema).default([]),
  workingHours: z.object({
    monday: z.array(z.object({ start: z.string(), end: z.string() })).optional(),
    tuesday: z.array(z.object({ start: z.string(), end: z.string() })).optional(),
    wednesday: z.array(z.object({ start: z.string(), end: z.string() })).optional(),
    thursday: z.array(z.object({ start: z.string(), end: z.string() })).optional(),
    friday: z.array(z.object({ start: z.string(), end: z.string() })).optional(),
    saturday: z.array(z.object({ start: z.string(), end: z.string() })).optional(),
    sunday: z.array(z.object({ start: z.string(), end: z.string() })).optional(),
  }).optional(),
  breaks: z.array(z.object({
    dayOfWeek: z.number().min(0).max(6),
    start: z.string(),
    end: z.string(),
  })).default([]),
  isActive: z.boolean().default(true),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Staff = z.infer<typeof StaffSchema>;

export interface StaffRepository {
  findById(id: StaffId): Promise<Staff | null>;
  findByTenant(tenantId: string, filters?: {
    serviceId?: string;
    isActive?: boolean;
  }): Promise<Staff[]>;
  create(staff: Omit<Staff, 'id' | 'createdAt' | 'updatedAt'>): Promise<Staff>;
  update(id: StaffId, data: Partial<Staff>): Promise<Staff>;
  delete(id: StaffId): Promise<void>;
}
