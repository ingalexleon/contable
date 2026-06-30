import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateUser, useUpdateUser } from '@/hooks/useUsers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { User } from '@/lib/types'

const userSchema = z.object({
  email: z.string().email('Correo invalido'),
  full_name: z.string().min(1, 'El nombre es requerido'),
  password: z.string().optional(),
  role_id: z.coerce.number().min(1, 'El rol es requerido'),
})

type UserFormData = z.infer<typeof userSchema>

interface UserFormProps {
  userId?: number
  defaultValues?: Partial<User>
  onSuccess?: () => void
}

export default function UserForm({ userId, defaultValues, onSuccess }: UserFormProps) {
  const isEditing = !!userId
  const createUser = useCreateUser()
  const updateUser = useUpdateUser()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: defaultValues?.email || '',
      full_name: defaultValues?.full_name || '',
      password: '',
      role_id: defaultValues?.role_id || 2,
    },
  })

  const roleId = watch('role_id')

  const onSubmit = async (data: UserFormData) => {
    try {
      if (isEditing && userId) {
        const { password: _password, ...updateData } = data
        await updateUser.mutateAsync({ id: userId, data: updateData as Partial<User> })
      } else {
        if (!data.password || data.password.length < 6) {
          return
        }
        await createUser.mutateAsync({
          email: data.email,
          full_name: data.full_name,
          password: data.password,
          role_id: data.role_id,
        })
      }
      onSuccess?.()
    } catch {
      // error handled by mutation
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="full_name">Nombre Completo *</Label>
        <Input id="full_name" {...register('full_name')} />
        {errors.full_name && <p className="text-sm text-destructive">{errors.full_name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Correo Electronico *</Label>
        <Input id="email" type="email" {...register('email')} />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>

      {!isEditing && (
        <div className="space-y-2">
          <Label htmlFor="password">Contrasena *</Label>
          <Input id="password" type="password" {...register('password')} />
          {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
        </div>
      )}

      <div className="space-y-2">
        <Label>Rol *</Label>
        <Select value={String(roleId)} onValueChange={(val) => setValue('role_id', Number(val))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Administrador</SelectItem>
            <SelectItem value="2">Usuario Estandar</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear Usuario'}
      </Button>
    </form>
  )
}
