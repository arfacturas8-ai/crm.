'use client';

import { useQuery } from '@apollo/client';
import {
  User,
  MapPin,
  Home,
  DollarSign,
  Bed,
  Bath,
  Calendar,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { GET_ENQUIRY } from '@/graphql/queries/enquiries';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { formatDate, formatRelativeTime, formatCurrency } from '@/lib/utils';
import type { Enquiry } from '@/types';

interface EnquiryDetailProps {
  enquiry: Enquiry;
}

export function EnquiryDetail({ enquiry }: EnquiryDetailProps) {
  // Fetch full enquiry details with matched properties
  const { data, loading } = useQuery(GET_ENQUIRY, {
    variables: { id: enquiry.id },
  });

  const fullEnquiry = data?.enquiry || enquiry;
  const lead = fullEnquiry?.lead;
  const matchedProperties = fullEnquiry?.matchedProperties || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
            <User size={28} className="text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">{fullEnquiry.leadName}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant={
                  fullEnquiry.status === 'active'
                    ? 'primary'
                    : fullEnquiry.status === 'matched'
                    ? 'success'
                    : 'secondary'
                }
              >
                {fullEnquiry.status === 'active'
                  ? 'Activa'
                  : fullEnquiry.status === 'matched'
                  ? 'Matched'
                  : 'Cerrada'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Search Criteria */}
      <Card className="p-4">
        <h3 className="font-medium text-sm text-muted-foreground mb-4">
          Criterios de Búsqueda
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fullEnquiry.searchCriteria.propertyType && (
            <div className="flex items-center gap-2">
              <Home size={16} className="text-muted-foreground" />
              <span className="capitalize">{fullEnquiry.searchCriteria.propertyType}</span>
            </div>
          )}

          {fullEnquiry.searchCriteria.location && (
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-muted-foreground" />
              <span>{fullEnquiry.searchCriteria.location}</span>
            </div>
          )}

          {(fullEnquiry.searchCriteria.minPrice || fullEnquiry.searchCriteria.maxPrice) && (
            <div className="flex items-center gap-2">
              <DollarSign size={16} className="text-muted-foreground" />
              <span>
                {fullEnquiry.searchCriteria.minPrice
                  ? formatCurrency(fullEnquiry.searchCriteria.minPrice)
                  : '$0'}
                {' - '}
                {fullEnquiry.searchCriteria.maxPrice
                  ? formatCurrency(fullEnquiry.searchCriteria.maxPrice)
                  : 'Sin límite'}
              </span>
            </div>
          )}

          {fullEnquiry.searchCriteria.bedrooms && (
            <div className="flex items-center gap-2">
              <Bed size={16} className="text-muted-foreground" />
              <span>{fullEnquiry.searchCriteria.bedrooms}+ habitaciones</span>
            </div>
          )}

          {fullEnquiry.searchCriteria.bathrooms && (
            <div className="flex items-center gap-2">
              <Bath size={16} className="text-muted-foreground" />
              <span>{fullEnquiry.searchCriteria.bathrooms}+ baños</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-muted-foreground" />
            <span>Creada: {formatDate(fullEnquiry.createdAt)}</span>
          </div>
        </div>
      </Card>

      {/* Notes */}
      {fullEnquiry.notes && (
        <Card className="p-4">
          <h3 className="font-medium text-sm text-muted-foreground mb-2">
            Notas
          </h3>
          <p className="text-sm whitespace-pre-wrap">{fullEnquiry.notes}</p>
        </Card>
      )}

      {/* Matched Properties */}
      <Card className="p-4">
        <h3 className="font-medium text-sm text-muted-foreground mb-4">
          Propiedades que coinciden ({matchedProperties.length})
        </h3>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse bg-gray-100 rounded-lg h-32" />
            ))}
          </div>
        ) : matchedProperties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matchedProperties.map((property: any) => (
              <div
                key={property.id}
                className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                {property.image && (
                  <img
                    src={property.image}
                    alt={property.title}
                    className="w-full h-32 object-cover"
                  />
                )}
                <div className="p-3">
                  <p className="font-medium truncate">{property.title}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin size={12} />
                    {property.location}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-semibold text-primary">
                      {formatCurrency(property.price)}
                    </span>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {property.bedrooms && (
                        <span className="flex items-center gap-1">
                          <Bed size={12} />
                          {property.bedrooms}
                        </span>
                      )}
                      {property.bathrooms && (
                        <span className="flex items-center gap-1">
                          <Bath size={12} />
                          {property.bathrooms}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-3"
                    rightIcon={<ExternalLink size={12} />}
                  >
                    Ver propiedad
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Home className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No hay propiedades que coincidan</p>
            <p className="text-sm mt-1">
              Las propiedades coincidentes aparecerán aquí automáticamente
            </p>
          </div>
        )}
      </Card>

      {/* Contact Info (if lead data available) */}
      {lead && (
        <Card className="p-4">
          <h3 className="font-medium text-sm text-muted-foreground mb-3">
            Información del Lead
          </h3>
          <div className="space-y-2">
            <p>
              <span className="text-muted-foreground">Nombre:</span> {lead.name}
            </p>
            {lead.email && (
              <p>
                <span className="text-muted-foreground">Email:</span> {lead.email}
              </p>
            )}
            {lead.mobile && (
              <p>
                <span className="text-muted-foreground">Teléfono:</span> {lead.mobile}
              </p>
            )}
            {lead.source && (
              <p>
                <span className="text-muted-foreground">Fuente:</span>{' '}
                <span className="capitalize">{lead.source}</span>
              </p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
