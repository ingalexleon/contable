import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useParams } from 'react-router-dom'
import { useServices, useAssignService } from '@/hooks/useServices'
import { useClient } from '@/hooks/useClients'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft } from 'lucide-react'

const assignSchema = z.object({
  service_id: z.coerce.number().min(1, 'Seleccione un servicio'),
  custom_price: z.coerce.number().optional(),
  period: z.enum(['monthly', 'annual']),
})

type AssignFormData = z.infer<typeof assignSchema>

export default function ClientServiceAssignment() {
  const { id: clientId } = useParams()
  const navigate = useNavigate()
  const { data: client } = useClient(clientId || '')
  const { data: services } = useServices()
  const assignService = useAssignService()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AssignFormData>({
    resolver: zodResolver(assignSchema),
    defaultValues: {
      period: 'monthly',
    },
  })

  const selectedServiceId = watch('service_id')
  const selectedService = services?.find((s) => s.id === Number(selectedServiceId))
  const period = watch('period')

  const onSubmit = async (data: AssignFormData) => {
    try {
      await assignService.mutateAsync({
        client_id: Number(clientId),
        service_id: data.service_id,
        custom_price: data.custom_price || null,
        period: data.period,
      })
      navigate(`/clientes/${clientId}`)
    } catch {
      // error handled by mutation
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/clientes/${clientId}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Asignar Servicio</h1>
          {client && <p className="text-muted-foreground">{client.business_name}</p>}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Servicio</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Servicio *</Label>
              <Select
                value={selectedServiceId?.toString() || ''}
                onValueChange={(val) => setValue('service_id', Number(val))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un servicio" />
                </SelectTrigger>
                <SelectContent>
                  {services?.filter(s => s.is_active).map((service) => (
                    <SelectItem key={service.id} value={service.id.toString()}>
                      {service.name} - ${service.default_price.toLocaleString('es-MX')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.service_id && (
                <p className="text-sm text-destructive">{errors.service_id.message}</p>
              )}
            </div>

            {selectedService && (
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm">
                  <span className="font-medium">Precio base:</span>{' '}
                  ${selectedService.default_price.toLocaleString('es-MX')}
                </p>
                {selectedService.description && (
                  <p className="text-sm text-muted-foreground mt-1">{selectedService.description}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="custom_price">Precio Personalizado (MXN)</Label>
              <Input
                id="custom_price"
                type="number"
                step="0.01"
                placeholder="Dejar vacio para usar precio base"
                {...register('custom_price')}
              />
              <p className="text-xs text-muted-foreground">
                Si se deja vacio, se usara el precio base del servicio
              </p>
            </div>

            <div className="space-y-2">
              <Label>Periodo *</Label>
              <Select value={period} onValueChange={(val) => setValue('period', val as 'monthly' | 'annual')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Mensual</SelectItem>
                  <SelectItem value="annual">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Asignando...' : 'Asignar Servicio'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate(`/clientes/${clientId}`)}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
