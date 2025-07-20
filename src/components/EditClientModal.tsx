import { useState, useEffect } from 'react';
import { FileText, Mail, MapPin, Phone, User } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import type { Client } from '@/types';

interface EditClientModalProps {
  client: Client;
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: Partial<Client> & { id: string }) => Promise<void>;
  isLoading?: boolean;
}

export function EditClientModal({ client, isOpen, onClose, onSave, isLoading = false }: EditClientModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update form data when client changes
  useEffect(() => {
    setFormData({
      name: client.name || '',
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
      notes: client.notes || ''
    });
    setErrors({});
  }, [client]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'El nombre debe tener al menos 2 caracteres';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (formData.phone && formData.phone.length > 20) {
      newErrors.phone = 'El teléfono debe tener máximo 20 caracteres';
    }

    if (formData.address && formData.address.length > 500) {
      newErrors.address = 'La dirección debe tener máximo 500 caracteres';
    }

    if (formData.notes && formData.notes.length > 1000) {
      newErrors.notes = 'Las notas deben tener máximo 1000 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSave({
        id: client.id,
        name: formData.name.trim(),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        address: formData.address.trim() || undefined,
        notes: formData.notes.trim() || undefined
      });
      
      onClose();
    } catch (error) {
      // Error handling is done in the parent component
      console.error('Error updating client:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Editar Cliente
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Nombre *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Nombre completo del cliente"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="cliente@ejemplo.com"
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Teléfono
            </Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="+52 123 456 7890"
              className={errors.phone ? 'border-red-500' : ''}
            />
            {errors.phone && (
              <p className="text-sm text-red-500">{errors.phone}</p>
            )}
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Dirección
            </Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Dirección completa del cliente"
              rows={2}
              className={errors.address ? 'border-red-500' : ''}
            />
            {errors.address && (
              <p className="text-sm text-red-500">{errors.address}</p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Notas
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Información adicional sobre el cliente"
              rows={3}
              className={errors.notes ? 'border-red-500' : ''}
            />
            {errors.notes && (
              <p className="text-sm text-red-500">{errors.notes}</p>
            )}
          </div>

          {/* Client Stats Preview */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Estadísticas del Cliente</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Total Pedidos</p>
                <p className="font-semibold">{client.total_orders}</p>
              </div>
              <div>
                <p className="text-gray-500">Total Gastado</p>
                <p className="font-semibold">
                  {new Intl.NumberFormat('es-MX', {
                    style: 'currency',
                    currency: 'MXN'
                  }).format(client.total_spent)}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Último Pedido</p>
                <p className="font-semibold">
                  {client.last_order_date 
                    ? new Date(client.last_order_date).toLocaleDateString('es-ES')
                    : 'Nunca'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.name.trim()}
              className="flex items-center gap-2"
            >
              {isLoading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 