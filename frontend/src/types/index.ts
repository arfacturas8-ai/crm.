// User Roles
export type UserRole = 'admin' | 'moderator' | 'agent';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

// Lead Types
export type LeadSource =
  | 'whatsapp'
  | 'website'
  | 'facebook'
  | 'instagram'
  | 'marketplace'
  | 'google'
  | 'direct'
  | 'sign';

export interface Lead {
  id: string;
  name: string;
  email: string;
  mobile: string;
  source: LeadSource;
  message?: string;
  propertyId?: string;
  propertyTitle?: string;
  agentId?: string;
  agentName?: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  createdAt: string;
  updatedAt: string;
}

// Deal Types
export type DealGroup = 'active' | 'won' | 'lost';
export type DealBusca = 'comprar' | 'alquilar' | 'vender';
export type DealEstado = 'contactado' | 'no_contactado';
export type DealSeguimiento = 'una' | 'dos' | 'tres';
export type DealCalificacion = 'potencial' | 'mas_seguimiento' | 'no_potencial';
export type DealProximoPaso = 'mas_opciones' | 'opcion_compra' | 'financiamiento' | 'compro' | 'alquilo';

export interface Deal {
  id: string;
  leadId: string;
  leadName: string;
  leadEmail: string;
  leadMobile: string;
  group: DealGroup;
  busca: DealBusca;
  propiedad?: string;
  estado: DealEstado;
  detalles?: string;
  fecha1?: string;
  fecha2?: string;
  seguimiento?: DealSeguimiento;
  visitaConfirmada?: string;
  calificacion?: DealCalificacion;
  proximoPaso?: DealProximoPaso;
  agentId?: string;
  agentName?: string;
  createdAt: string;
  updatedAt: string;
}

// Enquiry Types
export interface Enquiry {
  id: string;
  leadId: string;
  leadName: string;
  searchCriteria: {
    propertyType?: string;
    location?: string;
    minPrice?: number;
    maxPrice?: number;
    bedrooms?: number;
    bathrooms?: number;
  };
  notes?: string;
  status: 'active' | 'matched' | 'closed';
  createdAt: string;
  updatedAt: string;
}

// Note Types
export interface Note {
  id: string;
  entityType: 'lead' | 'deal' | 'enquiry';
  entityId: string;
  content: string;
  userId: string;
  userName: string;
  createdAt: string;
}

// Activity Types
export type ActivityType =
  | 'call'
  | 'email'
  | 'whatsapp'
  | 'meeting'
  | 'visit'
  | 'note'
  | 'status_change';

export interface Activity {
  id: string;
  entityType: 'lead' | 'deal' | 'enquiry';
  entityId: string;
  type: ActivityType;
  description: string;
  userId: string;
  userName: string;
  createdAt: string;
}

// Message Types (WhatsApp/Email)
export interface Message {
  id: string;
  type: 'whatsapp' | 'email';
  to: string;
  from?: string;
  subject?: string;
  body: string;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  leadId?: string;
  sentAt?: string;
  createdAt: string;
}

// Dashboard Stats
export interface DashboardStats {
  totalLeads: number;
  newLeadsToday: number;
  activeDeals: number;
  wonDeals: number;
  lostDeals: number;
  pendingEnquiries: number;
  leadsBySource: Record<LeadSource, number>;
  dealsByGroup: Record<DealGroup, number>;
}

// Pagination
export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationInfo;
}

// API Response
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Lead Source Labels (Spanish)
export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  whatsapp: 'WhatsApp',
  website: 'Sitio web',
  facebook: 'Facebook',
  instagram: 'Instagram',
  marketplace: 'Market Place',
  google: 'Google',
  direct: 'Directo',
  sign: 'Rótulo',
};

// Deal Group Labels (Spanish)
export const DEAL_GROUP_LABELS: Record<DealGroup, string> = {
  active: 'Amarillo: Dar seguimiento',
  won: 'Verde: Cliente potencial',
  lost: 'Rojo: Descartado',
};

// Deal Busca Labels (Spanish)
export const DEAL_BUSCA_LABELS: Record<DealBusca, string> = {
  comprar: 'Comprar',
  alquilar: 'Alquilar',
  vender: 'Vender',
};

// Deal Estado Labels (Spanish)
export const DEAL_ESTADO_LABELS: Record<DealEstado, string> = {
  contactado: 'Contactado',
  no_contactado: 'No contactado',
};

// Deal Calificacion Labels (Spanish)
export const DEAL_CALIFICACION_LABELS: Record<DealCalificacion, string> = {
  potencial: 'Potencial',
  mas_seguimiento: 'Más seguimiento',
  no_potencial: 'No potencial',
};

// Deal Proximo Paso Labels (Spanish)
export const DEAL_PROXIMO_PASO_LABELS: Record<DealProximoPaso, string> = {
  mas_opciones: 'Más opciones',
  opcion_compra: 'Opción de compra',
  financiamiento: 'Financiamiento',
  compro: 'Compró',
  alquilo: 'Alquiló',
};
