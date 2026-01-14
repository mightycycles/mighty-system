export interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL' | 'CANCELLED';
  subscriptionTier: 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  settings: Record<string, unknown>;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  role: 'OWNER' | 'MANAGER' | 'STAFF';
  tenantId: string;
}

export interface Customer {
  id: string;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postcode?: string;
  country: string;
  dateOfBirth?: string;
  marketingConsent: boolean;
  gdprConsent: boolean;
  notes?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
  currency: string;
  categoryId?: string;
  isActive: boolean;
  maxCapacity: number;
  bufferTime: number;
  staffRequired: number;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Staff {
  id: string;
  tenantId: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: 'OWNER' | 'MANAGER' | 'STAFF';
  isActive: boolean;
  workingHours: Record<string, Array<{ start: string; end: string }>>;
  breaks: Array<{
    dayOfWeek: number;
    start: string;
    end: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  id: string;
  tenantId: string;
  customerId: string;
  serviceId: string;
  staffId?: string;
  locationId?: string;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
  notes?: string;
  price: number;
  deposit: number;
  createdAt: string;
  updatedAt: string;
  cancelledAt?: string;
  customer?: Customer;
  service?: Service;
  staff?: Staff;
}

export interface BookingWithRelations extends Booking {
  customer: Customer;
  service: Service;
  staff?: Staff;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}
