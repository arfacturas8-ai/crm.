'use client';

import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { Save, Home, MapPin, DollarSign, Bed, Bath, Car } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { UPDATE_LEAD } from '@/graphql/queries/leads';
import { useUIStore } from '@/store/ui-store';

interface ClientPreferencesProps {
  leadId: string;
  preferences?: ClientPreferencesData;
  onSave?: () => void;
}

interface ClientPreferencesData {
  propertyType?: string;
  transactionType?: string;
  minBudget?: number;
  maxBudget?: number;
  locations?: string[];
  bedrooms?: number;
  bathrooms?: number;
  parking?: number;
  amenities?: string[];
  notes?: string;
}

const PROPERTY_TYPES = [
  { value: '', label: 'Seleccionar...' },
  { value: 'house', label: 'Casa' },
  { value: 'apartment', label: 'Apartamento' },
  { value: 'condo', label: 'Condominio' },
  { value: 'land', label: 'Lote/Terreno' },
  { value: 'commercial', label: 'Comercial' },
  { value: 'farm', label: 'Finca' },
];

const TRANSACTION_TYPES = [
  { value: '', label: 'Seleccionar...' },
  { value: 'buy', label: 'Comprar' },
  { value: 'rent', label: 'Alquilar' },
  { value: 'both', label: 'Comprar o Alquilar' },
];

const COMMON_LOCATIONS = [
  'San Jose Centro',
  'Escazu',
  'Santa Ana',
  'Heredia',
  'Alajuela',
  'Cartago',
  'Guanacaste',
  'Puntarenas',
  'Limon',
];

const AMENITIES = [
  { id: 'pool', label: 'Piscina' },
  { id: 'gym', label: 'Gimnasio' },
  { id: 'security', label: 'Seguridad 24/7' },
  { id: 'garden', label: 'Jardin' },
  { id: 'terrace', label: 'Terraza' },
  { id: 'storage', label: 'Bodega' },
  { id: 'ac', label: 'Aire Acondicionado' },
  { id: 'furnished', label: 'Amueblado' },
];

export function ClientPreferences({ leadId, preferences, onSave }: ClientPreferencesProps) {
  const { addNotification } = useUIStore();
  const [formData, setFormData] = useState<ClientPreferencesData>({
    propertyType: preferences?.propertyType || '',
    transactionType: preferences?.transactionType || '',
    minBudget: preferences?.minBudget,
    maxBudget: preferences?.maxBudget,
    locations: preferences?.locations || [],
    bedrooms: preferences?.bedrooms,
    bathrooms: preferences?.bathrooms,
    parking: preferences?.parking,
    amenities: preferences?.amenities || [],
    notes: preferences?.notes || '',
  });

  const [updateLead, { loading }] = useMutation(UPDATE_LEAD, {
    refetchQueries: ['GetLead'],
    onCompleted: () => {
      addNotification({
        type: 'success',
        title: 'Preferencias guardadas',
        message: 'Las preferencias del cliente se han actualizado',
      });
      onSave?.();
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'No se pudieron guardar las preferencias',
      });
    },
  });

  const handleSave = () => {
    updateLead({
      variables: {
        input: {
          id: leadId,
          preferences: JSON.stringify(formData),
        },
      },
    });
  };

  const toggleLocation = (location: string) => {
    setFormData((prev) => ({
      ...prev,
      locations: prev.locations?.includes(location)
        ? prev.locations.filter((l) => l !== location)
        : [...(prev.locations || []), location],
    }));
  };

  const toggleAmenity = (amenityId: string) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities?.includes(amenityId)
        ? prev.amenities.filter((a) => a !== amenityId)
        : [...(prev.amenities || []), amenityId],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Property Type & Transaction */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Home size={16} className="inline mr-2 text-[#8B4513]" />
            Tipo de Propiedad
          </label>
          <Select
            options={PROPERTY_TYPES}
            value={formData.propertyType}
            onChange={(e) => setFormData((prev) => ({ ...prev, propertyType: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Transaccion
          </label>
          <Select
            options={TRANSACTION_TYPES}
            value={formData.transactionType}
            onChange={(e) => setFormData((prev) => ({ ...prev, transactionType: e.target.value }))}
          />
        </div>
      </div>

      {/* Budget */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <DollarSign size={16} className="inline mr-2 text-[#8B4513]" />
          Presupuesto
        </label>
        <div className="grid grid-cols-2 gap-4">
          <Input
            type="number"
            placeholder="Minimo"
            value={formData.minBudget || ''}
            onChange={(e) => setFormData((prev) => ({ ...prev, minBudget: e.target.value ? parseInt(e.target.value) : undefined }))}
          />
          <Input
            type="number"
            placeholder="Maximo"
            value={formData.maxBudget || ''}
            onChange={(e) => setFormData((prev) => ({ ...prev, maxBudget: e.target.value ? parseInt(e.target.value) : undefined }))}
          />
        </div>
      </div>

      {/* Locations */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <MapPin size={16} className="inline mr-2 text-[#8B4513]" />
          Ubicaciones de Interes
        </label>
        <div className="flex flex-wrap gap-2">
          {COMMON_LOCATIONS.map((location) => (
            <button
              key={location}
              type="button"
              onClick={() => toggleLocation(location)}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                formData.locations?.includes(location)
                  ? 'bg-[#8B4513] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {location}
            </button>
          ))}
        </div>
      </div>

      {/* Rooms */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Bed size={16} className="inline mr-2 text-[#8B4513]" />
            Habitaciones
          </label>
          <Input
            type="number"
            min="0"
            placeholder="Min"
            value={formData.bedrooms || ''}
            onChange={(e) => setFormData((prev) => ({ ...prev, bedrooms: e.target.value ? parseInt(e.target.value) : undefined }))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Bath size={16} className="inline mr-2 text-[#8B4513]" />
            Banos
          </label>
          <Input
            type="number"
            min="0"
            placeholder="Min"
            value={formData.bathrooms || ''}
            onChange={(e) => setFormData((prev) => ({ ...prev, bathrooms: e.target.value ? parseInt(e.target.value) : undefined }))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Car size={16} className="inline mr-2 text-[#8B4513]" />
            Parqueos
          </label>
          <Input
            type="number"
            min="0"
            placeholder="Min"
            value={formData.parking || ''}
            onChange={(e) => setFormData((prev) => ({ ...prev, parking: e.target.value ? parseInt(e.target.value) : undefined }))}
          />
        </div>
      </div>

      {/* Amenities */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Amenidades Deseadas
        </label>
        <div className="flex flex-wrap gap-2">
          {AMENITIES.map((amenity) => (
            <button
              key={amenity.id}
              type="button"
              onClick={() => toggleAmenity(amenity.id)}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                formData.amenities?.includes(amenity.id)
                  ? 'bg-[#8B4513] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {amenity.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notas Adicionales
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
          placeholder="Cualquier preferencia o requisito especial..."
          rows={3}
          className="w-full p-3 border border-[#e0ccb0] rounded-lg focus:ring-2 focus:ring-[#8B4513] focus:border-transparent resize-none"
        />
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} isLoading={loading} leftIcon={<Save size={16} />}>
          Guardar Preferencias
        </Button>
      </div>
    </div>
  );
}
