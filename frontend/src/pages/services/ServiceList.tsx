import { useState } from 'react'
import { useServices } from '@/hooks/useServices'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, Edit } from 'lucide-react'
import ServiceForm from './ServiceForm'

export default function ServiceList() {
  const { isAdmin } = useAuth()
  const { data: services, isLoading } = useServices()
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Catalogo de Servicios</h1>
        {isAdmin && (
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Servicio
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Servicio</DialogTitle>
              </DialogHeader>
              <ServiceForm onSuccess={() => setShowCreate(false)} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block">
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Servicio</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Precio Base</TableHead>
                  <TableHead>Estado</TableHead>
                  {isAdmin && <TableHead className="text-right">Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">Cargando...</TableCell>
                  </TableRow>
                ) : services?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No hay servicios registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  services?.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{service.name}</p>
                          {service.description && (
                            <p className="text-sm text-muted-foreground">{service.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{service.category || 'General'}</Badge>
                      </TableCell>
                      <TableCell>${service.default_price.toLocaleString('es-MX')}</TableCell>
                      <TableCell>
                        <Badge variant={service.is_active ? 'success' : 'destructive'}>
                          {service.is_active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          <Dialog open={editingId === service.id} onOpenChange={(open) => setEditingId(open ? service.id : null)}>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Editar Servicio</DialogTitle>
                              </DialogHeader>
                              <ServiceForm
                                serviceId={service.id}
                                defaultValues={service}
                                onSuccess={() => setEditingId(null)}
                              />
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      )}
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
        ) : services?.length === 0 ? (
          <Card><CardContent className="p-6 text-center text-muted-foreground">No hay servicios registrados</CardContent></Card>
        ) : (
          services?.map((service) => (
            <Card key={service.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{service.name}</CardTitle>
                  <Badge variant={service.is_active ? 'success' : 'destructive'}>
                    {service.is_active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <Badge variant="secondary">{service.category || 'General'}</Badge>
                    <p className="text-lg font-bold mt-2">${service.default_price.toLocaleString('es-MX')}</p>
                  </div>
                  {isAdmin && (
                    <Dialog open={editingId === service.id} onOpenChange={(open) => setEditingId(open ? service.id : null)}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Editar Servicio</DialogTitle>
                        </DialogHeader>
                        <ServiceForm
                          serviceId={service.id}
                          defaultValues={service}
                          onSuccess={() => setEditingId(null)}
                        />
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
