import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    tenantName: string;
    tenantSlug: string;
  }) => api.post('/api/v1/auth/register', data),
  
  login: (data: { email: string; password: string }) =>
    api.post('/api/v1/auth/login', data),
  
  me: () => api.get('/api/v1/auth/me'),
};

export const tenantApi = {
  get: () => api.get('/api/v1/tenants'),
  update: (data: Partial<Tenant>) => api.put('/api/v1/tenants', data),
  getStats: () => api.get('/api/v1/tenants/stats'),
};

export const bookingsApi = {
  get: (params?: {
    startDate?: string;
    endDate?: string;
    status?: string;
    customerId?: string;
    staffId?: string;
    limit?: number;
    offset?: number;
  }) => api.get('/api/v1/bookings', { params }),
  
  getById: (id: string) => api.get(`/api/v1/bookings/${id}`),
  
  create: (data: {
    customerId: string;
    serviceId: string;
    staffId?: string;
    locationId?: string;
    startTime: string;
    notes?: string;
  }) => api.post('/api/v1/bookings', data),
  
  update: (id: string, data: Partial<Booking>) =>
    api.put(`/api/v1/bookings/${id}`, data),
  
  cancel: (id: string, reason?: string) =>
    api.post(`/api/v1/bookings/${id}/cancel`, { reason }),
};

export const customersApi = {
  get: (params?: {
    search?: string;
    tags?: string;
    limit?: number;
    offset?: number;
  }) => api.get('/api/v1/customers', { params }),
  
  getById: (id: string) => api.get(`/api/v1/customers/${id}`),
  
  create: (data: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    marketingConsent?: boolean;
    gdprConsent?: boolean;
  }) => api.post('/api/v1/customers', data),
  
  update: (id: string, data: Partial<Customer>) =>
    api.put(`/api/v1/customers/${id}`, data),
  
  delete: (id: string) => api.delete(`/api/v1/customers/${id}`),
  
  export: (id: string) => api.get(`/api/v1/customers/${id}/export`),
};

export const servicesApi = {
  get: () => api.get('/api/v1/services'),
  getById: (id: string) => api.get(`/api/v1/services/${id}`),
  create: (data: {
    name: string;
    description?: string;
    duration: number;
    price: number;
  }) => api.post('/api/v1/services', data),
  update: (id: string, data: Partial<Service>) =>
    api.put(`/api/v1/services/${id}`, data),
  delete: (id: string) => api.delete(`/api/v1/services/${id}`),
};

export const staffApi = {
  get: () => api.get('/api/v1/staff'),
  getById: (id: string) => api.get(`/api/v1/staff/${id}`),
  create: (data: {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    role?: 'OWNER' | 'MANAGER' | 'STAFF';
  }) => api.post('/api/v1/staff', data),
  update: (id: string, data: Partial<Staff>) =>
    api.put(`/api/v1/staff/${id}`, data),
  delete: (id: string) => api.delete(`/api/v1/staff/${id}`),
};
