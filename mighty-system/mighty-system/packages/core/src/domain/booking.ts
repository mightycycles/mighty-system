import { z } from 'zod';
import { Entity, EntityIdSchema } from './base';

export const BookingIdSchema = EntityIdSchema;
export type BookingId = z.infer<typeof BookingIdSchema>;

export const BookingStatusSchema = z.enum(['pending', 'confirmed', 'cancelled', 'completed', 'no_show']);
export type BookingStatus = z.infer<typeof BookingStatusSchema>;

export const BookingSchema = z.object({
  id: BookingIdSchema,
  tenantId: EntityIdSchema,
  customerId: EntityIdSchema,
  serviceId: EntityIdSchema,
  staffId: EntityIdSchema.optional(),
  locationId: EntityIdSchema.optional(),
  startTime: z.date(),
  endTime: z.date(),
  status: BookingStatusSchema,
  notes: z.string().optional(),
  price: z.number().min(0),
  deposit: z.number().min(0).default(0),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.date(),
  updatedAt: z.date(),
  cancelledAt: z.date().optional(),
  confirmationSentAt: z.date().optional(),
});
export type Booking = z.infer<typeof BookingSchema>;

export const BookingCreateInputSchema = z.object({
  tenantId: EntityIdSchema,
  customerId: EntityIdSchema,
  serviceId: EntityIdSchema,
  staffId: EntityIdSchema.optional(),
  locationId: EntityIdSchema.optional(),
  startTime: z.date(),
  endTime: z.date(),
  notes: z.string().optional(),
  price: z.number().min(0),
  deposit: z.number().min(0).default(0),
  metadata: z.record(z.unknown()).optional(),
});
export type BookingCreateInput = z.infer<typeof BookingCreateInputSchema>;

export interface BookingRepository {
  findById(id: BookingId): Promise<Booking | null>;
  findByTenant(tenantId: string, filters?: {
    startDate?: Date;
    endDate?: Date;
    status?: BookingStatus[];
    customerId?: string;
    staffId?: string;
  }): Promise<Booking[]>;
  findByCustomer(customerId: string, tenantId?: string): Promise<Booking[]>;
  create(input: BookingCreateInput): Promise<Booking>;
  update(id: BookingId, data: Partial<Booking>): Promise<Booking>;
  cancel(id: BookingId, reason?: string): Promise<Booking>;
  delete(id: BookingId): Promise<void>;
}

export interface BookingSlotService {
  checkAvailability(
    tenantId: string,
    serviceId: string,
    staffId: string | undefined,
    startTime: Date,
    endTime: Date
  ): Promise<boolean>;
  getAvailableSlots(
    tenantId: string,
    serviceId: string,
    staffId: string | undefined,
    date: Date
  ): Promise<Array<{ start: Date; end: Date }>>;
}
