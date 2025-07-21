import React from 'react';
import { Copy, MessageCircle, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { useOrders } from '@/hooks/useOrders';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { OrderFormData } from '@/types';

interface CreateOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
}

export function CreateOrderDialog({ open, onOpenChange, businessId }: CreateOrderDialogProps) {
  const { createOrderFromForm } = useOrders(businessId);
  
  const [formData, setFormData] = React.useState<OrderFormData>({
    clientName: '',
    clientPhone: '',
    deliveryDate: new Date().toISOString().split('T')[0],
    deliveryTime: '',
    notes: '',
    items: [
      { productName: '', quantity: 1, unitPrice: 0, notes: '' }
    ]
  });

  const [lastReceipt, setLastReceipt] = React.useState<string>('');

  const total = formData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

  const generateWhatsAppReceipt = (orderData: OrderFormData) => {
    const itemsList = orderData.items
      .map((item) => `• ${item.quantity}x ${item.productName} - $${(item.quantity * item.unitPrice).toFixed(2)}`)
      .join('\n');

    const receipt = `🧾 *PEDIDO CONFIRMADO*
    
Cliente: ${orderData.clientName}
${orderData.clientPhone ? `Teléfono: ${orderData.clientPhone}` : ''}

📅 Entrega: ${new Date(orderData.deliveryDate).toLocaleDateString('es-MX', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
})}

📦 *Productos:*
${itemsList}

💰 *TOTAL: $${total.toFixed(2)}*

${orderData.notes ? `\n📝 Notas: ${orderData.notes}` : ''}

✅ Gracias por su preferencia
_${new Date().toLocaleString('es-MX')}_`;

    return receipt;
  };

  const handleCopyReceipt = () => {
    if (lastReceipt) {
      navigator.clipboard.writeText(lastReceipt);
      toast.success('Recibo copiado al portapapeles');
    }
  };

  const handleShareWhatsApp = () => {
    if (lastReceipt && formData.clientPhone) {
      const cleanPhone = formData.clientPhone.replace(/\D/g, '');
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(lastReceipt)}`;
      window.open(whatsappUrl, '_blank');
    } else {
      toast.error('Se requiere número de teléfono para compartir por WhatsApp');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.clientName.trim()) {
      toast.error('El nombre del cliente es requerido');
      return;
    }

    const validItems = formData.items.filter(item => 
      item.productName.trim() && item.quantity > 0 && item.unitPrice > 0
    );

    if (validItems.length === 0) {
      toast.error('Agrega al menos un producto');
      return;
    }

    try {
      // ✅ ACTUALIZADO: Usar createOrderFromForm con tipos unificados
      await createOrderFromForm.mutateAsync({
        ...formData,
        items: validItems
      });
      
      // Generate receipt after successful order creation
      const receipt = generateWhatsAppReceipt(formData);
      setLastReceipt(receipt);
      
      // Show success with receipt options
      toast.success('Pedido creado exitosamente', {
        action: {
          label: 'Ver recibo',
          onClick: () => {
            // You could open a modal here to show the receipt
            console.log('Receipt:', receipt);
          }
        }
      });
      
      onOpenChange(false);
      
      // Reset form
      setFormData({
        clientName: '',
        clientPhone: '',
        deliveryDate: new Date().toISOString().split('T')[0],
        deliveryTime: '',
        notes: '',
        items: [{ productName: '', quantity: 1, unitPrice: 0, notes: '' }]
      });
    } catch (error) {
      console.error('Error creating order:', error);
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productName: '', quantity: 1, unitPrice: 0, notes: '' }]
    });
  };

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData({
        ...formData,
        items: formData.items.filter((_, i) => i !== index)
      });
    }
  };

  const updateItem = (index: number, field: keyof OrderFormData['items'][0], value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const updateFormData = (field: keyof OrderFormData, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Pedido</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Cliente */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="clientName">Nombre del Cliente *</Label>
                <Input
                  id="clientName"
                  value={formData.clientName}
                  onChange={(e) => updateFormData('clientName', e.target.value)}
                  placeholder="Nombre completo"
                  required
                />
              </div>
              <div>
                <Label htmlFor="clientPhone">Teléfono</Label>
                <Input
                  id="clientPhone"
                  type="tel"
                  value={formData.clientPhone}
                  onChange={(e) => updateFormData('clientPhone', e.target.value)}
                  placeholder="123-456-7890"
                />
              </div>
            </div>

            {/* Fecha */}
            <div>
              <Label htmlFor="deliveryDate">Fecha de Entrega *</Label>
              <Input
                id="deliveryDate"
                type="date"
                value={formData.deliveryDate}
                onChange={(e) => updateFormData('deliveryDate', e.target.value)}
                required
              />
            </div>

            {/* Hora */}
            <div>
              <Label htmlFor="deliveryTime">Hora de Entrega</Label>
              <Input
                id="deliveryTime"
                type="time"
                value={formData.deliveryTime}
                onChange={(e) => updateFormData('deliveryTime', e.target.value)}
              />
            </div>

            {/* Notas */}
            <div>
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => updateFormData('notes', e.target.value)}
                placeholder="Instrucciones especiales..."
                rows={3}
              />
            </div>

            {/* Productos */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Productos *</Label>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Producto
                </Button>
              </div>

              {formData.items.map((item, index) => (
                <Card key={index} className="p-4">
                  <div className="grid grid-cols-12 gap-3 items-end">
                    <div className="col-span-5">
                      <Label>Producto *</Label>
                      <Input
                        value={item.productName}
                        onChange={(e) => updateItem(index, 'productName', e.target.value)}
                        placeholder="Nombre del producto"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Cantidad *</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                        required
                      />
                    </div>
                    <div className="col-span-3">
                      <Label>Precio Unitario *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <div className="col-span-1">
                      <Label>Subtotal</Label>
                      <div className="text-sm font-medium">
                        ${(item.quantity * item.unitPrice).toFixed(2)}
                      </div>
                    </div>
                    <div className="col-span-1">
                      {formData.items.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeItem(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Total */}
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-2xl font-bold">${total.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Botones */}
            <div className="flex gap-3">
              <Button type="submit" className="flex-1">
                Crear Pedido
              </Button>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Receipt Actions Dialog */}
      {lastReceipt && (
        <Dialog open={!!lastReceipt} onOpenChange={() => setLastReceipt('')}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Recibo Generado</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="text-sm whitespace-pre-wrap font-mono">
                  {lastReceipt}
                </pre>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  onClick={handleCopyReceipt}
                  variant="outline"
                  className="flex-1"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar
                </Button>
                <Button
                  onClick={handleShareWhatsApp}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  WhatsApp
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
} 