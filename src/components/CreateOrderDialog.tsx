import React from 'react';
import { Copy, MessageCircle, Minus, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { useOrders } from '@/hooks/useOrders';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface CreateOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
}

export function CreateOrderDialog({ open, onOpenChange, businessId }: CreateOrderDialogProps) {
  const { createOrder } = useOrders(businessId);
  
  const [formData, setFormData] = React.useState({
    clientName: '',
    clientPhone: '',
    clientAddress: '',
    deliveryDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [items, setItems] = React.useState<Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
  }>>([
    { productName: '', quantity: 1, unitPrice: 0 }
  ]);

  const [lastReceipt, setLastReceipt] = React.useState<string>('');

  const total = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

  const generateWhatsAppReceipt = (orderData: any) => {
    const itemsList = orderData.items
      .map((item: any) => `• ${item.quantity}x ${item.productName} - $${(item.quantity * item.unitPrice).toFixed(2)}`)
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

    const validItems = items.filter(item => 
      item.productName.trim() && item.quantity > 0 && item.unitPrice > 0
    );

    if (validItems.length === 0) {
      toast.error('Agrega al menos un producto');
      return;
    }

    const orderData = {
      ...formData,
      items: validItems.map(item => ({
        productId: `product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.quantity * item.unitPrice,
      })),
    };

    try {
      await createOrder.mutateAsync(orderData);
      
      // Generate receipt after successful order creation
      const receipt = generateWhatsAppReceipt(orderData);
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
        clientAddress: '',
        deliveryDate: new Date().toISOString().split('T')[0],
        notes: '',
      });
      setItems([{ productName: '', quantity: 1, unitPrice: 0 }]);
    } catch (error) {
      console.error('Error creating order:', error);
    }
  };

  const addItem = () => {
    setItems([...items, { productName: '', quantity: 1, unitPrice: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
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
                  onChange={(e) => setFormData({...formData, clientName: e.target.value})}
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
                  onChange={(e) => setFormData({...formData, clientPhone: e.target.value})}
                  placeholder="123-456-7890"
                />
              </div>
            </div>

            {/* Dirección */}
            <div>
              <Label htmlFor="clientAddress">Dirección</Label>
              <Input
                id="clientAddress"
                value={formData.clientAddress}
                onChange={(e) => setFormData({...formData, clientAddress: e.target.value})}
                placeholder="Dirección de entrega"
              />
            </div>

            {/* Fecha */}
            <div>
              <Label htmlFor="deliveryDate">Fecha de Entrega *</Label>
              <Input
                id="deliveryDate"
                type="date"
                value={formData.deliveryDate}
                onChange={(e) => setFormData({...formData, deliveryDate: e.target.value})}
                required
              />
            </div>

            {/* Items */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <Label>Productos/Servicios</Label>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="w-4 h-4 mr-1" />
                  Agregar
                </Button>
              </div>
              
              <div className="space-y-3">
                {items.map((item, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-5">
                          <Label className="text-xs">Producto/Servicio</Label>
                          <Input
                            value={item.productName}
                            onChange={(e) => updateItem(index, 'productName', e.target.value)}
                            placeholder="Nombre del producto"
                            className="text-sm"
                          />
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs">Cantidad</Label>
                          <div className="flex items-center space-x-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => updateItem(index, 'quantity', Math.max(1, item.quantity - 1))}
                              className="w-8 h-8 p-0"
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                              className="text-center text-sm w-12"
                              min="1"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => updateItem(index, 'quantity', item.quantity + 1)}
                              className="w-8 h-8 p-0"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs">Precio Unit.</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                            className="text-sm"
                          />
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs">Subtotal</Label>
                          <div className="text-sm font-medium bg-gray-50 p-2 rounded">
                            ${(item.quantity * item.unitPrice).toFixed(2)}
                          </div>
                        </div>
                        <div className="col-span-1">
                          {items.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(index)}
                              className="w-8 h-8 p-0 text-red-500 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Notas del pedido */}
            <div>
              <Label htmlFor="notes">Notas del Pedido</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Instrucciones especiales, dirección de entrega, etc."
                rows={3}
              />
            </div>

            {/* Total */}
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <span className="text-lg font-semibold">Total:</span>
              <span className="text-2xl font-bold text-green-600">
                ${total.toFixed(2)}
              </span>
            </div>

            {/* Botones */}
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createOrder.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {createOrder.isPending ? 'Creando...' : 'Crear Pedido'}
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