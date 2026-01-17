'use client';

import { useMutation, useQuery } from '@apollo/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CREATE_DEAL, UPDATE_DEAL } from '@/graphql/queries/deals';
import { GET_LEADS } from '@/graphql/queries/leads';
import { Input, Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useUIStore } from '@/store/ui-store';
import {
  DEAL_BUSCA_LABELS,
  DEAL_ESTADO_LABELS,
  DEAL_CALIFICACION_LABELS,
  DEAL_PROXIMO_PASO_LABELS,
  type Deal,
} from '@/types';

const dealSchema = z.object({
  leadId: z.string().min(1, 'Lead requerido'),
  busca: z.enum(['comprar', 'alquilar', 'vender']),
  propiedad: z.string().optional(),
  estado: z.enum(['contactado', 'no_contactado']),
  detalles: z.string().optional(),
  fecha1: z.string().optional(),
  fecha2: z.string().optional(),
  seguimiento: z.enum(['una', 'dos', 'tres']).optional(),
  visitaConfirmada: z.string().optional(),
  calificacion: z.enum(['potencial', 'mas_seguimiento', 'no_potencial']).optional(),
  proximoPaso: z.enum(['mas_opciones', 'opcion_compra', 'financiamiento', 'compro', 'alquilo']).optional(),
  group: z.enum(['active', 'won', 'lost']).optional(),
});

type DealFormData = z.infer<typeof dealSchema>;

interface DealFormProps {
  deal?: Deal;
  leadId?: string;
  onSuccess: () => void;
}

const BUSCA_OPTIONS = Object.entries(DEAL_BUSCA_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const ESTADO_OPTIONS = Object.entries(DEAL_ESTADO_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const SEGUIMIENTO_OPTIONS = [
  { value: 'una', label: 'Una vez' },
  { value: 'dos', label: 'Dos veces' },
  { value: 'tres', label: 'Tres veces' },
];

const CALIFICACION_OPTIONS = Object.entries(DEAL_CALIFICACION_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const PROXIMO_PASO_OPTIONS = Object.entries(DEAL_PROXIMO_PASO_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const GROUP_OPTIONS = [
  { value: 'active', label: 'Amarillo: Dar seguimiento' },
  { value: 'won', label: 'Verde: Cliente potencial' },
  { value: 'lost', label: 'Rojo: Descartado' },
];

export function DealForm({ deal, leadId, onSuccess }: DealFormProps) {
  const { addNotification } = useUIStore();
  const isEditing = !!deal;

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
    formState: { errors },
  } = useForm<DealFormData>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      leadId: deal?.leadId || leadId || '',
      busca: deal?.busca || 'comprar',
      propiedad: deal?.propiedad || '',
      estado: deal?.estado || 'no_contactado',
      detalles: deal?.detalles || '',
      fecha1: deal?.fecha1 || '',
      fecha2: deal?.fecha2 || '',
      seguimiento: deal?.seguimiento,
      visitaConfirmada: deal?.visitaConfirmada || '',
      calificacion: deal?.calificacion,
      proximoPaso: deal?.proximoPaso,
      group: deal?.group || 'active',
    },
  });

  const [createDeal, { loading: createLoading }] = useMutation(CREATE_DEAL, {
    onCompleted: () => {
      addNotification({
        type: 'success',
        title: 'Deal creado',
        message: 'El deal se ha creado correctamente',
      });
      onSuccess();
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
    onCompleted: () => {
      addNotification({
        type: 'success',
        title: 'Deal actualizado',
        message: 'El deal se ha actualizado correctamente',
      });
      onSuccess();
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

  const onSubmit = (data: DealFormData) => {
    if (isEditing) {
      updateDeal({
        variables: {
          id: deal.id,
          input: data,
        },
      });
    } else {
      createDeal({
        variables: {
          input: data,
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

      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="¿Qué busca? *"
          options={BUSCA_OPTIONS}
          error={errors.busca?.message}
          {...register('busca')}
        />

        <Input
          label="Propiedad de interés"
          placeholder="Descripción de la propiedad..."
          error={errors.propiedad?.message}
          {...register('propiedad')}
        />

        <Select
          label="Estado *"
          options={ESTADO_OPTIONS}
          error={errors.estado?.message}
          {...register('estado')}
        />

        {isEditing && (
          <Select
            label="Grupo"
            options={GROUP_OPTIONS}
            error={errors.group?.message}
            {...register('group')}
          />
        )}
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          label="Fecha 1"
          type="date"
          error={errors.fecha1?.message}
          {...register('fecha1')}
        />

        <Input
          label="Fecha 2"
          type="date"
          error={errors.fecha2?.message}
          {...register('fecha2')}
        />

        <Input
          label="Visita confirmada"
          type="date"
          error={errors.visitaConfirmada?.message}
          {...register('visitaConfirmada')}
        />
      </div>

      {/* Follow-up & Qualification */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Select
          label="Seguimiento"
          options={[{ value: '', label: 'Seleccionar...' }, ...SEGUIMIENTO_OPTIONS]}
          error={errors.seguimiento?.message}
          {...register('seguimiento')}
        />

        <Select
          label="Calificación"
          options={[{ value: '', label: 'Seleccionar...' }, ...CALIFICACION_OPTIONS]}
          error={errors.calificacion?.message}
          {...register('calificacion')}
        />

        <Select
          label="Próximo paso"
          options={[{ value: '', label: 'Seleccionar...' }, ...PROXIMO_PASO_OPTIONS]}
          error={errors.proximoPaso?.message}
          {...register('proximoPaso')}
        />
      </div>

      {/* Details */}
      <Textarea
        label="Detalles adicionales"
        placeholder="Notas sobre el deal..."
        rows={4}
        error={errors.detalles?.message}
        {...register('detalles')}
      />

      {/* Submit */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="submit" isLoading={loading}>
          {isEditing ? 'Actualizar' : 'Crear Deal'}
        </Button>
      </div>
    </form>
  );
}
