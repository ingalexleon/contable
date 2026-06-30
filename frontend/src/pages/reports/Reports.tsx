import { useState } from 'react'
import { useGeneralReport, exportExcel } from '@/hooks/useReports'
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
import { Download, FileSpreadsheet } from 'lucide-react'

export default function Reports() {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [clientType, setClientType] = useState<string>('all')
  const [exportTable, setExportTable] = useState('all')
  const [isExporting, setIsExporting] = useState(false)

  const { data: report, isLoading } = useGeneralReport({
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    client_type: clientType !== 'all' ? clientType : undefined,
  })

  const handleExport = async () => {
    setIsExporting(true)
    try {
      await exportExcel(exportTable)
    } catch {
      // handle error silently
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reportes</h1>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Fecha Desde</Label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Fecha Hasta</Label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Tipo de Cliente</Label>
              <Select value={clientType} onValueChange={setClientType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="persona_fisica">Persona Fisica</SelectItem>
                  <SelectItem value="persona_moral">Persona Moral</SelectItem>
                  <SelectItem value="regimen_simplificado">Regimen Simplificado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Exportar</Label>
              <div className="flex gap-2">
                <Select value={exportTable} onValueChange={setExportTable}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todo</SelectItem>
                    <SelectItem value="clients">Clientes</SelectItem>
                    <SelectItem value="payments">Pagos</SelectItem>
                    <SelectItem value="services">Servicios</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleExport} disabled={isExporting} size="icon">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Exportar a Excel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Descargue un reporte completo en formato Excel con todos los datos del sistema.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => exportExcel('all')} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Todo el sistema
            </Button>
            <Button onClick={() => exportExcel('clients')} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Solo Clientes
            </Button>
            <Button onClick={() => exportExcel('payments')} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Solo Pagos
            </Button>
            <Button onClick={() => exportExcel('services')} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Solo Servicios
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Resumen General</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Cargando reporte...</div>
          ) : report ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Total Ingresos</p>
                <p className="text-xl font-bold">${(report.total_revenue ?? 0).toLocaleString('es-MX')}</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Pagos Registrados</p>
                <p className="text-xl font-bold">{report.total_payments ?? 0}</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Clientes Activos</p>
                <p className="text-xl font-bold">{report.active_clients ?? 0}</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Servicios Activos</p>
                <p className="text-xl font-bold">{report.active_services ?? 0}</p>
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              Configure los filtros para generar un reporte
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
