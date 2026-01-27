'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@apollo/client';
import {
  Home,
  Search,
  Building2,
  CheckCircle,
  XCircle,
  DollarSign,
  Bed,
  Bath,
  Maximize,
  MapPin,
  Eye,
  Phone,
  Mail,
} from 'lucide-react';
import { gql } from '@apollo/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { useUIStore } from '@/store/ui-store';
import { cn, formatCurrency, debounce } from '@/lib/utils';

const GET_ALL_PROPERTIES = gql`
  query GetAllProperties($first: Int) {
    properties(first: $first) {
      nodes {
        id
        databaseId
        title
        status
        propertyStatus
        propertyType
        propertyCity
        propertyArea
        propertyMeta {
          price
          bedrooms
          bathrooms
          propertySize
          address
          agent
        }
        featuredImage {
          node {
            sourceUrl(size: MEDIUM)
          }
        }
      }
    }
  }
`;

interface Property {
  id: string;
  databaseId: number;
  title: string;
  status: string;
  propertyStatus?: string;
  propertyType?: string;
  propertyCity?: string;
  propertyArea?: string;
  propertyMeta?: {
    price?: number;
    bedrooms?: number;
    bathrooms?: number;
    propertySize?: number;
    address?: string;
    agent?: number | string;
  };
  featuredImage?: { node: { sourceUrl: string } };
}

type TabType = 'disponible' | 'no-disponible';

