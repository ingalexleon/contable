import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useParams } from 'react-router-dom'
import { useClient, useCreateClient, useUpdateClient } from '@/hooks/useClients'
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

const clientSchema = z.object({
  business_name: z.string().min(1, 'El nombre es requerido'),
  contact_name: z.string().min(1, 'El contacto es requerido'),
  email: z.string().email('Correo invalido').or(z.literal('')),
  phone: z.string().regex(/^\d{10}$/, 'El telefono debe tener exactamente 10 digitos'),
  rfc: z.string().regex(
    /^[A-Z&Ñ]{3,4}\d{6}[A-Z\d]{3}$/i,
    'El RFC debe tener el formato correcto (ej. XAXX010101000 para persona fisica o XXX010101000 para persona moral)'
  ),
  client_type: z.enum(['Persona Fisica', 'Persona Moral', 'Regimen Simplificado']),
  address: z.string().optional(),
})

type ClientFormData = z.infer<typeof clientSchema>

export default function ClientForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = !!id
  const { data: client } = useClient(id || '')
  const createClient = useCreateClient()
  const updateClient = useUpdateClient()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      client_type: 'Persona Fisica',
    },
  })

  const clientType = watch('client_type')

  useEffect(() => {
    if (client && isEditing) {
      setValue('business_name', client.business_name)
      setValue('contact_name', client.contact_name)
      setValue('email', client.email || '')
      setValue('phone', client.phone || '')
      setValue('rfc', client.rfc)
      setValue('client_type', client.client_type)
      setValue('address', client.address || '')
    }
  }, [client, isEditing, setValue])

  const onSubmit = async (data: ClientFormData) => {
    try {
      if (isEditing && id) {
        await updateClient.mutateAsync({ id: Number(id), data })
      } else {
        await createClient.mutateAsync(data)
      }
      navigate('/clientes')
    } catch {
      // error handled by mutation
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/clientes')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">
          {isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informacion del Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="business_name">Nombre / Razon Social *</Label>
                <Input id="business_name" {...register('business_name')} />
                {errors.business_name && (
                  <p className="text-sm text-destructive">{errors.business_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="rfc">RFC *</Label>
                <Input id="rfc" {...register('rfc')} placeholder="XXXX000000XXX" />
                {errors.rfc && (
                  <p className="text-sm text-destructive">{errors.rfc.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="client_type">Tipo de Cliente *</Label>
                <Select
                  value={clientType}
                  onValueChange={(val) => setValue('client_type', val as ClientFormData['client_type'])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Persona Fisica">Persona Fisica</SelectItem>
                    <SelectItem value="Persona Moral">Persona Moral</SelectItem>
                    <SelectItem value="Regimen Simplificado">Regimen Simplificado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_name">Nombre de Contacto *</Label>
                <Input id="contact_name" {...register('contact_name')} />
                {errors.contact_name && (
                  <p className="text-sm text-destructive">{errors.contact_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Correo Electronico</Label>
                <Input id="email" type="email" {...register('email')} />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefono *</Label>
                <Input id="phone" {...register('phone')} placeholder="10 digitos" />
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.phone.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Direccion</Label>
              <Input id="address" {...register('address')} />
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear Cliente'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/clientes')}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
