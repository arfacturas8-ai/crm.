'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CREATE_DEAL, UPDATE_DEAL } from '@/graphql/queries/deals';
import { GET_LEADS, UPDATE_LEAD } from '@/graphql/queries/leads';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { PropertySelector } from '@/components/ui/PropertySelector';
import { useUIStore } from '@/store/ui-store';
import { type Deal } from '@/types';

// Schema matching server: title, leadId, stage, value
const dealSchema = z.object({
  title: z.string().min(1, 'Título requerido'),
  leadId: z.string().min(1, 'Lead requerido'),
  stage: z.enum(['active', 'won', 'lost']),
  value: z.string().optional(),
});

type DealFormData = z.infer<typeof dealSchema>;

interface DealFormProps {
  deal?: Deal;
  leadId?: string;
  onSuccess: () => void;
}

const STAGE_OPTIONS = [
  { value: 'active', label: 'Activo' },
  { value: 'won', label: 'Ganado' },
  { value: 'lost', label: 'Perdido' },
];

export function DealForm({ deal, leadId, onSuccess }: DealFormProps) {
  const { addNotification } = useUIStore();
  const isEditing = !!deal;
  const [selectedProperty, setSelectedProperty] = useState<any>(null);

  // Fetch leads for dropdown
  const { data: leadsData } = useQuery(GET_LEADS, {
    variables: { first: 100 },
  });

  const leads = leadsData?.leads?.nodes || [];
  const leadOptions = leads.map((lead: any) => ({
    value: lead.id,
    label: `${lead.name} - ${lead.mobile || lead.email}`,
  }));

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DealFormData>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      title: deal?.title || '',
      leadId: deal?.leadId?.toString() || leadId || '',
      stage: deal?.stage || 'active',
      value: deal?.value?.toString() || '',
    },
  });

  const selectedLeadId = watch('leadId');

  // Auto-fill title when property is selected
  useEffect(() => {
    if (selectedProperty && !isEditing) {
      setValue('title', selectedProperty.title);
      // Also set value from property price if available
      if (selectedProperty.propertyPrice) {
        setValue('value', selectedProperty.propertyPrice);
      }
    }
  }, [selectedProperty, setValue, isEditing]);

  const [createDeal, { loading: createLoading }] = useMutation(CREATE_DEAL, {
    refetchQueries: ['GetDeals', 'GetDealsByStage', 'GetDashboardStats'],
    awaitRefetchQueries: true,
    onCompleted: (data) => {
      if (data?.createDeal?.deal) {
        addNotification({
          type: 'success',
          title: 'Deal creado',
          message: 'El deal se ha creado correctamente',
        });
        onSuccess();
      } else {
        addNotification({
          type: 'error',
          title: 'Error',
          message: 'No se pudo crear el deal',
        });
      }
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'No se pudo crear el deal',
      });
    },
  });

  const [updateDeal, { loading: updateLoading }] = useMutation(UPDATE_DEAL, {
    refetchQueries: ['GetDeals', 'GetDeal', 'GetDealsByStage', 'GetDashboardStats'],
    awaitRefetchQueries: true,
    onCompleted: (data) => {
      if (data?.updateDeal?.deal) {
        addNotification({
          type: 'success',
          title: 'Deal actualizado',
          message: 'El deal se ha actualizado correctamente',
        });
        onSuccess();
      } else {
        addNotification({
          type: 'error',
          title: 'Error',
          message: 'No se pudo actualizar el deal',
        });
      }
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'No se pudo actualizar el deal',
      });
    },
  });

  // Update lead's propertyId when a property is selected
  const [updateLead] = useMutation(UPDATE_LEAD);

  const loading = createLoading || updateLoading;

  const onSubmit = async (data: DealFormData) => {
    // If property is selected, update the lead's propertyId
    if (selectedProperty && data.leadId) {
      try {
        await updateLead({
          variables: {
            input: {
              id: data.leadId,
              propertyId: selectedProperty.databaseId?.toString(),
            },
          },
        });
      } catch (err) {
        console.error('Error updating lead property:', err);
      }
    }

    if (isEditing) {
      updateDeal({
        variables: {
          input: {
            id: deal.id,
            title: data.title,
            stage: data.stage,
            value: data.value ? parseFloat(data.value) : undefined,
          },
        },
      });
    } else {
      createDeal({
        variables: {
          input: {
            title: data.title,
            leadId: parseInt(data.leadId),
            stage: data.stage,
            value: data.value ? parseFloat(data.value) : undefined,
          },
        },
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Lead Selection */}
      <Select
        label="Lead *"
        options={leadOptions}
        placeholder="Seleccionar lead..."
        error={errors.leadId?.message}
        {...register('leadId')}
      />

      {/* Property Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Vincular Propiedad
        </label>
        <PropertySelector
          selectedProperty={selectedProperty}
          onSelect={setSelectedProperty}
        />
      </div>

      {/* Title */}
      <Input
        label="Título del Deal *"
        placeholder="Ej: Compra casa en Grecia..."
        error={errors.title?.message}
        {...register('title')}
      />

      {/* Stage and Value */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Etapa *"
          options={STAGE_OPTIONS}
          error={errors.stage?.message}
          {...register('stage')}
        />

        <Input
          label="Valor"
          type="number"
          placeholder="0"
          error={errors.value?.message}
          {...register('value')}
        />
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="submit" isLoading={loading}>
          {isEditing ? 'Actualizar' : 'Crear Deal'}
        </Button>
      </div>
    </form>
  );
}
