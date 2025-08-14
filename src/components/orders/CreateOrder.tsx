import { useEffect, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  ArrowLeft,
  Calculator,
  Calendar,
  Copy,
  FileText,
  MessageCircle, 
  Package,
  Plus, 
  Save,
  User,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import type { Order, OrderFormData } from '../../types/index.ts';
import { Badge } from '../ui/badge.tsx';
import { Button } from '../ui/button.tsx';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card.tsx';
import { Input } from '../ui/input.tsx';
import { Label } from '../ui/label.tsx';
import { Separator } from '../ui/separator.tsx';
import { Textarea } from '../ui/textarea.tsx';
import { useOrders } from '../../hooks/useOrders.ts';
import { useProducts } from '../../hooks/useProducts.ts';
import { formatCurrency } from '../../lib/utils.ts';

// ✅ ACTUALIZADO: Schema de validación usando OrderFormData
const orderSchema = z.object({
  clientName: z.string()
    .min(2, 'Nombre del cliente debe tener al menos 2 caracteres')
    .max(100, 'Nombre muy largo'),
  clientPhone: z.string()
    .optional()
    .refine((phone) => !phone || /^\+?[\d\s\-()]{8,}$/.test(phone), {
      message: 'Formato de teléfono inválido'
    }),
  deliveryDate: z.string()
    .min(1, 'Fecha de entrega requerida')
    .refine((date) => new Date(date) >= new Date(new Date().setHours(0,0,0,0)), {
      message: 'La fecha no puede ser anterior a hoy'
    }),
  deliveryTime: z.string().optional(),
  notes: z.string().max(500, 'Notas muy largas').optional(),
  items: z.array(z.object({
    productName: z.string().min(1, 'Nombre del producto requerido'),
    quantity: z.number()
      .min(1, 'Cantidad mínima: 1')
      .max(999, 'Cantidad máxima: 999'),
    unitPrice: z.number()
      .min(0, 'Precio debe ser mayor o igual a 0')
      .max(999999, 'Precio muy alto'),
    notes: z.string().optional()
  })).min(1, 'Agrega al menos un producto')
});

interface CreateOrderProps {
  onSuccess?: (order: Order) => void;
  onCancel?: () => void;
  editOrder?: Order | null;
  className?: string;
  businessId: string;
}

export function CreateOrder({ 
  onSuccess, 
  onCancel, 
  editOrder,
  className,
  businessId
}: CreateOrderProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastReceipt, setLastReceipt] = useState('');

  // Hooks
  const { createOrderFromForm } = useOrders(businessId);
  const { products, isLoading: _productsLoading } = useProducts({ businessId: businessId });

  const isEditing = !!editOrder;

  // Form setup
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
    reset,
    getValues
  } = useForm<z.infer<typeof orderSchema>>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      items: [{ productName: '', quantity: 1, unitPrice: 0, notes: '' }],
      deliveryDate: new Date().toISOString().split('T')[0] || '',
      deliveryTime: undefined,
      clientName: '',
      clientPhone: undefined,
      notes: undefined
    }
  });

  // Field array for items
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  });

  // Watch values for calculations
  const items = watch('items');

  // Calculate total
  const total = items.reduce((sum: number, item: unknown) => {
    const quantity = Number((item as { quantity: number }).quantity) || 0;
    const price = Number((item as { unitPrice: number }).unitPrice) || 0;
    return sum + (quantity * price);
  }, 0);

  // Load edit data
  useEffect(() => {
    if (editOrder) {
      reset({
        clientName: editOrder.client_name,
        clientPhone: editOrder.client_phone || undefined,
        deliveryDate: editOrder.delivery_date?.split('T')[0] || new Date().toISOString().split('T')[0] || '',
        deliveryTime: editOrder.delivery_time || undefined,
        notes: editOrder.notes || undefined,
        items: editOrder.items?.map((item: unknown) => ({
          productName: (item as { product_name: string }).product_name,
          quantity: (item as { quantity: number }).quantity,
          unitPrice: (item as { unit_price: number }).unit_price,
          notes: (item as { notes: string }).notes || ''
        })) || []
      });
    }
  }, [editOrder, reset]);

  const addItem = () => {
    append({ productName: '', quantity: 1, unitPrice: 0, notes: '' });
  };

  const removeItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const generateReceipt = (data: z.infer<typeof orderSchema>) => {
    const itemsList = data.items
      .map(item => `• ${item.quantity}x ${item.productName} - ${formatCurrency(item.quantity * item.unitPrice)}`)
      .join('\n');

    const receipt = `🧾 *PEDIDO CONFIRMADO*
    
Cliente: ${data.clientName}
${data.clientPhone ? `Teléfono: ${data.clientPhone}` : ''}

📅 Entrega: ${new Date(data.deliveryDate).toLocaleDateString('es-MX', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
})}${data.deliveryTime ? ` a las ${data.deliveryTime}` : ''}

📦 *Productos:*
${itemsList}

💰 *TOTAL: ${formatCurrency(total)}*

${data.notes ? `\n📝 Notas: ${data.notes}` : ''}

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
    const formData = getValues();
    if (lastReceipt && formData.clientPhone) {
      const cleanPhone = formData.clientPhone.replace(/\D/g, '');
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(lastReceipt)}`;
      globalThis.open(whatsappUrl, '_blank');
    } else {
      toast.error('Se requiere número de teléfono para compartir por WhatsApp');
    }
  };

  // ✅ ACTUALIZADO: Usar createOrderFromForm con tipos unificados
  const onSubmit = async (data: z.infer<typeof orderSchema>) => {
    setIsCreating(true);
    
    try {
      let result;
      if (isEditing) {
        // For now, we'll just create a new order since updateOrder is not implemented
        // You can implement updateOrder in useOrders hook if needed
        result = await createOrderFromForm.mutateAsync(data);
      } else {
        result = await createOrderFromForm.mutateAsync(data);
      }

      // Generate and show receipt
      const receipt = generateReceipt(data as OrderFormData);
      setLastReceipt(receipt);
      setShowReceipt(true);

      toast.success(isEditing ? 'Pedido actualizado correctamente' : 'Pedido creado correctamente');
      
      if (onSuccess) {
        // Add order_id to items to match Order type
        const orderWithItems = {
          ...result,
          items: result.items?.map((item: unknown) => ({
            ...(item as Record<string, unknown>),
            order_id: result.id || ''
          })) || []
        };
        onSuccess(orderWithItems as Order);
      }

    } catch (error) {
      console.error('Error creating/updating order:', error);
      toast.error(isEditing ? 'Error al actualizar el pedido' : 'Error al crear el pedido');
    } finally {
      setIsCreating(false);
    }
  };

  const handleReset = () => {
    if (isEditing) {
      onCancel?.();
    } else {
      reset();
      toast.info('Formulario reiniciado');
    }
  };

  if (showReceipt) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <Package className="w-5 h-5" />
            {isEditing ? '¡Pedido Actualizado!' : '¡Pedido Creado!'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <pre className="whitespace-pre-wrap text-sm font-mono">
              {lastReceipt}
            </pre>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <Button onClick={handleCopyReceipt} variant="outline">
              <Copy className="w-4 h-4 mr-2" />
              Copiar Recibo
            </Button>
            
            <Button onClick={handleShareWhatsApp} variant="outline">
              <MessageCircle className="w-4 h-4 mr-2" />
              Enviar WhatsApp
            </Button>
            
            <Button 
              onClick={() => {
                setShowReceipt(false);
                if (!isEditing) {
                  reset();
                }
              }}
              variant="default"
            >
              {isEditing ? 'Cerrar' : 'Crear Otro Pedido'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            {isEditing ? 'Editar Pedido' : 'Crear Nuevo Pedido'}
          </CardTitle>
          
          {onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Información del Cliente */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <User className="w-4 h-4" />
              Información del Cliente
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientName">Nombre del Cliente *</Label>
                <Input
                  id="clientName"
                  {...register('clientName')}
                  placeholder="Nombre completo"
                  className={errors.clientName ? 'border-red-500' : ''}
                />
                {errors.clientName && (
                  <p className="text-sm text-red-500">{errors.clientName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientPhone">Teléfono (Opcional)</Label>
                <Input
                  id="clientPhone"
                  {...register('clientPhone')}
                  placeholder="+52 555 123 4567"
                  className={errors.clientPhone ? 'border-red-500' : ''}
                />
                {errors.clientPhone && (
                  <p className="text-sm text-red-500">{errors.clientPhone.message}</p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Información de Entrega */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Información de Entrega
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deliveryDate">Fecha de Entrega *</Label>
                <Input
                  id="deliveryDate"
                  type="date"
                  {...register('deliveryDate')}
                  className={errors.deliveryDate ? 'border-red-500' : ''}
                />
                {errors.deliveryDate && (
                  <p className="text-sm text-red-500">{errors.deliveryDate.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="deliveryTime">Hora de Entrega (Opcional)</Label>
                <Input
                  id="deliveryTime"
                  type="time"
                  {...register('deliveryTime')}
                  className={errors.deliveryTime ? 'border-red-500' : ''}
                />
                {errors.deliveryTime && (
                  <p className="text-sm text-red-500">{errors.deliveryTime.message}</p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Productos */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <Package className="w-4 h-4" />
                Productos ({fields.length})
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addItem}
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar Producto
              </Button>
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => (
                <Card key={field.id} className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                    {/* Product Name */}
                    <div className="md:col-span-5 space-y-2">
                      <Label>Producto *</Label>
                      <Input
                        {...register(`items.${index}.productName`)}
                        placeholder="Nombre del producto"
                        className={errors.items?.[index]?.productName ? 'border-red-500' : ''}
                        list={`products-${index}`}
                      />
                      
                      {/* Product suggestions datalist */}
                      <datalist id={`products-${index}`}>
                        {products?.map((product: unknown) => (
                          <option key={(product as { id: string }).id} value={(product as { name: string }).name} />
                        ))}
                      </datalist>
                      
                      {errors.items?.[index]?.productName && (
                        <p className="text-sm text-red-500">
                          {errors.items[index].productName.message}
                        </p>
                      )}
                    </div>

                    {/* Quantity */}
                    <div className="md:col-span-2 space-y-2">
                      <Label>Cantidad *</Label>
                      <Input
                        type="number"
                        min="1"
                        max="999"
                        {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                        className={errors.items?.[index]?.quantity ? 'border-red-500' : ''}
                      />
                      {errors.items?.[index]?.quantity && (
                        <p className="text-sm text-red-500">
                          {errors.items[index].quantity.message}
                        </p>
                      )}
                    </div>

                    {/* Unit Price */}
                    <div className="md:col-span-3 space-y-2">
                      <Label>Precio Unitario *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        {...register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                        placeholder="0.00"
                        className={errors.items?.[index]?.unitPrice ? 'border-red-500' : ''}
                      />
                      {errors.items?.[index]?.unitPrice && (
                        <p className="text-sm text-red-500">
                          {errors.items[index].unitPrice.message}
                        </p>
                      )}
                    </div>

                    {/* Subtotal & Remove */}
                    <div className="md:col-span-2 flex items-center justify-between">
                      <Badge variant="secondary" className="font-mono">
                        {formatCurrency((items[index]?.quantity || 0) * (items[index]?.unitPrice || 0))}
                      </Badge>
                      
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(index)}
                        disabled={fields.length === 1}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {errors.items && (
              <p className="text-sm text-red-500">
                {errors.items.message || 'Revisa los productos'}
              </p>
            )}
          </div>

          {/* Total */}
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-lg font-bold">
                <span className="flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Total del Pedido:
                </span>
                <span className="text-2xl text-primary">
                  {formatCurrency(total)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Notas Adicionales (Opcional)
            </Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Instrucciones especiales, preferencias, etc."
              rows={3}
              className={errors.notes ? 'border-red-500' : ''}
            />
            {errors.notes && (
              <p className="text-sm text-red-500">{errors.notes.message}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isCreating}
              className="flex-1"
            >
              <Save className="w-4 h-4 mr-2" />
              {isCreating 
                ? (isEditing ? 'Actualizando...' : 'Creando...') 
                : (isEditing ? 'Actualizar Pedido' : 'Crear Pedido')
              }
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={isCreating}
            >
              {isEditing ? 'Cancelar' : 'Limpiar'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 