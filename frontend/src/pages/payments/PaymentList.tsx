import { useState } from 'react'
import { Link } from 'react-router-dom'
import { usePayments } from '@/hooks/usePayments'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Eye } from 'lucide-react'

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  paid: 'Pagado',
  overdue: 'Vencido',
}

const statusVariants: Record<string, 'success' | 'warning' | 'destructive'> = {
  paid: 'success',
  pending: 'warning',
  overdue: 'destructive',
}

export default function PaymentList() {
  const [status, setStatus] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const { data: payments, isLoading } = usePayments({
    status: status !== 'all' ? status : undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Registrar pagos y movimientos</h1>
        <Link to="/pagos/nuevo">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Registrar Pago
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="paid">Pagado</SelectItem>
                <SelectItem value="overdue">Vencido</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              placeholder="Desde"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full sm:w-auto"
            />
            <Input
              type="date"
              placeholder="Hasta"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full sm:w-auto"
            />
          </div>
        </CardContent>
      </Card>

      {/* Desktop table */}
      <div className="hidden md:block">
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Periodo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">Cargando...</TableCell>
                  </TableRow>
                ) : payments?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No se encontraron pagos
                    </TableCell>
                  </TableRow>
                ) : (
                  payments?.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">
                        {payment.client?.business_name ?? `Cliente #${payment.client_id}`}
                      </TableCell>
                      <TableCell>${payment.amount.toLocaleString('es-MX')}</TableCell>
                      <TableCell>{new Date(payment.payment_date).toLocaleDateString('es-MX')}</TableCell>
                      <TableCell>
                        {new Date(payment.period_start).toLocaleDateString('es-MX')} -{' '}
                        {new Date(payment.period_end).toLocaleDateString('es-MX')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariants[payment.status] ?? 'secondary'}>
                          {statusLabels[payment.status] ?? payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link to={`/pagos/${payment.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-4">
        {isLoading ? (
          <Card><CardContent className="p-6 text-center">Cargando...</CardContent></Card>
        ) : payments?.length === 0 ? (
          <Card><CardContent className="p-6 text-center text-muted-foreground">No se encontraron pagos</CardContent></Card>
        ) : (
          payments?.map((payment) => (
            <Link key={payment.id} to={`/pagos/${payment.id}`}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="font-medium">{payment.client?.business_name ?? `Cliente #${payment.client_id}`}</p>
                      <p className="text-lg font-bold">${payment.amount.toLocaleString('es-MX')}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(payment.payment_date).toLocaleDateString('es-MX')}
                      </p>
                    </div>
                    <Badge variant={statusVariants[payment.status] ?? 'secondary'}>
                      {statusLabels[payment.status] ?? payment.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
