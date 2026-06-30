import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateService, useUpdateService } from '@/hooks/useServices'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Service } from '@/lib/types'

const serviceSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  default_price: z.coerce.number().min(0, 'El precio debe ser positivo'),
  category: z.string().optional(),
})

type ServiceFormData = z.infer<typeof serviceSchema>

interface ServiceFormProps {
  serviceId?: number
  defaultValues?: Partial<Service>
  onSuccess?: () => void
}

export default function ServiceForm({ serviceId, defaultValues, onSuccess }: ServiceFormProps) {
  const createService = useCreateService()
  const updateService = useUpdateService()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: defaultValues?.name || '',
      description: defaultValues?.description || '',
      default_price: defaultValues?.default_price || 0,
      category: defaultValues?.category || '',
    },
  })

  const onSubmit = async (data: ServiceFormData) => {
    try {
      if (serviceId) {
        await updateService.mutateAsync({ id: serviceId, data })
      } else {
        await createService.mutateAsync(data)
      }
      onSuccess?.()
    } catch {
      // error handled by mutation
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre del Servicio *</Label>
        <Input id="name" {...register('name')} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripcion</Label>
        <Input id="description" {...register('description')} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="default_price">Precio Base (MXN) *</Label>
        <Input id="default_price" type="number" step="0.01" {...register('default_price')} />
        {errors.default_price && <p className="text-sm text-destructive">{errors.default_price.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Categoria</Label>
        <Input id="category" {...register('category')} placeholder="ej. Contabilidad, Fiscal, Legal" />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Guardando...' : serviceId ? 'Actualizar' : 'Crear Servicio'}
      </Button>
    </form>
  )
}
