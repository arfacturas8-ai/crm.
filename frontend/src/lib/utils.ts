import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Merge Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format phone number for WhatsApp (Costa Rica)
export function formatWhatsAppNumber(phone: string): string {
  // Remove all non-numeric characters
  const cleanNumber = phone.replace(/[^0-9]/g, '');

  // Add Costa Rica country code if not present
  if (!cleanNumber.startsWith('506')) {
    return '506' + cleanNumber;
  }

  return cleanNumber;
}

// Generate WhatsApp link
export function getWhatsAppLink(phone: string, message?: string): string {
  const formattedNumber = formatWhatsAppNumber(phone);
  const baseUrl = `https://wa.me/${formattedNumber}`;

  if (message) {
    return `${baseUrl}?text=${encodeURIComponent(message)}`;
  }

  return baseUrl;
}

// Format date for display
export function formatDate(date: string | Date, locale: string = 'es-CR'): string {
  const d = new Date(date);
  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Format date with time
export function formatDateTime(date: string | Date, locale: string = 'es-CR'): string {
  const d = new Date(date);
  return d.toLocaleString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Format relative time (e.g., "hace 2 horas")
export function formatRelativeTime(date: string | Date, locale: string = 'es-CR'): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) {
    return 'hace unos segundos';
  } else if (diffMins < 60) {
    return `hace ${diffMins} ${diffMins === 1 ? 'minuto' : 'minutos'}`;
  } else if (diffHours < 24) {
    return `hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
  } else if (diffDays < 7) {
    return `hace ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`;
  } else {
    return formatDate(d, locale);
  }
}

// Format currency (Costa Rican Colones)
export function formatCurrency(amount: number, currency: string = 'CRC'): string {
  return new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format phone number for display
export function formatPhoneDisplay(phone: string): string {
  const cleanNumber = phone.replace(/[^0-9]/g, '');

  if (cleanNumber.length === 8) {
    // Costa Rica format: XXXX-XXXX
    return `${cleanNumber.slice(0, 4)}-${cleanNumber.slice(4)}`;
  } else if (cleanNumber.length === 11 && cleanNumber.startsWith('506')) {
    // With country code: +506 XXXX-XXXX
    return `+506 ${cleanNumber.slice(3, 7)}-${cleanNumber.slice(7)}`;
  }

  return phone;
}

// Truncate text
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

// Get initials from name
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Debounce function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Check if user has permission based on role
export function hasPermission(
  userRole: 'admin' | 'moderator' | 'agent',
  requiredRoles: ('admin' | 'moderator' | 'agent')[]
): boolean {
  return requiredRoles.includes(userRole);
}

// Role hierarchy for permission checks
export const ROLE_HIERARCHY = {
  admin: 3,
  moderator: 2,
  agent: 1,
} as const;

// Check if user has at least the required role level
export function hasMinimumRole(
  userRole: 'admin' | 'moderator' | 'agent',
  minimumRole: 'admin' | 'moderator' | 'agent'
): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minimumRole];
}
