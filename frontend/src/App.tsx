import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from '@/lib/auth-context'

const Login = lazy(() => import('@/pages/Login'))
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'))
const ResetPassword = lazy(() => import('@/pages/ResetPassword'))
const DashboardLayout = lazy(() => import('@/components/layout/DashboardLayout'))
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const ClientList = lazy(() => import('@/pages/clients/ClientList'))
const ClientDetail = lazy(() => import('@/pages/clients/ClientDetail'))
const ClientForm = lazy(() => import('@/pages/clients/ClientForm'))
const ClientServiceAssignment = lazy(() => import('@/pages/services/ClientServiceAssignment'))
const ServiceList = lazy(() => import('@/pages/services/ServiceList'))
const PaymentList = lazy(() => import('@/pages/payments/PaymentList'))
const PaymentForm = lazy(() => import('@/pages/payments/PaymentForm'))
const PaymentProofViewer = lazy(() => import('@/pages/payments/PaymentProofViewer'))
const Reports = lazy(() => import('@/pages/reports/Reports'))
const ClientReport = lazy(() => import('@/pages/reports/ClientReport'))
const UserList = lazy(() => import('@/pages/users/UserList'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
})

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Protected routes */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="clientes" element={<ClientList />} />
        <Route path="clientes/nuevo" element={<ClientForm />} />
        <Route path="clientes/:id" element={<ClientDetail />} />
        <Route path="clientes/:id/editar" element={<ClientForm />} />
        <Route path="clientes/:id/asignar-servicio" element={<ClientServiceAssignment />} />
        <Route path="servicios" element={<ServiceList />} />
        <Route path="pagos" element={<PaymentList />} />
        <Route path="pagos/nuevo" element={<PaymentForm />} />
        <Route path="pagos/:id" element={<PaymentProofViewer />} />
        <Route path="reportes" element={<Reports />} />
        <Route path="reportes/cliente/:id" element={<ClientReport />} />

        {/* Admin only routes */}
        <Route path="usuarios" element={<AdminRoute><UserList /></AdminRoute>} />
        <Route path="configuracion" element={<AdminRoute><div className="text-center py-8"><h1 className="text-2xl font-bold">Configuracion</h1><p className="text-muted-foreground mt-2">Proximamente</p></div></AdminRoute>} />
        <Route path="perfil" element={<div className="text-center py-8"><h1 className="text-2xl font-bold">Mi Perfil</h1><p className="text-muted-foreground mt-2">Proximamente</p></div>} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<LoadingSpinner />}>
            <AppRoutes />
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
