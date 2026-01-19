'use client';

import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import {
  Search,
  Home,
  MapPin,
  Bed,
  Bath,
  X,
  Check,
  Loader2,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

// Query to get properties from WordPress/Houzez
const GET_PROPERTIES = gql`
  query GetProperties($search: String, $first: Int) {
    properties(first: $first, where: { search: $search }) {
      nodes {
        id
        databaseId
        title
        uri
        featuredImage {
          node {
            sourceUrl
          }
        }
        propertyPrice
        propertyBedrooms
        propertyBathrooms
        propertyAddress
        formattedPrice
        propertyCities {
          nodes {
            name
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
  uri: string;
  featuredImage?: {
    node?: {
      sourceUrl?: string;
    };
  };
  propertyPrice?: string;
  propertyBedrooms?: string;
  propertyBathrooms?: string;
  propertyAddress?: string;
  formattedPrice?: string;
  propertyCities?: {
    nodes?: { name: string }[];
  };
}

interface PropertySelectorProps {
  selectedProperty?: Property | null;
  onSelect: (property: Property | null) => void;
  onClose?: () => void;
}

export function PropertySelector({ selectedProperty, onSelect, onClose }: PropertySelectorProps) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const { data, loading } = useQuery(GET_PROPERTIES, {
    variables: { search: search || null, first: 20 },
    skip: !isOpen,
  });

  const properties: Property[] = data?.properties?.nodes || [];

  const handleSelect = (property: Property) => {
    onSelect(property);
    setIsOpen(false);
    setSearch('');
  };

  const handleClear = () => {
    onSelect(null);
  };

  const getCity = (property: Property) => {
    return property.propertyCities?.nodes?.[0]?.name || null;
  };

  // If a property is selected, show it
  if (selectedProperty && !isOpen) {
    return (
      <div className="border border-[#e0ccb0] rounded-lg p-4 bg-[#faf5f0]">
        <div className="flex items-start gap-4">
          {selectedProperty.featuredImage?.node?.sourceUrl ? (
            <img
              src={selectedProperty.featuredImage.node.sourceUrl}
              alt={selectedProperty.title}
              className="w-20 h-20 object-cover rounded-lg"
            />
          ) : (
            <div className="w-20 h-20 bg-[#e0ccb0] rounded-lg flex items-center justify-center">
              <Home size={24} className="text-[#8B4513]" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-black truncate">{selectedProperty.title}</p>
            {selectedProperty.propertyAddress && (
              <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                <MapPin size={12} />
                {selectedProperty.propertyAddress}
              </p>
            )}
            <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
              {selectedProperty.propertyBedrooms && (
                <span className="flex items-center gap-1">
                  <Bed size={12} />
                  {selectedProperty.propertyBedrooms}
                </span>
              )}
              {selectedProperty.propertyBathrooms && (
                <span className="flex items-center gap-1">
                  <Bath size={12} />
                  {selectedProperty.propertyBathrooms}
                </span>
              )}
              {selectedProperty.formattedPrice && (
                <span className="font-medium text-[#8B4513]">
                  {selectedProperty.formattedPrice}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsOpen(true)}
              className="p-2 text-[#8B4513] hover:bg-[#e0ccb0] rounded-lg transition-colors"
              title="Cambiar propiedad"
            >
              <Search size={18} />
            </button>
            <button
              onClick={handleClear}
              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Quitar propiedad"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B4513]" size={18} />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Buscar propiedad por nombre o dirección..."
          className="w-full pl-10 pr-4 py-3 border border-[#e0ccb0] rounded-lg focus:ring-2 focus:ring-[#8B4513] focus:border-transparent"
        />
        {isOpen && (
          <button
            onClick={() => {
              setIsOpen(false);
              setSearch('');
              onClose?.();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-[#e0ccb0] rounded-lg shadow-lg max-h-80 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#8B4513]" />
              <p className="text-sm text-gray-500 mt-2">Buscando propiedades...</p>
            </div>
          ) : properties.length > 0 ? (
            <div className="py-2">
              {properties.map((property) => (
                <button
                  key={property.id}
                  onClick={() => handleSelect(property)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[#faf5f0] transition-colors text-left"
                >
                  {property.featuredImage?.node?.sourceUrl ? (
                    <img
                      src={property.featuredImage.node.sourceUrl}
                      alt={property.title}
                      className="w-16 h-12 object-cover rounded"
                    />
                  ) : (
                    <div className="w-16 h-12 bg-[#e0ccb0] rounded flex items-center justify-center">
                      <Home size={20} className="text-[#8B4513]" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-black truncate">{property.title}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                      {getCity(property) && (
                        <span className="flex items-center gap-1">
                          <MapPin size={10} />
                          {getCity(property)}
                        </span>
                      )}
                      {property.propertyBedrooms && (
                        <span className="flex items-center gap-1">
                          <Bed size={10} />
                          {property.propertyBedrooms}
                        </span>
                      )}
                      {property.formattedPrice && (
                        <span className="text-[#8B4513] font-medium">
                          {property.formattedPrice}
                        </span>
                      )}
                    </div>
                  </div>
                  <Check size={18} className="text-[#8B4513] opacity-0 group-hover:opacity-100" />
                </button>
              ))}
            </div>
          ) : search ? (
            <div className="p-4 text-center">
              <Home className="w-10 h-10 mx-auto text-[#cca87a] mb-2" />
              <p className="text-sm text-gray-500">No se encontraron propiedades</p>
              <p className="text-xs text-gray-400 mt-1">Intenta con otro término de búsqueda</p>
            </div>
          ) : (
            <div className="p-4 text-center">
              <Home className="w-10 h-10 mx-auto text-[#cca87a] mb-2" />
              <p className="text-sm text-gray-500">Escribe para buscar propiedades</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
