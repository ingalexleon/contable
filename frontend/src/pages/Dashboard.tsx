import { useDashboard } from '@/hooks/useReports'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Briefcase, DollarSign, Clock } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

const COLORS = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe']

export default function Dashboard() {
  const { data: stats, isLoading } = useDashboard()

  const statCards = [
    {
      title: 'Total Clientes',
      value: stats?.total_clients ?? 0,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      title: 'Servicios Activos',
      value: stats?.active_services ?? 0,
      icon: Briefcase,
      color: 'text-green-600',
      bg: 'bg-green-100',
    },
    {
      title: 'Ingresos del Mes',
      value: `$${(stats?.monthly_revenue ?? 0).toLocaleString('es-MX')}`,
      icon: DollarSign,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
    },
    {
      title: 'Pagos Pendientes',
      value: stats?.pending_payments ?? 0,
      icon: Clock,
      color: 'text-orange-600',
      bg: 'bg-orange-100',
    },
  ]

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`h-10 w-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ingresos Mensuales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.monthly_revenue_chart ?? []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [`$${Number(value).toLocaleString('es-MX')}`, 'Ingresos']}
                  />
                  <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Client type distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tipo de Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.client_type_distribution ?? []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="type"
                  >
                    {(stats?.client_type_distribution ?? []).map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top services */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Servicios Mas Populares</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(stats?.top_services ?? []).map((service, index) => (
              <div key={service.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-muted-foreground w-6">
                    #{index + 1}
                  </span>
                  <span className="text-sm font-medium">{service.name}</span>
                </div>
                <span className="text-sm text-muted-foreground">{service.count} clientes</span>
              </div>
            ))}
            {(stats?.top_services ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay datos disponibles
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
