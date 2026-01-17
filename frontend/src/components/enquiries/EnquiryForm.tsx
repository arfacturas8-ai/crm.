'use client';

import { useMutation, useQuery } from '@apollo/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CREATE_ENQUIRY, UPDATE_ENQUIRY } from '@/graphql/queries/enquiries';
import { GET_LEADS } from '@/graphql/queries/leads';
import { Input, Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useUIStore } from '@/store/ui-store';
import type { Enquiry } from '@/types';

const enquirySchema = z.object({
  leadId: z.string().min(1, 'Lead requerido'),
  propertyType: z.string().optional(),
  location: z.string().optional(),
  minPrice: z.number().min(0).optional().or(z.literal('')),
  maxPrice: z.number().min(0).optional().or(z.literal('')),
  bedrooms: z.number().min(0).optional().or(z.literal('')),
  bathrooms: z.number().min(0).optional().or(z.literal('')),
  notes: z.string().optional(),
  status: z.enum(['active', 'matched', 'closed']).optional(),
});

type EnquiryFormData = z.infer<typeof enquirySchema>;

interface EnquiryFormProps {
  enquiry?: Enquiry;
  leadId?: string;
  onSuccess: () => void;
}

const PROPERTY_TYPE_OPTIONS = [
  { value: '', label: 'Cualquier tipo' },
  { value: 'casa', label: 'Casa' },
  { value: 'apartamento', label: 'Apartamento' },
  { value: 'terreno', label: 'Terreno' },
  { value: 'local', label: 'Local comercial' },
  { value: 'oficina', label: 'Oficina' },
  { value: 'bodega', label: 'Bodega' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Activa' },
  { value: 'matched', label: 'Matched' },
  { value: 'closed', label: 'Cerrada' },
];

export function EnquiryForm({ enquiry, leadId, onSuccess }: EnquiryFormProps) {
  const { addNotification } = useUIStore();
  const isEditing = !!enquiry;

  // Fetch leads for dropdown
  const { data: leadsData } = useQuery(GET_LEADS, {
    variables: { first: 100 },
  });

  const leads = leadsData?.leads?.nodes || [];
  const leadOptions = [
    { value: '', label: 'Seleccionar lead...' },
    ...leads.map((lead: any) => ({
      value: lead.id,
      label: `${lead.name} - ${lead.mobile || lead.email}`,
    })),
  ];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EnquiryFormData>({
    resolver: zodResolver(enquirySchema),
    defaultValues: {
      leadId: enquiry?.leadId || leadId || '',
      propertyType: enquiry?.searchCriteria.propertyType || '',
      location: enquiry?.searchCriteria.location || '',
      minPrice: enquiry?.searchCriteria.minPrice || '',
      maxPrice: enquiry?.searchCriteria.maxPrice || '',
      bedrooms: enquiry?.searchCriteria.bedrooms || '',
      bathrooms: enquiry?.searchCriteria.bathrooms || '',
      notes: enquiry?.notes || '',
      status: enquiry?.status || 'active',
    },
  });

  const [createEnquiry, { loading: createLoading }] = useMutation(CREATE_ENQUIRY, {
    onCompleted: () => {
      addNotification({
        type: 'success',
        title: 'Búsqueda creada',
        message: 'La búsqueda se ha creado correctamente',
      });
      onSuccess();
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'No se pudo crear la búsqueda',
      });
    },
  });

  const [updateEnquiry, { loading: updateLoading }] = useMutation(UPDATE_ENQUIRY, {
    onCompleted: () => {
      addNotification({
        type: 'success',
        title: 'Búsqueda actualizada',
        message: 'La búsqueda se ha actualizado correctamente',
      });
      onSuccess();
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'No se pudo actualizar la búsqueda',
      });
    },
  });

  const loading = createLoading || updateLoading;

  const onSubmit = (data: EnquiryFormData) => {
    const input = {
      leadId: data.leadId,
      searchCriteria: {
        propertyType: data.propertyType || undefined,
        location: data.location || undefined,
        minPrice: data.minPrice ? Number(data.minPrice) : undefined,
        maxPrice: data.maxPrice ? Number(data.maxPrice) : undefined,
        bedrooms: data.bedrooms ? Number(data.bedrooms) : undefined,
        bathrooms: data.bathrooms ? Number(data.bathrooms) : undefined,
      },
      notes: data.notes || undefined,
      status: data.status,
    };

    if (isEditing) {
      updateEnquiry({
        variables: { id: enquiry.id, input },
      });
    } else {
      createEnquiry({
        variables: { input },
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Lead Selection */}
      <Select
        label="Lead *"
        options={leadOptions}
        error={errors.leadId?.message}
        {...register('leadId')}
      />

      {/* Property Type & Location */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Tipo de propiedad"
          options={PROPERTY_TYPE_OPTIONS}
          error={errors.propertyType?.message}
          {...register('propertyType')}
        />

        <Input
          label="Ubicación"
          placeholder="Zona, ciudad o provincia..."
          error={errors.location?.message}
          {...register('location')}
        />
      </div>

      {/* Price Range */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Precio mínimo"
          type="number"
          placeholder="0"
          error={errors.minPrice?.message}
          {...register('minPrice', { valueAsNumber: true })}
        />

        <Input
          label="Precio máximo"
          type="number"
          placeholder="Sin límite"
          error={errors.maxPrice?.message}
          {...register('maxPrice', { valueAsNumber: true })}
        />
      </div>

      {/* Bedrooms & Bathrooms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Habitaciones mínimas"
          type="number"
          placeholder="0"
          min="0"
          error={errors.bedrooms?.message}
          {...register('bedrooms', { valueAsNumber: true })}
        />

        <Input
          label="Baños mínimos"
          type="number"
          placeholder="0"
          min="0"
          error={errors.bathrooms?.message}
          {...register('bathrooms', { valueAsNumber: true })}
        />
      </div>

      {/* Status (only when editing) */}
      {isEditing && (
        <Select
          label="Estado"
          options={STATUS_OPTIONS}
          error={errors.status?.message}
          {...register('status')}
        />
      )}

      {/* Notes */}
      <Textarea
        label="Notas adicionales"
        placeholder="Requisitos específicos, preferencias, etc..."
        rows={4}
        error={errors.notes?.message}
        {...register('notes')}
      />

      {/* Submit */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="submit" isLoading={loading}>
          {isEditing ? 'Actualizar' : 'Crear Búsqueda'}
        </Button>
      </div>
    </form>
  );
}
