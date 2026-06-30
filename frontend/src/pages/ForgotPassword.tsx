import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Mail } from 'lucide-react'

const schema = z.object({
  email: z.string().email('Correo invalido'),
})

type ForgotForm = z.infer<typeof schema>

export default function ForgotPassword() {
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotForm>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: ForgotForm) => {
    try {
      setError('')
      await api.post('/auth/forgot-password', { email: data.email })
      setSent(true)
    } catch {
      setError('No se pudo enviar el correo. Intente de nuevo.')
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                <Mail className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <CardTitle>Correo enviado</CardTitle>
            <CardDescription>
              Si el correo existe en nuestro sistema, recibira instrucciones para restablecer su contrasena.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/login">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al inicio de sesion
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Recuperar contrasena</CardTitle>
          <CardDescription>
            Ingrese su correo electronico y le enviaremos instrucciones para restablecer su contrasena.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Correo electronico</Label>
              <Input
                id="email"
                type="email"
                placeholder="correo@ejemplo.com"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Enviando...' : 'Enviar instrucciones'}
            </Button>
            <div className="text-center">
              <Link to="/login" className="text-sm text-primary hover:underline">
                <ArrowLeft className="inline mr-1 h-3 w-3" />
                Volver al inicio de sesion
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
