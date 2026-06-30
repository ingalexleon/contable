import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useClients } from '@/hooks/useClients'
import { useAuth } from '@/lib/auth-context'
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
import { Plus, Search, Eye } from 'lucide-react'

const clientTypeLabels: Record<string, string> = {
  'Persona Fisica': 'Persona Fisica',
  'Persona Moral': 'Persona Moral',
  'Regimen Simplificado': 'Regimen Simplificado',
}

export default function ClientList() {
  const { isAdmin } = useAuth()
  const [search, setSearch] = useState('')
  const [clientType, setClientType] = useState<string>('all')
  const [includeInactive, setIncludeInactive] = useState(false)

  const { data: clients, isLoading } = useClients({
    search: search || undefined,
    client_type: clientType !== 'all' ? clientType : undefined,
    include_inactive: includeInactive,
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Clientes</h1>
        {isAdmin && (
          <Link to="/clientes/nuevo">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Cliente
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o RFC..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={clientType} onValueChange={setClientType}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Tipo de cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="Persona Fisica">Persona Fisica</SelectItem>
                <SelectItem value="Persona Moral">Persona Moral</SelectItem>
                <SelectItem value="Regimen Simplificado">Regimen Simplificado</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant={includeInactive ? 'secondary' : 'outline'}
              onClick={() => setIncludeInactive(!includeInactive)}
            >
              {includeInactive ? 'Mostrando inactivos' : 'Mostrar inactivos'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table - desktop */}
      <div className="hidden md:block">
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre / Razon Social</TableHead>
                  <TableHead>RFC</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Cargando...
                    </TableCell>
                  </TableRow>
                ) : clients?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No se encontraron clientes
                    </TableCell>
                  </TableRow>
                ) : (
                  clients?.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.business_name}</TableCell>
                      <TableCell>{client.rfc}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {clientTypeLabels[client.client_type] ?? client.client_type}
                        </Badge>
                      </TableCell>
                      <TableCell>{client.contact_name}</TableCell>
                      <TableCell>
                        <Badge variant={client.is_active ? 'success' : 'destructive'}>
                          {client.is_active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link to={`/clientes/${client.id}`}>
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

      {/* Cards - mobile */}
      <div className="md:hidden space-y-4">
        {isLoading ? (
          <Card><CardContent className="p-6 text-center">Cargando...</CardContent></Card>
        ) : clients?.length === 0 ? (
          <Card><CardContent className="p-6 text-center text-muted-foreground">No se encontraron clientes</CardContent></Card>
        ) : (
          clients?.map((client) => (
            <Link key={client.id} to={`/clientes/${client.id}`}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="font-medium">{client.business_name}</p>
                      <p className="text-sm text-muted-foreground">{client.rfc}</p>
                      <p className="text-sm text-muted-foreground">{client.contact_name}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant={client.is_active ? 'success' : 'destructive'}>
                        {client.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                      <Badge variant="secondary">
                        {clientTypeLabels[client.client_type] ?? client.client_type}
                      </Badge>
                    </div>
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
