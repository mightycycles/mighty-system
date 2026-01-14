import { Booking, BookingCreateInput, BookingRepository, BookingStatus } from '../domain/booking';
import { TenantId } from '../domain/tenant';
import { BookingSlotService } from '../domain/booking';

export interface CreateBookingInput {
  tenantId: TenantId;
  customerId: string;
  serviceId: string;
  staffId?: string;
  locationId?: string;
  startTime: Date;
  endTime: Date;
  notes?: string;
  price: number;
  deposit?: number;
  metadata?: Record<string, unknown>;
}

export interface BookingResult {
  booking: Booking;
  conflicts: Array<{ start: Date; end: Date }>;
}

export class CreateBookingUseCase {
  constructor(
    private bookingRepository: BookingRepository,
    private slotService: BookingSlotService
  ) {}

  async execute(input: CreateBookingInput): Promise<BookingResult> {
    const isAvailable = await this.slotService.checkAvailability(
      input.tenantId,
      input.serviceId,
      input.staffId,
      input.startTime,
      input.endTime
    );

    if (!isAvailable) {
      const conflicts = await this.getConflicts(
        input.tenantId,
        input.serviceId,
        input.staffId,
        input.startTime,
        input.endTime
      );
      throw new BookingConflictError('Time slot is not available', conflicts);
    }

    const booking = await this.bookingRepository.create({
      ...input,
      status: 'pending',
      deposit: input.deposit ?? 0,
      metadata: input.metadata ?? {},
    });

    return { booking, conflicts: [] };
  }

  private async getConflicts(
    tenantId: TenantId,
    serviceId: string,
    staffId: string | undefined,
    startTime: Date,
    endTime: Date
  ): Promise<Array<{ start: Date; end: Date }>> {
    const existingBookings = await this.bookingRepository.findByTenant(tenantId, {
      startDate: startTime,
      endDate: endTime,
      staffId,
    });

    return existingBookings.map(b => ({
      start: b.startTime,
      end: b.endTime,
    }));
  }
}

export class UpdateBookingStatusUseCase {
  constructor(private bookingRepository: BookingRepository) {}

  async execute(
    bookingId: string,
    status: BookingStatus,
    reason?: string
  ): Promise<Booking> {
    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking) {
      throw new BookingNotFoundError('Booking not found');
    }

    switch (status) {
      case 'cancelled':
        return this.bookingRepository.cancel(bookingId, reason);
      case 'confirmed':
      case 'completed':
      case 'no_show':
        return this.bookingRepository.update(bookingId, { status });
      default:
        throw new InvalidStatusError(`Cannot transition to status: ${status}`);
    }
  }
}

export class GetAvailableSlotsUseCase {
  constructor(private slotService: BookingSlotService) {}

  async execute(
    tenantId: TenantId,
    serviceId: string,
    staffId: string | undefined,
    date: Date
  ): Promise<Array<{ start: Date; end: Date }>> {
    return this.slotService.getAvailableSlots(tenantId, serviceId, staffId, date);
  }
}

export class BookingConflictError extends Error {
  constructor(
    message: string,
    public conflicts: Array<{ start: Date; end: Date }>
  ) {
    super(message);
    this.name = 'BookingConflictError';
  }
}

export class BookingNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BookingNotFoundError';
  }
}

export class InvalidStatusError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidStatusError';
  }
}
