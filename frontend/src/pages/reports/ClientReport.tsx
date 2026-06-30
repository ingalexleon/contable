import { useParams, useNavigate } from 'react-router-dom'
import { useClientReport } from '@/hooks/useReports'
import { useClient } from '@/hooks/useClients'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'

export default function ClientReport() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: client } = useClient(id || '')
  const { data: report, isLoading } = useClientReport(id || '')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Reporte de Cliente</h1>
          {client && <p className="text-muted-foreground">{client.business_name}</p>}
        </div>
      </div>

      {isLoading ? (
        <Card><CardContent className="p-6 text-center">Cargando reporte...</CardContent></Card>
      ) : report ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">Total Pagado</p>
                <p className="text-xl font-bold">${(report.total_paid ?? 0).toLocaleString('es-MX')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">Pagos Pendientes</p>
                <p className="text-xl font-bold text-orange-600">${(report.total_pending ?? 0).toLocaleString('es-MX')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">Servicios Activos</p>
                <p className="text-xl font-bold">{report.active_services ?? 0}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-medium">Cliente desde:</span>{' '}
                  {client?.created_at ? new Date(client.created_at).toLocaleDateString('es-MX') : '-'}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Tipo:</span> {client?.client_type ?? '-'}
                </p>
                <p className="text-sm">
                  <span className="font-medium">RFC:</span> {client?.tax_id ?? '-'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No se pudo cargar el reporte
          </CardContent>
        </Card>
      )}
    </div>
  )
}
