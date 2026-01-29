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

// Schema matching server: leadName, leadMobile, estado, propiedad, etc.
const dealSchema = z.object({
  leadName: z.string().min(1, 'Nombre requerido'),
  leadMobile: z.string().min(1, 'Teléfono requerido'),
  leadEmail: z.string().email().optional().or(z.literal('')),
  estado: z.string().min(1, 'Etapa requerida'),
  busca: z.string().optional(),
  calificacion: z.string().optional(),
  proximoPaso: z.string().optional(),
  detalles: z.string().optional(),
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
  const [selectedLeadId, setSelectedLeadId] = useState<string>(leadId || '');

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
    { value: '', label: 'Escribir manualmente' },
    ...leads.map((lead: any) => ({
      value: lead.id,
      label: `${lead.name} - ${lead.mobile || lead.email}`,
    })),
  ];

  // Get default stage (first non-terminal stage)
  const getDefaultStage = (): string => {
    const mappedStage = deal?.estado ? mapLegacyStage(deal.estado) : null;
    if (mappedStage && stages.some((s) => s.id === mappedStage)) {
      return mappedStage;
    }
    const firstActiveStage = stages.find((s) => !s.isTerminal);
    return firstActiveStage?.id || 'nuevo';
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DealFormData>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      leadName: deal?.leadName || '',
      leadMobile: deal?.leadMobile || '',
      leadEmail: deal?.leadEmail || '',
      estado: getDefaultStage(),
      busca: deal?.busca || '',
      calificacion: deal?.calificacion || '',
      proximoPaso: deal?.proximoPaso || '',
      detalles: deal?.detalles || '',
    },
  });

  // Watch form values for display
  const watchedName = watch('leadName');
  const watchedMobile = watch('leadMobile');

  // Auto-fill lead info when a lead is selected
  useEffect(() => {
    if (selectedLeadId && leads.length > 0) {
      const lead = leads.find((l: any) => l.id === selectedLeadId);
      if (lead) {
        setValue('leadName', lead.name || '');
        setValue('leadMobile', lead.mobile || '');
        setValue('leadEmail', lead.email || '');
      }
    }
  }, [selectedLeadId, leads, setValue]);

  // Auto-fill from leadId prop on mount
  useEffect(() => {
    if (leadId && leads.length > 0) {
      setSelectedLeadId(leadId);
    }
  }, [leadId, leads]);

  // Auto-fill busca (what they're looking for) when property is selected
  useEffect(() => {
    if (selectedProperty && !isEditing) {
      // Set busca to property title/type
      setValue('busca', selectedProperty.title || '');
    }
  }, [selectedProperty, setValue, isEditing]);

  // Initialize property from deal's propiedad field
  useEffect(() => {
    if (deal?.propiedad && !selectedProperty) {
      // propiedad is stored as property title, so we display it
      setValue('busca', deal.propiedad);
    }
  }, [deal, setValue, selectedProperty]);

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
    // Build propiedad from selected property title
    const propiedadValue = selectedProperty?.title || data.busca || undefined;
    const propertyIdValue = selectedProperty?.databaseId || undefined;

    if (isEditing) {
      updateDeal({
        variables: {
          input: {
            id: deal.id,
            estado: data.estado,
            busca: data.busca || undefined,
            calificacion: data.calificacion || undefined,
            proximoPaso: data.proximoPaso || undefined,
            propiedad: propiedadValue,
            propertyId: propertyIdValue,
            detalles: data.detalles || undefined,
          },
        },
      });
    } else {
      createDeal({
        variables: {
          input: {
            leadName: data.leadName,
            leadMobile: data.leadMobile,
            leadEmail: data.leadEmail || undefined,
            estado: data.estado,
            busca: data.busca || undefined,
            calificacion: data.calificacion || undefined,
            proximoPaso: data.proximoPaso || undefined,
            propiedad: propiedadValue,
            propertyId: propertyIdValue,
            detalles: data.detalles || undefined,
          },
        },
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Property Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Propiedad
        </label>
        <PropertySelector
          selectedProperty={selectedProperty}
          onSelect={setSelectedProperty}
        />
        <p className="text-xs text-gray-500 mt-1">
          Selecciona la propiedad para este deal
        </p>
        {selectedProperty && (
          <p className="text-sm text-[#8B4513] mt-2">
            Propiedad vinculada: {selectedProperty.title}
          </p>
        )}
      </div>

      {/* Lead Info - Required for new deals */}
      {!isEditing && (
        <>
          {/* Lead Selector - Auto-fills contact info */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seleccionar Lead Existente
            </label>
            <select
              value={selectedLeadId}
              onChange={(e) => setSelectedLeadId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B4513] focus:border-transparent"
            >
              {leadOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Selecciona un lead para auto-rellenar los datos
            </p>
          </div>

          {/* Show selected lead info or manual input */}
          {selectedLeadId && watchedName ? (
            <div className="p-4 bg-[#faf5f0] rounded-lg border border-[#e0ccb0]">
              <p className="font-medium text-[#8B4513]">Lead seleccionado:</p>
              <p className="text-black text-lg">{watchedName}</p>
              <p className="text-gray-600">{watchedMobile}</p>
            </div>
          ) : null}

          <Input
            label="Nombre del cliente *"
            placeholder="Ej: Juan Pérez"
            error={errors.leadName?.message}
            {...register('leadName')}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Teléfono *"
              placeholder="Ej: +506 8888-8888"
              error={errors.leadMobile?.message}
              {...register('leadMobile')}
            />

            <Input
              label="Email"
              type="email"
              placeholder="correo@ejemplo.com"
              error={errors.leadEmail?.message}
              {...register('leadEmail')}
            />
          </div>
        </>
      )}

      {/* Stage */}
      <Select
        label="Etapa *"
        options={stageOptions}
        error={errors.estado?.message}
        {...register('estado')}
      />

      {/* What they're looking for */}
      <Input
        label="¿Qué busca?"
        placeholder="Ej: Casa de playa, Apartamento en ciudad..."
        error={errors.busca?.message}
        {...register('busca')}
      />

      {/* Qualification and Next Step */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Calificación"
          options={[
            { value: '', label: 'Sin calificar' },
            { value: 'caliente', label: 'Caliente' },
            { value: 'tibio', label: 'Tibio' },
            { value: 'frio', label: 'Frío' },
          ]}
          error={errors.calificacion?.message}
          {...register('calificacion')}
        />

        <Input
          label="Próximo paso"
          placeholder="Ej: Agendar visita, Enviar cotización..."
          error={errors.proximoPaso?.message}
          {...register('proximoPaso')}
        />
      </div>

      {/* Details */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Detalles
        </label>
        <textarea
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B4513] focus:border-transparent"
          rows={3}
          placeholder="Notas adicionales sobre este deal..."
          {...register('detalles')}
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
