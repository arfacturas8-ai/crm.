import { useMemo } from 'react';
import { useAuthStore } from '@/store/auth-store';

interface WithAgentId {
  agentId?: string | number | null;
}

/**
 * Hook for filtering data based on user role and ownership
 * - Admins and Moderators: can see all data
 * - Agents: can only see data assigned to them (by agentId)
 */
export function useDataPrivacy<T extends WithAgentId>(data: T[]): T[] {
  const { user, isAdmin, isModerator } = useAuthStore();

  return useMemo(() => {
    // Admins and moderators see all data
    if (isAdmin() || isModerator()) {
      return data;
    }

    // Agents only see their own data
    if (!user?.id) {
      return [];
    }

    return data.filter((item): item is T => {
      // If no agentId on the item, show it (legacy data or unassigned)
      if (!item.agentId) {
        return true;
      }
      // Compare agentId with user ID (handle both string and number)
      return String(item.agentId) === String(user.id);
    });
  }, [data, user, isAdmin, isModerator]);
}

/**
 * Check if current user can view/edit a specific record
 */
export function useCanAccessRecord<T extends { agentId?: string | number | null }>(
  record: T | null
): boolean {
  const { user, isAdmin, isModerator } = useAuthStore();

  return useMemo(() => {
    if (!record) return false;

    // Admins and moderators can access all records
    if (isAdmin() || isModerator()) {
      return true;
    }

    // Agents can only access their own records
    if (!user?.id) {
      return false;
    }

    // If no agentId, allow access (legacy/unassigned)
    if (!record.agentId) {
      return true;
    }

    return String(record.agentId) === String(user.id);
  }, [record, user, isAdmin, isModerator]);
}

/**
 * Get the current user's agent ID for filtering
 */
export function useCurrentAgentId(): string | null {
  const { user, isAgent } = useAuthStore();

  return useMemo(() => {
    if (isAgent() && user?.id) {
      return String(user.id);
    }
    return null;
  }, [user, isAgent]);
}