export default function PropietarioPage() {
  const [activeTab, setActiveTab] = useState<TabType>('disponible');
  const [search, setSearch] = useState('');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  const { openModal } = useUIStore();

  const { data, loading } = useQuery(GET_ALL_PROPERTIES, {
    variables: { first: 200 },
    fetchPolicy: 'cache-and-network',
  });

  const allProperties: Property[] = data?.properties?.nodes || [];

  // Filter properties based on availability status
  const filteredProperties = useMemo(() => {
    let properties = allProperties;

    // Filter by tab (disponible = publish/for-sale/for-rent, no-disponible = sold/rented/draft)
    if (activeTab === 'disponible') {
      properties = properties.filter(p => {
        const status = p.propertyStatus?.toLowerCase() || '';
        const postStatus = p.status?.toLowerCase() || '';
        return postStatus === 'publish' && !['vendido', 'sold', 'alquilado', 'rented'].includes(status);
      });
    } else {
      properties = properties.filter(p => {
        const status = p.propertyStatus?.toLowerCase() || '';
        const postStatus = p.status?.toLowerCase() || '';
        return postStatus !== 'publish' || ['vendido', 'sold', 'alquilado', 'rented'].includes(status);
      });
    }

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      properties = properties.filter(p => {
        const titleMatch = p.title?.toLowerCase().includes(searchLower);
        const addressMatch = p.propertyMeta?.address?.toLowerCase().includes(searchLower);
        const cityMatch = p.propertyCity?.toLowerCase().includes(searchLower);
        const areaMatch = p.propertyArea?.toLowerCase().includes(searchLower);
        const typeMatch = p.propertyType?.toLowerCase().includes(searchLower);
        const priceMatch = p.propertyMeta?.price?.toString().includes(search);
        return titleMatch || addressMatch || cityMatch || areaMatch || typeMatch || priceMatch;
      });
    }

    return properties;
  }, [allProperties, activeTab, search]);

  const handleSearch = debounce((value: string) => {
    setSearch(value);
  }, 300);

  const handleViewProperty = (property: Property) => {
    setSelectedProperty(property);
    openModal('view-property');
  };

  const disponibleCount = allProperties.filter(p => {
    const status = p.propertyStatus?.toLowerCase() || '';
    const postStatus = p.status?.toLowerCase() || '';
    return postStatus === 'publish' && !['vendido', 'sold', 'alquilado', 'rented'].includes(status);
  }).length;

  const noDisponibleCount = allProperties.length - disponibleCount;

  return (
    <div className="space-y-4 lg:space-y-6 bg-white min-h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Propietario</h1>
          <p className="text-sm text-gray-500">Gestión de propiedades</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('disponible')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'disponible'
              ? 'text-green-600 border-green-600'
              : 'text-gray-500 border-transparent hover:text-gray-700'
          )}
        >
          <span className="flex items-center gap-2">
            <CheckCircle size={16} />
            Disponible
            <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
              {disponibleCount}
            </span>
          </span>
        </button>
        <button
          onClick={() => setActiveTab('no-disponible')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'no-disponible'
              ? 'text-gray-600 border-gray-600'
              : 'text-gray-500 border-transparent hover:text-gray-700'
          )}
        >
          <span className="flex items-center gap-2">
            <XCircle size={16} />
            No Disponible
            <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
              {noDisponibleCount}
            </span>
          </span>
        </button>
      </div>

      {/* Search */}
      <Card className="p-3 lg:p-4 bg-white border-gray-200">
        <Input
          placeholder="Buscar por título, dirección, ciudad, tipo, precio..."
          leftIcon={<Search size={16} />}
          onChange={(e) => handleSearch(e.target.value)}
          className="bg-white border-gray-200 text-sm"
        />
      </Card>

      {/* Properties Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="bg-white border-gray-200 overflow-hidden">
              <div className="animate-pulse">
                <div className="h-48 bg-gray-100" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : filteredProperties.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProperties.map((property) => (
            <Card
              key={property.id}
              className="bg-white border-gray-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleViewProperty(property)}
            >
              {/* Image */}
              <div className="relative h-48 bg-gray-100">
                {property.featuredImage?.node?.sourceUrl ? (
                  <img
                    src={property.featuredImage.node.sourceUrl}
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Building2 size={48} className="text-gray-300" />
                  </div>
                )}
                {/* Status badge */}
                <div className={cn(
                  'absolute top-2 right-2 px-2 py-1 text-xs font-medium rounded',
                  activeTab === 'disponible'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-500 text-white'
                )}>
                  {property.propertyStatus || (activeTab === 'disponible' ? 'Disponible' : 'No disponible')}
                </div>
                {/* Type badge */}
                {property.propertyType && (
                  <div className="absolute top-2 left-2 px-2 py-1 text-xs font-medium bg-white/90 text-gray-700 rounded">
                    {property.propertyType}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 truncate">{property.title}</h3>

                {(property.propertyCity || property.propertyArea) && (
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                    <MapPin size={12} />
                    {[property.propertyArea, property.propertyCity].filter(Boolean).join(', ')}
                  </p>
                )}

                {/* Price */}
                {property.propertyMeta?.price && (
                  <p className="text-lg font-bold text-[#8B4513] mt-2 flex items-center gap-1">
                    <DollarSign size={18} />
                    {formatCurrency(property.propertyMeta.price)}
                  </p>
                )}

                {/* Features */}
                <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                  {property.propertyMeta?.bedrooms && (
                    <span className="flex items-center gap-1">
                      <Bed size={14} />
                      {property.propertyMeta.bedrooms}
                    </span>
                  )}
                  {property.propertyMeta?.bathrooms && (
                    <span className="flex items-center gap-1">
                      <Bath size={14} />
                      {property.propertyMeta.bathrooms}
                    </span>
                  )}
                  {property.propertyMeta?.propertySize && (
                    <span className="flex items-center gap-1">
                      <Maximize size={14} />
                      {property.propertyMeta.propertySize} m²
                    </span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center bg-white border-gray-200">
          <Home className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">No se encontraron propiedades</p>
        </Card>
      )}

      {/* Property Detail Modal */}
      <Modal id="view-property" title="Detalles de Propiedad" size="lg">
        {selectedProperty && (
          <div className="space-y-4">
            {/* Image */}
            {selectedProperty.featuredImage?.node?.sourceUrl && (
              <img
                src={selectedProperty.featuredImage.node.sourceUrl}
                alt={selectedProperty.title}
                className="w-full h-64 object-cover rounded-lg"
              />
            )}

            {/* Title & Price */}
            <div>
              <h2 className="text-xl font-bold text-gray-900">{selectedProperty.title}</h2>
              {selectedProperty.propertyMeta?.price && (
                <p className="text-2xl font-bold text-[#8B4513] mt-1">
                  ${formatCurrency(selectedProperty.propertyMeta.price)}
                </p>
              )}
            </div>

            {/* Location */}
            {selectedProperty.propertyMeta?.address && (
              <div className="flex items-start gap-2 text-gray-600">
                <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                <p>{selectedProperty.propertyMeta.address}</p>
              </div>
            )}

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              {selectedProperty.propertyMeta?.bedrooms && (
                <div className="text-center">
                  <Bed size={24} className="mx-auto text-gray-400 mb-1" />
                  <p className="font-semibold text-gray-900">{selectedProperty.propertyMeta.bedrooms}</p>
                  <p className="text-xs text-gray-500">Habitaciones</p>
                </div>
              )}
              {selectedProperty.propertyMeta?.bathrooms && (
                <div className="text-center">
                  <Bath size={24} className="mx-auto text-gray-400 mb-1" />
                  <p className="font-semibold text-gray-900">{selectedProperty.propertyMeta.bathrooms}</p>
                  <p className="text-xs text-gray-500">Baños</p>
                </div>
              )}
              {selectedProperty.propertyMeta?.propertySize && (
                <div className="text-center">
                  <Maximize size={24} className="mx-auto text-gray-400 mb-1" />
                  <p className="font-semibold text-gray-900">{selectedProperty.propertyMeta.propertySize} m²</p>
                  <p className="text-xs text-gray-500">Área</p>
                </div>
              )}
            </div>

            {/* Status */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Estado:</span>
              <span className={cn(
                'px-2 py-1 text-xs font-medium rounded',
                selectedProperty.status === 'publish'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600'
              )}>
                {selectedProperty.propertyStatus || selectedProperty.status}
              </span>
            </div>

            {/* ID */}
            <p className="text-xs text-gray-400">ID: {selectedProperty.databaseId}</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
