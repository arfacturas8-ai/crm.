'use client';

import { useState } from 'react';
import { useQuery } from '@apollo/client';
import {
  Phone,
  Users,
  MapPin,
  CheckSquare,
  Mail,
  MessageSquare,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { GET_LEADS } from '@/graphql/queries/leads';
import { GET_DEALS } from '@/graphql/queries/deals';
import {
  useActivitiesStore,
  ACTIVITY_TYPE_LABELS,
  ACTIVITY_PRIORITY_LABELS,
  type ActivityType,
  type ActivityPriority,
  type Activity,
} from '@/store/activities-store';
import { useUIStore } from '@/store/ui-store';
import { cn } from '@/lib/utils';

interface ActivityFormProps {
  activity?: Activity;
  leadId?: string;
  leadName?: string;
  dealId?: string;
  dealTitle?: string;
  onSuccess?: () => void;
}

const ACTIVITY_TYPE_ICONS: Record<ActivityType, any> = {
  call: Phone,
  meeting: Users,
  visit: MapPin,
  task: CheckSquare,
  email: Mail,
  whatsapp: MessageSquare,
  follow_up: Clock,
};

export function ActivityForm({
  activity,
  leadId,
  leadName,
  dealId,
  dealTitle,
  onSuccess,
}: ActivityFormProps) {
  const { addActivity, updateActivity } = useActivitiesStore();
  const { addNotification, closeModal } = useUIStore();
  const isEditing = !!activity;

  const [formData, setFormData] = useState({
    type: activity?.type || ('task' as ActivityType),
    title: activity?.title || '',
    description: activity?.description || '',
    priority: activity?.priority || ('medium' as ActivityPriority),
    dueDate: activity?.dueDate || '',
    dueTime: activity?.dueTime || '',
    leadId: activity?.leadId || leadId || '',
    leadName: activity?.leadName || leadName || '',
    dealId: activity?.dealId || dealId || '',
    dealTitle: activity?.dealTitle || dealTitle || '',
  });

  // Fetch leads for dropdown
  const { data: leadsData } = useQuery(GET_LEADS, {
    variables: { first: 100 },
  });

  // Fetch deals for dropdown
  const { data: dealsData } = useQuery(GET_DEALS, {
    variables: { first: 100 },
  });

  const leads = leadsData?.leads?.nodes || [];
  const deals = dealsData?.deals?.nodes || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'El titulo es requerido',
      });
      return;
    }

    const selectedLead = leads.find((l: any) => l.id === formData.leadId);
    const selectedDeal = deals.find((d: any) => d.id === formData.dealId);

    if (isEditing && activity) {
      updateActivity(activity.id, {
        ...formData,
        leadName: selectedLead?.name || formData.leadName,
        dealTitle: selectedDeal?.title || formData.dealTitle,
      });
      addNotification({
        type: 'success',
        title: 'Actividad actualizada',
        message: 'La actividad se ha actualizado correctamente',
      });
    } else {
      addActivity({
        ...formData,
        leadName: selectedLead?.name || formData.leadName,
        dealTitle: selectedDeal?.title || formData.dealTitle,
        status: 'pending',
      });
      addNotification({
        type: 'success',
        title: 'Actividad creada',
        message: 'La actividad se ha creado correctamente',
      });
    }

    closeModal();
    onSuccess?.();
  };

  const activityTypes = Object.entries(ACTIVITY_TYPE_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  const priorityOptions = Object.entries(ACTIVITY_PRIORITY_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  const leadOptions = [
    { value: '', label: 'Sin lead asociado' },
    ...leads.map((lead: any) => ({
      value: lead.id,
      label: lead.name,
    })),
  ];

  const dealOptions = [
    { value: '', label: 'Sin deal asociado' },
    ...deals.map((deal: any) => ({
      value: deal.id,
      label: deal.title,
    })),
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Activity Type Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Tipo de Actividad
        </label>
        <div className="grid grid-cols-4 gap-2">
          {Object.entries(ACTIVITY_TYPE_ICONS).map(([type, Icon]) => (
            <button
              key={type}
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, type: type as ActivityType }))}
              className={cn(
                'flex flex-col items-center gap-2 p-3 border rounded-lg transition-all',
                formData.type === type
                  ? 'border-[#8B4513] bg-[#8B4513]/10 text-[#8B4513]'
                  : 'border-gray-200 hover:border-[#cca87a] text-gray-600'
              )}
            >
              <Icon size={20} />
              <span className="text-xs font-medium">
                {ACTIVITY_TYPE_LABELS[type as ActivityType]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <Input
        label="Titulo *"
        placeholder="Ej: Llamar para seguimiento..."
        value={formData.title}
        onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
      />

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Descripcion
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Detalles adicionales..."
          rows={3}
          className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#8B4513] focus:border-transparent resize-none"
        />
      </div>

      {/* Date, Time, Priority */}
      <div className="grid grid-cols-3 gap-4">
        <Input
          label="Fecha"
          type="date"
          value={formData.dueDate}
          onChange={(e) => setFormData((prev) => ({ ...prev, dueDate: e.target.value }))}
        />
        <Input
          label="Hora"
          type="time"
          value={formData.dueTime}
          onChange={(e) => setFormData((prev) => ({ ...prev, dueTime: e.target.value }))}
        />
        <Select
          label="Prioridad"
          options={priorityOptions}
          value={formData.priority}
          onChange={(e) => setFormData((prev) => ({ ...prev, priority: e.target.value as ActivityPriority }))}
        />
      </div>

      {/* Lead and Deal */}
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Lead relacionado"
          options={leadOptions}
          value={formData.leadId}
          onChange={(e) => setFormData((prev) => ({ ...prev, leadId: e.target.value }))}
        />
        <Select
          label="Deal relacionado"
          options={dealOptions}
          value={formData.dealId}
          onChange={(e) => setFormData((prev) => ({ ...prev, dealId: e.target.value }))}
        />
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={() => closeModal()}>
          Cancelar
        </Button>
        <Button type="submit">
          {isEditing ? 'Actualizar' : 'Crear Actividad'}
        </Button>
      </div>
    </form>
  );
}
