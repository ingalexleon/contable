import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { useClients } from '@/hooks/useClients'
import { useCreatePayment, useUploadProof } from '@/hooks/usePayments'
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
import { ArrowLeft, Upload } from 'lucide-react'

const paymentSchema = z.object({
  client_id: z.coerce.number().min(1, 'Seleccione un cliente'),
  amount: z.coerce.number().min(0.01, 'El monto debe ser mayor a 0'),
  payment_date: z.string().min(1, 'La fecha es requerida'),
  period_start: z.string().min(1, 'La fecha de inicio del periodo es requerida'),
  period_end: z.string().min(1, 'La fecha de fin del periodo es requerida'),
  status: z.enum(['pending', 'paid', 'overdue']),
  notes: z.string().optional(),
})

type PaymentFormData = z.infer<typeof paymentSchema>

export default function PaymentForm() {
  const navigate = useNavigate()
  const { data: clients } = useClients()
  const createPayment = useCreatePayment()
  const uploadProof = useUploadProof()
  const [proofFile, setProofFile] = useState<File | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      status: 'pending',
      payment_date: new Date().toISOString().split('T')[0],
    },
  })

  const clientId = watch('client_id')
  const status = watch('status')

  const onSubmit = async (data: PaymentFormData) => {
    try {
      const payment = await createPayment.mutateAsync(data)
      if (proofFile && payment?.id) {
        await uploadProof.mutateAsync({ paymentId: payment.id, file: proofFile })
      }
      navigate('/pagos')
    } catch {
      // error handled by mutation
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/pagos')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Registrar Pago</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informacion del Pago</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cliente *</Label>
                <Select
                  value={clientId?.toString() || ''}
                  onValueChange={(val) => setValue('client_id', Number(val))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients?.map((client) => (
                      <SelectItem key={client.id} value={client.id.toString()}>
                        {client.business_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.client_id && (
                  <p className="text-sm text-destructive">{errors.client_id.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Monto (MXN) *</Label>
                <Input id="amount" type="number" step="0.01" {...register('amount')} />
                {errors.amount && (
                  <p className="text-sm text-destructive">{errors.amount.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_date">Fecha de Pago *</Label>
                <Input id="payment_date" type="date" {...register('payment_date')} />
                {errors.payment_date && (
                  <p className="text-sm text-destructive">{errors.payment_date.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Estado *</Label>
                <Select value={status} onValueChange={(val) => setValue('status', val as PaymentFormData['status'])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="paid">Pagado</SelectItem>
                    <SelectItem value="overdue">Vencido</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="period_start">Inicio del Periodo *</Label>
                <Input id="period_start" type="date" {...register('period_start')} />
                {errors.period_start && (
                  <p className="text-sm text-destructive">{errors.period_start.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="period_end">Fin del Periodo *</Label>
                <Input id="period_end" type="date" {...register('period_end')} />
                {errors.period_end && (
                  <p className="text-sm text-destructive">{errors.period_end.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Input id="notes" {...register('notes')} placeholder="Notas adicionales..." />
            </div>

            <div className="space-y-2">
              <Label>Comprobante de Pago</Label>
              <div className="border-2 border-dashed rounded-md p-4">
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {proofFile ? proofFile.name : 'Arrastre o seleccione un archivo'}
                  </p>
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                    className="max-w-xs"
                  />
                  <p className="text-xs text-muted-foreground">PDF, JPG o PNG (max 10MB)</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Guardando...' : 'Registrar Pago'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/pagos')}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
