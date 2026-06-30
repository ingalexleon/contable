import { useState } from 'react'
import { useUsers } from '@/hooks/useUsers'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
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
import UserForm from './UserForm'

export default function UserList() {
  const { data: users, isLoading } = useUsers()
  const [showCreate, setShowCreate] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Usuarios</h1>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Usuario
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Usuario</DialogTitle>
            </DialogHeader>
            <UserForm onSuccess={() => setShowCreate(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Correo</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">Cargando...</TableCell>
                </TableRow>
              ) : users?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No hay usuarios registrados
                  </TableCell>
                </TableRow>
              ) : (
                users?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.full_name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'admin' || user.role === 'administrador' ? 'default' : 'secondary'}>
                        {user.role === 'admin' || user.role === 'administrador' ? 'Administrador' : 'Usuario Estandar'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? 'success' : 'destructive'}>
                        {user.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Dialog open={editingId === user.id} onOpenChange={(open) => setEditingId(open ? user.id : null)}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Editar Usuario</DialogTitle>
                          </DialogHeader>
                          <UserForm
                            userId={user.id}
                            defaultValues={user}
                            onSuccess={() => setEditingId(null)}
                          />
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
