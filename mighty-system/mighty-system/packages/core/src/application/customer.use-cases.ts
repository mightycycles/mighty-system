import { Customer, CustomerCreateInput, CustomerRepository, GDPRService } from '../domain/customer';
import { TenantId } from '../domain/tenant';

export interface CreateCustomerInput {
  tenantId: TenantId;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: Customer['address'];
  dateOfBirth?: Date;
  marketingConsent?: boolean;
  gdprConsent?: boolean;
  notes?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export class CreateCustomerUseCase {
  constructor(
    private customerRepository: CustomerRepository,
    private gdprService: GDPRService
  ) {}

  async execute(input: CreateCustomerInput): Promise<Customer> {
    const existing = await this.customerRepository.findByEmail(input.email, input.tenantId);
    if (existing) {
      throw new CustomerAlreadyExistsError('Customer with this email already exists');
    }

    const customer = await this.customerRepository.create({
      ...input,
      tags: input.tags ?? [],
      metadata: input.metadata ?? {},
    });

    if (input.gdprConsent) {
      await this.gdprService.recordConsent(customer.id, input.tenantId, {
        type: 'booking_creation',
        granted: true,
        timestamp: new Date(),
        source: 'web_form',
      });
    }

    return customer;
  }
}

export class ExportCustomerDataUseCase {
  constructor(private gdprService: GDPRService) {}

  async execute(customerId: string, tenantId: string): Promise<Record<string, unknown>> {
    return this.gdprService.exportCustomerData(customerId, tenantId);
  }
}

export class DeleteCustomerUseCase {
  constructor(
    private customerRepository: CustomerRepository,
    private gdprService: GDPRService
  ) {}

  async execute(customerId: string, tenantId: string, softDelete = true): Promise<void> {
    const customer = await this.customerRepository.findById(customerId);
    if (!customer) {
      throw new CustomerNotFoundError('Customer not found');
    }

    if (customer.tenantId !== tenantId) {
      throw new CustomerNotFoundError('Customer not found in this tenant');
    }

    if (softDelete) {
      await this.customerRepository.update(customerId, {
        email: `deleted_${Date.now()}@deleted.com`,
        phone: undefined,
        metadata: { ...customer.metadata, deletedAt: new Date().toISOString() },
      });
    } else {
      await this.gdprService.deleteCustomerData(customerId, tenantId);
      await this.customerRepository.delete(customerId);
    }
  }
}

export class CustomerAlreadyExistsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CustomerAlreadyExistsError';
  }
}

export class CustomerNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CustomerNotFoundError';
  }
}
