import { useParams, useNavigate, Link } from 'react-router-dom'
import { useClient } from '@/hooks/useClients'
import { useClientServices } from '@/hooks/useServices'
import { usePayments } from '@/hooks/usePayments'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowLeft, Edit, Plus } from 'lucide-react'

const clientTypeLabels: Record<string, string> = {
  'Persona Fisica': 'Persona Fisica',
  'Persona Moral': 'Persona Moral',
  'Regimen Simplificado': 'Regimen Simplificado',
}

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  paid: 'Pagado',
  overdue: 'Vencido',
}

export default function ClientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const { data: client, isLoading } = useClient(id || '')
  const { data: services } = useClientServices(id || '')
  const { data: payments } = usePayments({ client_id: Number(id) })

  if (isLoading) {
    return <div className="text-center py-8">Cargando...</div>
  }

  if (!client) {
    return <div className="text-center py-8 text-muted-foreground">Cliente no encontrado</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/clientes')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{client.business_name}</h1>
            <p className="text-muted-foreground">{client.rfc}</p>
          </div>
        </div>
        {isAdmin && (
          <Link to={`/clientes/${id}/editar`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
          </Link>
        )}
      </div>

      <Tabs defaultValue="info">
        <TabsList className="w-full sm:w-auto grid grid-cols-4 sm:inline-flex">
          <TabsTrigger value="info">General</TabsTrigger>
          <TabsTrigger value="services">Servicios</TabsTrigger>
          <TabsTrigger value="payments">Pagos</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Informacion General</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Tipo de Cliente</p>
                  <p className="font-medium">{clientTypeLabels[client.client_type] ?? client.client_type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estado</p>
                  <Badge variant={client.is_active ? 'success' : 'destructive'}>
                    {client.is_active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Contacto</p>
                  <p className="font-medium">{client.contact_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Correo</p>
                  <p className="font-medium">{client.email || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Telefono</p>
                  <p className="font-medium">{client.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Direccion</p>
                  <p className="font-medium">{client.address || '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Servicios Asignados</CardTitle>
              {isAdmin && (
                <Link to={`/clientes/${id}/asignar-servicio`}>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Asignar
                  </Button>
                </Link>
              )}
            </CardHeader>
            <CardContent>
              {services?.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No hay servicios asignados
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Servicio</TableHead>
                      <TableHead>Precio</TableHead>
                      <TableHead>Periodo</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {services?.map((cs) => (
                      <TableRow key={cs.id}>
                        <TableCell className="font-medium">{cs.service?.name ?? `Servicio #${cs.service_id}`}</TableCell>
                        <TableCell>
                          ${(cs.custom_price ?? cs.service?.default_price ?? 0).toLocaleString('es-MX')}
                          {cs.custom_price && (
                            <span className="text-xs text-muted-foreground ml-1">(personalizado)</span>
                          )}
                        </TableCell>
                        <TableCell>{cs.period === 'monthly' ? 'Mensual' : 'Anual'}</TableCell>
                        <TableCell>
                          <Badge variant={cs.is_active ? 'success' : 'destructive'}>
                            {cs.is_active ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Pagos del Cliente</CardTitle>
            </CardHeader>
            <CardContent>
              {payments?.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No hay pagos registrados
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Periodo</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments?.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{new Date(payment.payment_date).toLocaleDateString('es-MX')}</TableCell>
                        <TableCell>${payment.amount.toLocaleString('es-MX')}</TableCell>
                        <TableCell>
                          {new Date(payment.period_start).toLocaleDateString('es-MX')} -{' '}
                          {new Date(payment.period_end).toLocaleDateString('es-MX')}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              payment.status === 'paid' ? 'success' :
                              payment.status === 'overdue' ? 'destructive' : 'warning'
                            }
                          >
                            {statusLabels[payment.status] ?? payment.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Historial Financiero</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Pagado</p>
                    <p className="text-xl font-bold">
                      ${(payments?.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0) ?? 0).toLocaleString('es-MX')}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Pendiente</p>
                    <p className="text-xl font-bold text-orange-600">
                      ${(payments?.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0) ?? 0).toLocaleString('es-MX')}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Servicios Activos</p>
                    <p className="text-xl font-bold">{services?.filter(s => s.is_active).length ?? 0}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
