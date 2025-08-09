import { useState, useMemo } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Label } from './ui/label'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { getAllBusinessTypes } from '@/lib/constants/businessTypes'
import { useQueryClient } from '@tanstack/react-query'
import { useNotifications } from '@/hooks/useNotifications'
import { db } from '@/lib/offline/db'

interface BusinessSetupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BusinessSetupDialog({ open, onOpenChange }: BusinessSetupDialogProps) {
  const [businessName, setBusinessName] = useState('')
  const [businessType, setBusinessType] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const queryClient = useQueryClient()
  const notifications = useNotifications()

  const businessTypes = useMemo(() => getAllBusinessTypes(), [])

  const handleSubmit = async () => {
    if (!businessType) {
      notifications.error('Selecciona un tipo de negocio')
      return
    }

    setIsSubmitting(true)
    try {
      const newBusinessId = uuidv4()

      // Inicializar categorías por defecto en IndexedDB
      const defaults = await db.getDefaultCategoriesForBusinessType(businessType)
      for (const cat of defaults) {
        await db.addBusinessCategory({
          ...cat,
          businessId: newBusinessId,
          clientGeneratedId: uuidv4(),
        })
      }

      // Actualizar el usuario en caché con el nuevo businessId
      const currentUser = queryClient.getQueryData<any>(['auth-user'])
      if (currentUser) {
        queryClient.setQueryData(['auth-user'], { ...currentUser, businessId: newBusinessId })
      }

      notifications.success('Negocio configurado correctamente')
      onOpenChange(false)
    } catch (error) {
      console.error('Error configuring business', error)
      notifications.error('Error al configurar el negocio')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configurar negocio</DialogTitle>
          <DialogDescription>
            Crea tu negocio para comenzar a recibir pedidos y administrar productos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="businessName">Nombre del negocio (opcional)</Label>
            <Input
              id="businessName"
              placeholder="Ej. La Esquinita"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Tipo de negocio</Label>
            <Select value={businessType} onValueChange={setBusinessType}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona un tipo" />
              </SelectTrigger>
              <SelectContent>
                {businessTypes.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    <span>{t.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-6 flex gap-2 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Guardando…' : 'Guardar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}