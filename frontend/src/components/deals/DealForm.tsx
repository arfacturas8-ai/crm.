'use client';

import { useState, useEffect, useMemo } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CREATE_DEAL, UPDATE_DEAL } from '@/graphql/queries/deals';
import { GET_LEADS } from '@/graphql/queries/leads';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { PropertySelector } from '@/components/ui/PropertySelector';
import { useUIStore } from '@/store/ui-store';
import { usePipelineStore, mapLegacyStage } from '@/store/pipeline-store';
import { type Deal } from '@/types';

// Schema matching server: title, leadId, stage, value, propertyId
const dealSchema = z.object({
  title: z.string().min(1, 'Titulo requerido'),
  leadId: z.string().optional(),
  stage: z.string().min(1, 'Etapa requerida'),
  value: z.string().optional(),
});

type DealFormData = z.infer<typeof dealSchema>;

interface DealFormProps {
  deal?: Deal;
  leadId?: string;
  onSuccess: () => void;
}

export function DealForm({ deal, leadId, onSuccess }: DealFormProps) {
  const { addNotification } = useUIStore();
  const { stages } = usePipelineStore();
  const isEditing = !!deal;
  const [selectedProperty, setSelectedProperty] = useState<any>(null);

  // Get stage options from pipeline store
  const stageOptions = useMemo(() => {
    return [...stages]
      .sort((a, b) => a.order - b.order)
      .map((stage) => ({
        value: stage.id,
        label: stage.label,
      }));
  }, [stages]);

  // Fetch leads for dropdown
  const { data: leadsData } = useQuery(GET_LEADS, {
    variables: { first: 100 },
  });

  const leads = leadsData?.leads?.nodes || [];
  const leadOptions = [
    { value: '', label: 'Sin lead asociado' },
    ...leads.map((lead: any) => ({
      value: lead.id,
      label: `${lead.name} - ${lead.mobile || lead.email}`,
    })),
  ];

  // Get default stage (first non-terminal stage)
  const getDefaultStage = (): string => {
    const mappedStage = deal?.stage ? mapLegacyStage(deal.stage) : null;
    if (mappedStage && stages.some((s) => s.id === mappedStage)) {
      return mappedStage;
    }
    const firstActiveStage = stages.find((s) => !s.isTerminal);
    return firstActiveStage?.id || 'new';
  };

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<DealFormData>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      title: deal?.title || '',
      leadId: deal?.leadId?.toString() || leadId || '',
      stage: getDefaultStage(),
      value: deal?.value?.toString() || '',
    },
  });

  // Auto-fill title when property is selected
  useEffect(() => {
    if (selectedProperty && !isEditing) {
      setValue('title', selectedProperty.title);
      // Also set value from property price if available
      if (selectedProperty.propertyPrice) {
        setValue('value', selectedProperty.propertyPrice.toString());
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

  const loading = createLoading || updateLoading;

  const onSubmit = async (data: DealFormData) => {
    if (isEditing) {
      updateDeal({
        variables: {
          input: {
            id: deal.id,
            title: data.title,
            stage: data.stage,
            value: data.value ? parseFloat(data.value) : undefined,
            propertyId: selectedProperty ? parseInt(selectedProperty.databaseId, 10) : undefined,
          },
        },
      });
    } else {
      createDeal({
        variables: {
          input: {
            title: data.title,
            leadId: data.leadId ? parseInt(data.leadId, 10) : undefined,
            stage: data.stage,
            value: data.value ? parseFloat(data.value) : undefined,
            propertyId: selectedProperty ? parseInt(selectedProperty.databaseId, 10) : undefined,
          },
        },
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Property Selector - Most important */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Propiedad *
        </label>
        <PropertySelector
          selectedProperty={selectedProperty}
          onSelect={setSelectedProperty}
        />
        <p className="text-xs text-gray-500 mt-1">
          Selecciona la propiedad para este deal
        </p>
      </div>

      {/* Title */}
      <Input
        label="Título del Deal *"
        placeholder="Ej: Compra casa en Grecia..."
        error={errors.title?.message}
        {...register('title')}
      />

      {/* Lead Selection - Optional */}
      <Select
        label="Lead asociado (opcional)"
        options={leadOptions}
        placeholder="Seleccionar lead..."
        error={errors.leadId?.message}
        {...register('leadId')}
      />

      {/* Stage and Value */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Etapa *"
          options={stageOptions}
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
