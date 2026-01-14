import { Tenant, TenantRepository, TenantStatus } from '../domain/tenant';

export interface CreateTenantInput {
  name: string;
  slug: string;
  subscriptionTier?: 'free' | 'starter' | 'professional' | 'enterprise';
  settings?: Record<string, unknown>;
}

export class CreateTenantUseCase {
  constructor(private tenantRepository: TenantRepository) {}

  async execute(input: CreateTenantInput): Promise<Tenant> {
    const existing = await this.tenantRepository.findBySlug(input.slug);
    if (existing) {
      throw new TenantSlugExistsError('Tenant slug already exists');
    }

    return this.tenantRepository.create({
      ...input,
      status: 'trial',
      subscriptionTier: input.subscriptionTier ?? 'free',
      settings: input.settings ?? {},
    });
  }
}

export class UpdateTenantUseCase {
  constructor(private tenantRepository: TenantRepository) {}

  async execute(
    tenantId: string,
    data: Partial<Omit<Tenant, 'id' | 'createdAt'>>
  ): Promise<Tenant> {
    const tenant = await this.tenantRepository.findById(tenantId);
    if (!tenant) {
      throw new TenantNotFoundError('Tenant not found');
    }

    return this.tenantRepository.update(tenantId, data);
  }
}

export class UpdateTenantStatusUseCase {
  constructor(private tenantRepository: TenantRepository) {}

  async execute(
    tenantId: string,
    status: TenantStatus
  ): Promise<Tenant> {
    const tenant = await this.tenantRepository.findById(tenantId);
    if (!tenant) {
      throw new TenantNotFoundError('Tenant not found');
    }

    return this.tenantRepository.update(tenantId, { status });
  }
}

export class GetTenantBySlugUseCase {
  constructor(private tenantRepository: TenantRepository) {}

  async execute(slug: string): Promise<Tenant | null> {
    return this.tenantRepository.findBySlug(slug);
  }
}

export class TenantSlugExistsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TenantSlugExistsError';
  }
}

export class TenantNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TenantNotFoundError';
  }
}
