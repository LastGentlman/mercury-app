import { Calendar, DollarSign, FileText, Mail, MapPin, Phone, ShoppingBag, User } from 'lucide-react';
import { Card } from './ui/card.tsx';
import { Badge } from './ui/badge.tsx';
import { Button } from './ui/button.tsx';
import type { Client } from '../types/index.ts';

interface ClientCardProps {
  client: Client;
  onEdit: () => void;
  onDelete: () => void;
}

export function ClientCard({ client, onEdit, onDelete }: ClientCardProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{client.name}</h3>
            <p className="text-sm text-gray-500">
              Cliente desde {formatDate(client.created_at)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="flex items-center gap-1"
          >
            Editar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            Eliminar
          </Button>
        </div>
      </div>

      {/* Contact Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {client.email && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mail className="w-4 h-4 text-gray-400" />
            <span>{client.email}</span>
          </div>
        )}
        {client.phone && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Phone className="w-4 h-4 text-gray-400" />
            <span>{client.phone}</span>
          </div>
        )}
        {client.address && (
          <div className="flex items-center gap-2 text-sm text-gray-600 md:col-span-2">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span>{client.address}</span>
          </div>
        )}
      </div>

      {/* Notes */}
      {client.notes && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Notas</span>
          </div>
          <p className="text-sm text-gray-600">{client.notes}</p>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <ShoppingBag className="w-4 h-4 text-green-600" />
            <span className="text-lg font-bold text-gray-900">{client.total_orders}</span>
          </div>
          <p className="text-xs text-gray-500">Pedidos</p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <DollarSign className="w-4 h-4 text-green-600" />
            <span className="text-lg font-bold text-gray-900">
              {formatCurrency(client.total_spent)}
            </span>
          </div>
          <p className="text-xs text-gray-500">Total Gastado</p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-lg font-bold text-gray-900">
              {formatDate(client.last_order_date)}
            </span>
          </div>
          <p className="text-xs text-gray-500">Último Pedido</p>
        </div>
      </div>

      {/* Status Badge */}
      <div className="mt-4 flex justify-end">
        <Badge variant={client.is_active ? "default" : "secondary"}>
          {client.is_active ? "Activo" : "Inactivo"}
        </Badge>
      </div>
    </Card>
  );
} 